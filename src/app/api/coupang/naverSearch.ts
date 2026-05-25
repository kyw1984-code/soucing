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

async function searchNaverShopping(
  keyword: string,
  start = 1,
  display = 100,
  sort: 'sim' | 'date' | 'asc' | 'dsc' = 'sim',
): Promise<NaverShopItem[]> {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=${display}&start=${start}&sort=${sort}`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[Naver API] HTTP ${res.status} for "${keyword}" start=${start}: ${text.slice(0, 200)}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (e: any) {
    console.error(`[Naver API] Fetch error for "${keyword}": ${e?.message}`);
    return [];
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
  // https://www.coupang.com/vp/products/12345?... → "12345"
  const m = link.match(/\/vp\/products\/(\d+)/);
  return m ? m[1] : null;
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
export async function fetchCoupangViaNaver(keyword: string): Promise<any[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.error(`[NAVER_MISSING] id=${!!NAVER_CLIENT_ID} secret=${!!NAVER_CLIENT_SECRET}`);
    return [];
  }
  console.log(`[NAVER_START] id_len=${NAVER_CLIENT_ID.length} secret_len=${NAVER_CLIENT_SECRET.length}`);

  // Naver 검색 API는 초당 ~10회 제한. 동시 호출 너무 많으면 429.
  // 안전하게 6회 동시 호출 × 3 batch = 총 18회. 각 batch 사이 400ms 대기.
  const variations = [
    keyword,
    `${keyword} 쿠팡`,
    `${keyword} 추천`,
    `${keyword} 인기`,
    `${keyword} 베스트`,
    `${keyword} 가성비`,
  ];
  const sorts: Array<'sim' | 'date' | 'asc'> = ['sim', 'date', 'asc'];

  // 변형 6개 × sort 3개 = 18회 호출 (페이지는 start=1만, rate limit 회피)
  const callPlan: Array<{ kw: string; start: number; sort: 'sim' | 'date' | 'asc' }> = [];
  for (const kw of variations) {
    for (const sort of sorts) {
      callPlan.push({ kw, start: 1, sort });
    }
  }

  // 6개씩 배치 처리, 배치 사이 400ms 대기 (네이버 초당 10회 한도 안전)
  const BATCH_SIZE = 6;
  const BATCH_DELAY_MS = 400;
  const results: NaverShopItem[][] = [];
  for (let i = 0; i < callPlan.length; i += BATCH_SIZE) {
    const batch = callPlan.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(({ kw, start, sort }) => searchNaverShopping(kw, start, 100, sort)),
    );
    results.push(...batchResults);
    if (i + BATCH_SIZE < callPlan.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  // 쿠팡 상품만 필터링 (link 우선 — mallName 변형이 많아서)
  const coupangOnly = results.flat().filter((item) => {
    if (item.link && /coupang\.com/i.test(item.link)) return true;
    if (item.mallName && /쿠팡|coupang/i.test(item.mallName)) return true;
    return false;
  });

  // productId 기준 중복 제거 (먼저 들어온 결과 우선)
  const seen = new Set<string>();
  const products: any[] = [];
  for (const item of coupangOnly) {
    const productId = extractCoupangProductId(item.link);
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);

    const name = stripHtmlAndDecode(item.title);
    const price = parseInt(item.lprice, 10) || 0;
    if (!name || price <= 0) continue;

    products.push({
      productId: parseInt(productId, 10),
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

  console.log(
    `[Naver API] keyword="${keyword}" raw=${results.flat().length} coupang=${coupangOnly.length} unique=${products.length}`,
  );
  return products;
}
