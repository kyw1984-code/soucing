/**
 * Naver Shopping API로 쿠팡 상품만 필터링해서 가져오기
 * - 쿠팡 파트너스 API rate limit 회피
 * - 일 25,000회 호출 가능 (수강생 배포에 충분)
 */

// 다양한 환경변수 이름 모두 시도 (사용자 등록 이름에 따라)
const NAVER_CLIENT_ID = (
  process.env.NAVER_CLIENT_ID ||
  process.env.NAVER_API_CLIENT_ID ||
  process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ||
  process.env.NAVER_ID ||
  ''
).trim();
const NAVER_CLIENT_SECRET = (
  process.env.NAVER_CLIENT_SECRET ||
  process.env.NAVER_API_CLIENT_SECRET ||
  process.env.NAVER_SECRET ||
  process.env.NAVER_API_SECRET ||
  ''
).trim();

interface NaverShopItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

export interface NaverCallDiag {
  query: string;
  sort: string;
  status: number | null;
  errorText: string | null;
  rawCount: number;
  retries: number;
}

export interface NaverDiagnostic {
  envMissing: boolean;
  idLen: number;
  secretLen: number;
  calls: NaverCallDiag[];
  totalRaw: number;
  coupangCount: number;
  uniqueCount: number;
  topMalls: string[];
  idExtraction: { coupang: number; naver: number; noId: number };
  sampleCoupangLink: string | null;
}

interface CallResult {
  items: NaverShopItem[];
  status: number | null;
  errorText: string | null;
  retries: number;
}

