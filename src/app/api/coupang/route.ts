import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeCoupangSearch } from './playwrightSearch';
// Imports for on-demand enrichment moved to separate routes

// Use default Node.js runtime for better stability on Windows dev environments

// Environment variables
const ACCESS_KEY = (process.env.COUPANG_PARTNERS_ACCESS_KEY || '').trim();
const SECRET_KEY = (process.env.COUPANG_PARTNERS_SECRET_KEY || '').trim();
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();


// Initialize Supabase safely
let supabase: any = null;
try {
  if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('[Supabase] Missing or malformed URL. Caching disabled.');
  }
} catch (e) {
  console.error('[Supabase] Initialization failed:', e);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || Number.MAX_SAFE_INTEGER;

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }

  // Validate API credentials
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.error('[Coupang API] Missing credentials - ACCESS_KEY or SECRET_KEY not set');
    return NextResponse.json({
      error: '쿠팡 파트너스 API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.',
      details: {
        hasAccessKey: !!ACCESS_KEY,
        hasSecretKey: !!SECRET_KEY
      }
    }, { status: 500 });
  }

  if (ACCESS_KEY.length < 20 || SECRET_KEY.length < 20) {
    console.error('[Coupang API] Invalid credentials - Keys appear to be too short');
    return NextResponse.json({
      error: '쿠팡 파트너스 API 키가 올바르지 않습니다. 키를 다시 확인해주세요.',
    }, { status: 500 });
  }

  try {
    const clientCookie = request.headers.get('x-client-cookie') || '';
    const cookieToUse = clientCookie || process.env.COUPANG_COOKIE || '';

    console.log(`[Coupang API Handler] Start search for: "${keyword}"`);

    // 1. Try Scraper First (Better Images, More Metadata)
    let coupangData: any[] = [];
    try {
      console.log(`[Coupang API Handler] Attempting Scraper-First Search...`);
      coupangData = await scrapeCoupangSearch(keyword, cookieToUse);
      if (coupangData && coupangData.length > 0) {
        console.log(`[Coupang API Handler] Scraper success: ${coupangData.length} items found.`);
      }
    } catch (scrapError: any) {
      console.error(`[Coupang API Handler] Scraper failed:`, scrapError.message);
    }

    // 2. Fallback to Partners API if Scraper failed or returned 0 results
    if (!coupangData || coupangData.length === 0) {
      console.log(`[Coupang API Handler] Falling back to Partners API...`);
      coupangData = await fetchCoupangProducts(keyword);
      coupangData = coupangData.map((item: any) => ({ ...item, source: 'api' }));
    } else {
      coupangData = coupangData.map((item: any) => ({ ...item, source: 'scraper' }));
    }

    // Save to Supabase Cache (Silent Fail)
    if (supabase && coupangData.length > 0) {
      try {
        await supabase.from('coupang_cache').upsert({
          keyword,
          data: coupangData,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {}
    }

    // 3. (REMOVED) Enrichment moved to on-demand sourcing analysis to speed up initial response.
    // Use raw coupangData directly.
    
    // 4. Scored and Filtered
    let finalResult = filterAndScoreProducts(coupangData, minPrice, maxPrice);

    // 5. CLEAN IMAGE URLS for 1688 Search Stability (ads-partners → 실제 CDN URL 해소)
    // 이미 CDN URL인 경우 불필요한 네트워크 요청 생략
    finalResult = finalResult.map((product) => ({
      ...product,
      productImage: cleanCoupangImageUrl(product.productImage, product.productId),
    }));
    
    if (finalResult.length === 0) {
      console.warn(`[Coupang API Handler] No products found after filtering.`);
      return NextResponse.json({ 
        products: [], 
        error: '검색 결과가 없거나 접근이 차단되었습니다.',
        debug: { screenshot: '/search_debug.png' }
      });
    }

    console.log(`[Coupang API Handler] ${finalResult.length} items remain after filtering.`);
    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error('[Coupang API Fatal Error]:', error.message);
    return NextResponse.json({ 
      error: error.message || '쿠팡 API 호출 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

/**
 * Ensures it returns a standard Coupang CDN URL (thumbnail.coupangcdn.com)
 * compatible with 1688/AliPrice bots. Handles restricted ads-partners URLs.
 */
async function resolveImageUrl(imageUrl: string): Promise<string> {
  if (!imageUrl || !imageUrl.includes('ads-partners.coupang.com')) return imageUrl;
  try {
    const res = await fetch(imageUrl, { method: 'HEAD', redirect: 'follow' });
    return res.url || imageUrl;
  } catch {
    return imageUrl;
  }
}

function cleanCoupangImageUrl(imageUrl: string, productId: string | number): string {
  if (!imageUrl) return '';
  
  // 1. If it's already a clean CDN URL, skip basic cleanup
  if (imageUrl.includes('thumbnail.coupangcdn.com')) {
    // Strip trailing query parameters that might break some crawlers
    return imageUrl.split('?')[0];
  }

  // 2. If it's an 'ads-partners' or restricted URL, try to reconstruct using productId
  // Note: Standard Coupang thumbnails use the productId and often a fixed size.
  // We can also try simple URL cleaning (removing extra parameters).
  if (imageUrl.includes('ads-partners.coupang.com')) {
    console.log(`[Image Cleaner] Cleaning restricted URL for product ${productId}...`);
    // Fallback: If we can't fully reconstruct, at least try to remove the tokens/parameters
    // but usually these tracker URLs need the standard CDN path.
    // We'll also return it as-is but cleaned, though priority is standard CDN.
    return imageUrl.split('?')[0];
  }

  return imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl;
}




/**
 * Generates HMAC signature using Web Crypto API (Edge compatible)
 */
async function generateSignature(method: string, path: string, query: string) {
  const now = new Date();
  
  const yy = now.getUTCFullYear().toString().substring(2);
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = now.getUTCDate().toString().padStart(2, '0');
  const hh = now.getUTCHours().toString().padStart(2, '0');
  const min = now.getUTCMinutes().toString().padStart(2, '0');
  const ss = now.getUTCSeconds().toString().padStart(2, '0');
  
  const timestamp = `${yy}${mm}${dd}T${hh}${min}${ss}Z`;
  const message = timestamp + method + path + query;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { timestamp, signature };
}

/**
 * Fetches products for a single keyword from Coupang Partners API
 */
async function fetchByKeyword(keyword: string): Promise<any[]> {
  const method = 'GET';
  const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
  const query = `keyword=${encodeURIComponent(keyword)}&limit=10`;
  const url = `https://api-gateway.coupang.com${path}?${query}`;

  const { timestamp, signature } = await generateSignature(method, path, query);
  const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${timestamp}, signature=${signature}`;

  console.log(`[Coupang API Calling] keyword="${keyword}"`);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization,
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`[Coupang API HTTP Error] ${response.status}: ${responseText}`);
    return [];
  }

  try {
    const data = JSON.parse(responseText);
    if (!data) return [];

    if (data.rCode && data.rCode !== "0000" && data.rCode !== "0" && data.rCode !== 0) {
      console.error(`[Coupang API Result Error] rCode: ${data.rCode}, Msg: ${data.rMessage}`);
      return [];
    }

    let items: any[] = [];
    if (data.data && data.data.productData) items = data.data.productData;
    else if (data.data && data.data.productDtos) items = data.data.productDtos;
    else if (data.productData) items = data.productData;
    else if (data.productDtos) items = data.productDtos;
    else if (Array.isArray(data.data)) items = data.data;
    else if (Array.isArray(data)) items = data;

    console.log(`[Coupang API Parser] keyword="${keyword}" extracted ${items.length} items`);
    return Array.isArray(items) ? items : [];
  } catch (e: any) {
    console.error(`[Coupang API Parser] parse error:`, e.message);
    return [];
  }
}

/**
 * 키워드 변형을 만들어 여러 번 검색 후 productId 기준 중복 제거, 최소 30개 이상 확보
 */
async function fetchCoupangProducts(keyword: string): Promise<any[]> {
  // 다양한 변형 키워드로 검색 범위 확대 (중복 제거로 30개 이상 확보)
  const variations = [
    keyword,
    `${keyword} 추천`,
    `${keyword} 인기`,
    `${keyword} 베스트`
  ];

  // 병렬로 모든 변형 검색
  const results = await Promise.all(
    variations.map(kw => fetchByKeyword(kw))
  );

  // productId 기준 중복 제거 (원본 키워드 결과 우선)
  const seen = new Set<number>();
  const combined: any[] = [];
  for (const items of results) {
    for (const item of items) {
      if (item && item.productId && !seen.has(item.productId)) {
        seen.add(item.productId);
        combined.push(item);
      }
    }
  }

  // rank 재부여
  combined.forEach((item, i) => { item.rank = i + 1; });

  console.log(`[Coupang API] Total fetched: ${results.flat().length}, unique: ${combined.length}`);
  return combined;
}




// Note: enrichWithScrapedReviews has been replaced by enrichProductDetails in playwrightSearch.ts


/**
 * Data filtering and scoring logic
 */
function filterAndScoreProducts(items: any[], minPrice: number, maxPrice: number) {
  console.log(`[Filter] Starting with ${items.length} items`);

  const filtered = items.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const price = item.productPrice || 0;
    const passes = price >= minPrice && price <= maxPrice;
    if (!passes) console.log(`[Filter] Filtered out: ${item.productName?.substring(0, 30)} (Price: ${price})`);
    return passes;
  });

  console.log(`[Filter] ${filtered.length} items passed filter`);

  const scored = filtered.map((item) => {
    const price = item.productPrice || 1;
    const rank = item.rank || 10;
    const isRocket = item.isRocket ? 1 : 0;
    const ratingCount = item.ratingCount || 0;
    const rating = item.rating || 0;

    // 가격 구간 점수 (소싱 적합 가격대일수록 높음)
    const priceRangeScore =
      price >= 15000 && price < 40000 ? 30 :   // 최적 소싱가 (소폭 상향)
      price >= 40000 && price < 90000 ? 25 :   // 양호
      price >= 90000 && price < 250000 ? 15 :  // 중가
      price >= 5000 && price < 15000 ? 15 :    // 저가
      price >= 250000 ? 5 : 5;                 // 고가 / 초저가

    // 노출순위 점수 (rank 1 = 최고)
    const rankScore = (11 - rank) * 8;

    // 배송 유형 (판매자로켓/그로스 분리)
    let explicitDelivery = item.deliveryType;
    if (!explicitDelivery && isRocket) {
      // API 폴백 시 로켓 상품의 약 25%를 판매자로켓(제트/그로스)으로 분류 (상품 ID 기반 고정 난수 사용)
      const productIdHash = parseInt((item.productId || '0').toString().slice(-2), 10);
      explicitDelivery = productIdHash < 25 ? 'jet' : 'rocket';
    } else if (!explicitDelivery) {
      explicitDelivery = 'general';
    }
    const deliveryType = explicitDelivery;

    // 판매지수: 노출순위 + 가격 구간 + 배송 유형
    const deliverySaleBonus = deliveryType === 'rocket' ? 12 : deliveryType === 'jet' ? 8 : 0;
    const saleIndex = Math.min(120, rankScore + priceRangeScore + deliverySaleBonus);

    // 경쟁강도: 저가 + 배송유형 + 리뷰수 + 평점 (높을수록 진입 어려움)
    let baseComp = (price < 15000 ? 45 : price < 35000 ? 35 : price < 80000 ? 25 : 15);
    let deliveryComp = deliveryType === 'rocket' ? 25 : deliveryType === 'jet' ? 15 : 0;
    
    // 리뷰 수에 따른 심각한 페널티 (Coupang의 핵심 경쟁 지표)
    let reviewComp = 0;
    if (ratingCount > 5000) reviewComp = 45;
    else if (ratingCount > 1000) reviewComp = 35;
    else if (ratingCount > 300) reviewComp = 25;
    else if (ratingCount > 50) reviewComp = 10;

    // 압도적 평점 가산 (많은 리뷰 + 높은 평점 = 진입 불가)
    let qualityComp = (rating >= 4.5 && ratingCount > 400) ? 15 : 0;

    const competitionStrength = Math.min(100, baseComp + deliveryComp + reviewComp + qualityComp);

    // 매력도: 판매지수 반영 + 로켓 아닌 상품 우대(직접 소싱 가능) + 가격 구간
    const nonRocketBonus = deliveryType === 'general' ? 20 : deliveryType === 'jet' ? 10 : 0;
    const sourcingScore = Math.min(100, Math.round(
      rankScore * 0.5 + priceRangeScore * 0.8 + nonRocketBonus
    ));

    const redOceans = [
      '이어폰', '블루투스', '텐트', '캠핑텐트', '마스크', '생수', '기저귀', '충전기', '케이블', 
      '침대', '의자', '양말', '물티슈', '샴푸', '치약', '칫솔', '비타민', '영양제', '슬리퍼', 
      '텀블러', '선스크린', '면도기', '물통', '베개'
    ];
    const brandKeywords = ['삼성', 'SAMSUNG', 'LG', '애플', 'APPLE', '샤오미', '나이키', '아디다스', '다이소', '필립스'];
    
    const lowerName = (item.productName || '').toLowerCase();
    const isExactRed = redOceans.some(red => lowerName === red.toLowerCase());
    const isContainsRed = redOceans.some(red => lowerName.includes(red.toLowerCase()));
    const hasBrand = brandKeywords.some(brand => lowerName.includes(brand.toLowerCase()));

    // 소싱 기회 지수: 시장수요(30%) + 소싱적합성(30%) + 진입용이성(40%)
    // 진입용이성(경쟁강도 역산)의 비중을 높여 현실적인 소싱 가능성을 평가
    let opportunityScore = Math.round(
      (saleIndex / 120) * 30
      + (sourcingScore / 100) * 30
      + ((100 - competitionStrength) / 100) * 40
    );

    // Apply Penalties (Sliding Scale)
    let redOceanPenalty = 0;
    if (isExactRed) redOceanPenalty = 25;
    else if (isContainsRed) {
      // generic words check: more words usually means more niche
      const nameWords = lowerName.split(' ').filter((w: string) => w.length > 1).length;
      redOceanPenalty = Math.max(8, 22 - (nameWords * 2));
    }

    opportunityScore -= redOceanPenalty;
    if (hasBrand) opportunityScore -= 15; // 20 -> 15 (slightly softened)
    
    // Floor at 5
    opportunityScore = Math.max(5, opportunityScore);
    
    // Balanced Grade Logic (Goldilocks Range)
    let grade: 'Excellent' | 'Good' | 'Fair' | 'Bad' = 'Bad';
    if (opportunityScore >= 80) grade = 'Excellent';      // 85 -> 80
    else if (opportunityScore >= 65) grade = 'Good';       // 70 -> 65
    else if (opportunityScore >= 45) grade = 'Fair';       // 50 -> 45
    else grade = 'Bad';

    return {
      ...item,
      calculated: {
        saleIndex,
        competitionStrength,
        sourcingScore,
        opportunityScore,
        grade,
      }
    };
  });

  const sorted = scored.sort((a, b) => b.calculated.sourcingScore - a.calculated.sourcingScore);
  console.log(`[Filter] Final result: ${sorted.length} scored and sorted items`);
  return sorted;
}
