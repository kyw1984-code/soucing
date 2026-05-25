/**
 * Naver Shopping API로 쿠팡 상품만 필터링해서 가져오기
 * - 쿠팡 파트너스 API rate limit 회피
 * - 일 25,000회 호출 가능 (수강생 배포에 충분)
 */

const NAVER_CLIENT_ID = (process.env.NAVER_CLIENT_ID || '').trim();
const NAVER_CLIENT_SECRET = (process.env.NAVER_CLIENT_SECRET || '').trim();

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
    console.error('[Naver API] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되어 있지 않습니다.');
    return [];
  }

  // 4개 변형 × 3 페이지 × 3 sort = 36회 호출
  // - 검색어에 "쿠팡" 명시해서 쿠팡 결과 비중 ↑
  // - sort 다양화로 같은 키워드라도 진짜 다른 상품 가져오기 (인기순/최신순/가격순)
  const variations = [
    keyword,
    `${keyword} 쿠팡`,
    `${keyword} 추천`,
    `${keyword} 인기`,
  ];
  const sorts: Array<'sim' | 'date' | 'asc'> = ['sim', 'date', 'asc'];
  const pages = [1, 101, 201];

  const callPlan: Array<{ kw: string; start: number; sort: 'sim' | 'date' | 'asc' }> = [];
  for (const kw of variations) {
    for (const sort of sorts) {
      for (const start of pages) {
        callPlan.push({ kw, start, sort });
      }
    }
  }

  const results = await Promise.all(
    callPlan.map(({ kw, start, sort }) => searchNaverShopping(kw, start, 100, sort)),
  );

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