async function searchNaverShopping(
  keyword: string,
  start = 1,
  display = 100,
  sort: 'sim' | 'date' | 'asc' | 'dsc' = 'sim',
  retryCount = 0,
): Promise<CallResult> {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=${display}&start=${start}&sort=${sort}`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });
    if (res.status === 429 && retryCount < 2) {
      const wait = 600 + retryCount * 800;
      console.warn(`[NAVER_429] retry "${keyword}" start=${start} after ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      return searchNaverShopping(keyword, start, display, sort, retryCount + 1);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[NAVER_${res.status}] "${keyword}" start=${start}: ${text.slice(0, 120)}`);
      return { items: [], status: res.status, errorText: text.slice(0, 200), retries: retryCount };
    }
    const data = await res.json();
    return {
      items: Array.isArray(data.items) ? data.items : [],
      status: res.status,
      errorText: null,
      retries: retryCount,
    };
  } catch (e: any) {
    console.error(`[NAVER_ERR] "${keyword}": ${e?.message}`);
    return { items: [], status: null, errorText: `network: ${e?.message || String(e)}`, retries: retryCount };
  }
}

function stripHtmlAndDecode(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractCoupangProductId(link: string): string | null {
  if (!link) return null;
  // 쿠팡 상품 URL 다양한 패턴 모두 시도
  const patterns = [
    /\/vp\/products\/(\d+)/,    // www.coupang.com/vp/products/12345
    /\/np\/products\/(\d+)/,    // 모바일/대체 경로
    /products\/(\d+)/,          // 범용
    /productId=(\d+)/i,         // 쿼리 파라미터
    /pid=(\d+)/i,               // 쿠팡 단축 링크
  ];
  for (const p of patterns) {
    const m = link.match(p);
    if (m) return m[1];
  }
  return null;
}

function detectDeliveryType(title: string): 'rocket' | 'jet' | 'general' {
  const lower = title.toLowerCase();
  if (lower.includes('판매자로켓') || lower.includes('로켓그로스')) return 'jet';
  if (lower.includes('로켓배송') || lower.includes('로켓')) return 'rocket';
  return 'general';
}

/**
 * 키워드로 네이버 쇼핑 검색 → 쿠팡 상품만 필터링 → 중복 제거된 상품 배열 반환
 */
export async function fetchCoupangViaNaver(
  keyword: string,
): Promise<{ items: any[]; diagnostic: NaverDiagnostic }> {
  const diagnostic: NaverDiagnostic = {
    envMissing: false,
    idLen: NAVER_CLIENT_ID.length,
    secretLen: NAVER_CLIENT_SECRET.length,
    calls: [],
    totalRaw: 0,
    coupangCount: 0,
    uniqueCount: 0,
    topMalls: [],
    idExtraction: { coupang: 0, naver: 0, noId: 0 },
    sampleCoupangLink: null,
  };

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    diagnostic.envMissing = true;
    console.error(`[NAVER_MISSING] id=${!!NAVER_CLIENT_ID} secret=${!!NAVER_CLIENT_SECRET}`);
    return { items: [], diagnostic };
  }
  console.log(`[NAVER_START] id_len=${diagnostic.idLen} secret_len=${diagnostic.secretLen}`);

  // 쿠팡 상품이 sim 정렬 100위 내에 거의 안 잡히는 키워드(패션·잡화 등) 대응:
  // (1) 원본 키워드, (2) "{keyword} 쿠팡" 명시 검색, (3) date 정렬로 신상품 풀
  // 순차 호출 + 200ms 간격으로 429 방지. 내부 retry까지 합쳐 안정성 확보.
  const queries: { kw: string; sort: 'sim' | 'date' }[] = [
    { kw: keyword, sort: 'sim' },
    { kw: `${keyword} 쿠팡`, sort: 'sim' },
    { kw: keyword, sort: 'date' },
  ];

  const allItems: NaverShopItem[] = [];
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const r = await searchNaverShopping(q.kw, 1, 100, q.sort);
    diagnostic.calls.push({
      query: q.kw,
      sort: q.sort,
      status: r.status,
      errorText: r.errorText,
      rawCount: r.items.length,
      retries: r.retries,
    });
    allItems.push(...r.items);
    if (i < queries.length - 1) {
      await new Promise((res) => setTimeout(res, 200));
    }
  }
  diagnostic.totalRaw = allItems.length;

  // 상위 mallName 카운트 (어떤 몰이 응답에 많은지 확인용)
  const mallCounts: Record<string, number> = {};
  for (const item of allItems) {
    const mall = (item.mallName || '(empty)').slice(0, 30);
    mallCounts[mall] = (mallCounts[mall] || 0) + 1;
  }
  diagnostic.topMalls = Object.entries(mallCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([m, c]) => `${m}(${c})`);

  const coupangOnly = allItems.filter((item) => {
    if (item.link && /coupang\.com/i.test(item.link)) return true;
    if (item.mallName && /쿠팡|coupang/i.test(item.mallName)) return true;
    return false;
  });
  diagnostic.coupangCount = coupangOnly.length;
  diagnostic.sampleCoupangLink = coupangOnly[0]?.link?.slice(0, 120) || null;

  const seen = new Set<string>();
  const products: any[] = [];
  for (const item of coupangOnly) {
    // 1순위: 쿠팡 URL에서 productId 추출
    let productId = extractCoupangProductId(item.link);
    if (productId) {
      diagnostic.idExtraction.coupang++;
    } else if (item.productId) {
      // 2순위: Naver catalog ID로 폴백 (쿠팡 URL 패턴이 아닐 때)
      productId = String(item.productId);
      diagnostic.idExtraction.naver++;
    } else {
      diagnostic.idExtraction.noId++;
      continue;
    }
    if (seen.has(productId)) continue;
    seen.add(productId);

    const name = stripHtmlAndDecode(item.title);
    const price = parseInt(item.lprice, 10) || 0;
    if (!name || price <= 0) continue;

    products.push({
      productId: parseInt(productId, 10) || productId,
      productName: name,
      productPrice: price,
      productImage: item.image,
      productUrl: item.link,
      rating: 0,
      ratingCount: 0,
      isRocket: false,
      deliveryType: detectDeliveryType(name),
      rank: products.length + 1,
      source: 'naver',
      brand: stripHtmlAndDecode(item.brand || item.maker || ''),
      category: item.category1 || '',
    });
  }
  diagnostic.uniqueCount = products.length;

  console.log(
    `[Naver API] keyword="${keyword}" calls=${diagnostic.calls.length} raw=${diagnostic.totalRaw} coupang=${diagnostic.coupangCount} unique=${diagnostic.uniqueCount}`,
  );
  return { items: products, diagnostic };
}
