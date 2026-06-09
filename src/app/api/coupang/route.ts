import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchCoupangViaNaver } from './naverSearch';

// 데이터 소스: 네이버 쇼핑 API(쿠팡 상품 필터링) + 상위 N개 쿠팡 리뷰수 보강(순수 fetch).
// 쿠팡 파트너스 API는 리뷰/판매 데이터를 제공하지 않아 제거함.

// playwright/Node API를 쓰는 보강이 있으므로 Node.js 런타임 고정
export const runtime = 'nodejs';
export const maxDuration = 60;

// 쿠팡 페이지 스크래핑 시 사용할 쿠키(선택). 설정 시 보강 성공률 상승.
const COUPANG_COOKIE = (process.env.COUPANG_COOKIE || '').trim();
// SUPABASE_URL이 없으면 NEXT_PUBLIC_SUPABASE_URL로 fallback
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim();
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();


// Initialize Supabase safely
let supabase: any = null;
let supabaseInitErr = '';
try {
  if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    supabaseInitErr = `url=${!!SUPABASE_URL} key=${!!SUPABASE_KEY}`;
    console.warn(`[Supabase] Caching disabled: ${supabaseInitErr}`);
  }
} catch (e: any) {
  supabaseInitErr = e?.message || 'init throw';
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

  try {
    console.log(`[Coupang API Handler] Start search for: "${keyword}"`);

    const debug = { cache: 'MISS', api: 0 };
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시

    // 0) 캐시 조회 (5분 이내면 즉시 응답)
    let coupangData: any[] = [];
    if (supabase) {
      try {
        const { data: cached, error: cacheErr } = await supabase
          .from('coupang_cache')
          .select('data, updated_at')
          .eq('keyword', keyword)
          .maybeSingle();
        if (cacheErr) {
          console.warn(`[CACHE_READ_ERR] ${cacheErr.message?.slice(0, 100)}`);
        } else if (cached?.data && Array.isArray(cached.data)) {
          const ageMs = Date.now() - new Date(cached.updated_at).getTime();
          if (ageMs < CACHE_TTL_MS) {
            console.log(`[Cache] HIT "${keyword}" age=${Math.round(ageMs / 1000)}s`);
            debug.cache = 'HIT';
            coupangData = cached.data;
          }
        }
      } catch (e: any) {
        console.warn(`[CACHE_READ_THROW] ${e?.message?.slice(0, 100)}`);
      }
    }

    // 1) 캐시 miss이면 네이버 쇼핑 API로 쿠팡 상품 수집 후 상위 N개 리뷰수 보강
    if (coupangData.length === 0) {
      coupangData = await fetchCoupangViaNaver(keyword);
      debug.api = coupangData.length;
      console.log(`[Naver Handler] naver=${debug.api}`);

      // 상위 TOP_N 상품만 실제 쿠팡 리뷰수/평점 보강 (순수 fetch, best-effort)
      const TOP_N = 20;
      await enrichReviewCounts(coupangData.slice(0, TOP_N));
    }

    // Save to Supabase Cache (캐시 miss 일 때만 갱신)
    if (supabase && debug.cache === 'MISS' && coupangData.length > 0) {
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
    
    // 디버깅: 데이터가 있는지 먼저 확인
    console.log(`[Coupang API Handler] Raw data count: ${coupangData.length}`);

    if (coupangData.length === 0) {
      console.error(`[Coupang API Handler] No data from API!`);
      return NextResponse.json({
        error: 'API에서 데이터를 가져오지 못했습니다. 쿠팡 API 상태를 확인해주세요.',
        debug: {
          keyword,
          apiDataCount: 0,
          message: 'Both scraper and API returned 0 results'
        }
      }, { status: 500 });
    }

    // 4. Scored and Filtered (저가 기본 컷오프 15000원)
    let finalResult = filterAndScoreProducts(coupangData, minPrice || 15000, maxPrice, keyword);

    // 5. CLEAN IMAGE URLS for 1688 Search Stability (ads-partners → 실제 CDN URL 해소)
    // 이미 CDN URL인 경우 불필요한 네트워크 요청 생략
    finalResult = finalResult.map((product) => ({
      ...product,
      productImage: cleanCoupangImageUrl(product.productImage, product.productId),
    }));

    if (finalResult.length === 0) {
      console.warn(`[Coupang API Handler] No products after filtering.`);
      return NextResponse.json({
        error: '필터링 후 검색 결과가 없습니다.',
        debug: {
          keyword,
          rawDataCount: coupangData.length,
          filteredCount: 0,
          message: 'All products filtered out'
        }
      }, { status: 200 }); // 200으로 변경 (데이터는 있었으나 필터링됨)
    }

    console.log(`[Coupang API Handler] ${finalResult.length} items remain after filtering.`);
    return NextResponse.json(finalResult, {
      headers: {
        'x-cache': debug.cache,
        'x-debug-api': String(debug.api),
        'x-debug-final': String(finalResult.length),
        'x-debug-supabase': supabase ? 'on' : `off:${supabaseInitErr.slice(0, 60)}`,
      },
    });

  } catch (error: any) {
    console.error('[Coupang API Fatal Error]:', error.message);
    return NextResponse.json({ 
      error: error.message || '쿠팡 API 호출 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];

/** Promise에 타임아웃을 거는 헬퍼 (보강이 함수 전체를 지연시키지 않도록) */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch(() => { clearTimeout(t); resolve(fallback); });
  });
}

/**
 * 순수 fetch로 쿠팡 리뷰 요약(평점/리뷰수)을 가져온다. playwright 미사용 → 서버리스 호환.
 * 차단(403)/실패 시 {rating:0,count:0} 반환.
 */
async function fetchReviewSummary(productId: string | number): Promise<{ rating: number; count: number }> {
  const pid = String(productId);
  const url = `https://www.coupang.com/vp/products/reviews?productId=${pid}&page=1&size=1&sortBy=ORDER_SCORE_ASC&ratingSummary=true`;
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'Referer': `https://www.coupang.com/vp/products/${pid}`,
        ...(COUPANG_COOKIE ? { 'Cookie': COUPANG_COOKIE } : {}),
      },
    });
    if (!res.ok) return { rating: 0, count: 0 };
    const html = await res.text();
    if (html.includes('Access Denied') || html.includes('보안 확인')) return { rating: 0, count: 0 };

    const ratingMatch =
      html.match(/rating-star-num[^>]*>([\d.]+)/) ||
      html.match(/sdp-review__average__total-star__number[^>]*>([\d.]+)/);
    const countMatch =
      html.match(/sdp-review__average__total-count[^>]*>([\d,]+)/) ||
      html.match(/count[^>]*>([\d,]+)/);

    return {
      rating: parseFloat(ratingMatch?.[1] || '0'),
      count: parseInt((countMatch?.[1] || '0').replace(/,/g, ''), 10) || 0,
    };
  } catch {
    return { rating: 0, count: 0 };
  }
}

/**
 * 상위 상품 배열에 실제 리뷰수/평점을 in-place로 보강.
 * 동시성 4 + per-item 8s 타임아웃. 실패해도 reviewEnriched=false로 두고 진행(결과 비지 않음).
 */
async function enrichReviewCounts(products: any[]): Promise<void> {
  const CONCURRENCY = 4;
  const PER_ITEM_TIMEOUT = 8000;
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const chunk = products.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      chunk.map(async (p) => {
        if (!p || !p.productId) return;
        const summary = await withTimeout(
          fetchReviewSummary(p.productId),
          PER_ITEM_TIMEOUT,
          { rating: 0, count: 0 },
        );
        if (summary.count > 0) {
          p.ratingCount = summary.count;
          p.rating = summary.rating;
          p.reviewEnriched = true;
        }
      }),
    );
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
 * Data filtering and scoring logic
 */
function filterAndScoreProducts(items: any[], minPrice: number, maxPrice: number, searchKeyword: string = '') {
  console.log(`[Filter] Starting with ${items.length} items`);

  // Keywords that often appear as noise in unrelated searches (exclude them if they don't match the search)
  const noiseKeywords = ['글루타치온', '영양제', '비타민', '유산균', '콜라겐', '영양가득'];
  const searchWords = (searchKeyword || '').split(' ').filter(w => w.length >= 2);

  const filtered = items.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    
    const price = item.productPrice || 0;
    const name = (item.productName || '').toLowerCase();
    
    // 1. Price Filter
    if (price < minPrice || price > maxPrice) return false;

    // 2. Relevancy Filter (Keyword matching)
    // If the name contains noise keywords but the search doesn't, filter it out
    const containsNoise = noiseKeywords.some(noise => name.includes(noise));
    const searchHasNoise = noiseKeywords.some(noise => searchKeyword.toLowerCase().includes(noise));
    
    if (containsNoise && !searchHasNoise) {
      console.log(`[Filter] Removed irrelevant item (Noise): ${item.productName}`);
      return false;
    }

    // 3. Optional: Minimum word match (At least one significant word from search should appear)
    if (searchWords.length > 0) {
      const matchCount = searchWords.filter(word => name.includes(word.toLowerCase())).length;
      if (matchCount === 0 && searchWords.length >= 2) {
        // If we have multi-word search and zero matches, it's likely a weird recommendation/ad
        console.log(`[Filter] Removed irrelevant item (No Match): ${item.productName}`);
        return false;
      }
    }

    return true;
  });

  console.log(`[Filter] ${filtered.length} items passed filter`);

  const scored = filtered.map((item) => {
    const price = item.productPrice || 1;
    const rank = item.rank || 100;                 // 네이버 sim 순위 (1=인기 최상위)
    const ratingCount = item.ratingCount || 0;     // 보강된 실제 리뷰수 (실패 시 0)
    const rating = item.rating || 0;
    const reviewEnriched = !!item.reviewEnriched;  // 리뷰 보강 성공 여부

    // 배송 유형 (판매자로켓/그로스 분리)
    let explicitDelivery = item.deliveryType;
    if (!explicitDelivery && item.isRocket) {
      explicitDelivery = 'rocket_fallback';
    } else if (!explicitDelivery) {
      explicitDelivery = 'general';
    }
    const deliveryType = explicitDelivery;
    const isRocketType = deliveryType === 'rocket' || deliveryType === 'rocket_fallback';

    // 리뷰수 신호 (log 스케일, 0~100): 10→29, 100→56, 1000→84, 5000→100
    const reviewStrength = (reviewEnriched && ratingCount > 0)
      ? Math.min(100, Math.round(Math.log10(ratingCount + 1) * 28))
      : 0;

    // 네이버 인기순위 신호 (0~100): rank 1→100, 100→1
    const naverRankScore = Math.max(0, Math.min(100, 101 - rank));

    // 가격 구간 점수 (소싱 적합 가격대일수록 높음)
    const priceScore =
      price >= 15000 && price < 40000 ? 30 :   // 최적 소싱가
      price >= 40000 && price < 90000 ? 25 :   // 양호
      price >= 90000 && price < 250000 ? 15 :  // 중가
      price >= 250000 ? 8 : 0;                 // 고가 / 컷오프 경계
    const lowPricePenalty = price < 20000 ? 8 : 0;  // 저가 경계권 소폭 감점

    // 판매지수: 리뷰수 + 네이버 인기순위 중심 (보강 실패 시 순위만으로 폴백)
    const saleIndex = reviewEnriched
      ? Math.min(100, Math.round(reviewStrength * 0.65 + naverRankScore * 0.35))
      : Math.min(100, Math.round(naverRankScore * 0.9));

    // 경쟁강도: 실제 리뷰수 기반으로 의미 회복 (높을수록 진입 어려움)
    let reviewComp = 0;
    if (ratingCount > 5000) reviewComp = 50;
    else if (ratingCount > 1000) reviewComp = 40;
    else if (ratingCount > 300) reviewComp = 28;
    else if (ratingCount > 50) reviewComp = 15;
    else if (ratingCount > 0) reviewComp = 6;
    const qualityComp = (rating >= 4.5 && ratingCount > 400) ? 12 : 0;
    const deliveryComp = isRocketType ? 20 : deliveryType === 'jet' ? 12 : 0;
    const priceComp = price < 15000 ? 18 : price < 35000 ? 10 : 0;
    const competitionStrength = Math.min(100, reviewComp + qualityComp + deliveryComp + priceComp);

    // 매력도(소싱적합): 비로켓 우대 + 가격 적합 + 어느정도 팔리는 시장
    const nonRocketBonus = deliveryType === 'general' ? 22 : deliveryType === 'jet' ? 10 : 0;
    const sourcingScore = Math.min(100, Math.round(
      priceScore * 1.2 + nonRocketBonus + (saleIndex / 100) * 25 - lowPricePenalty
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

    // 소싱 기회 지수: 시장수요(35%) + 소싱적합성(30%) + 진입용이성(35%)
    let opportunityScore = Math.round(
      (saleIndex / 100) * 35
      + (sourcingScore / 100) * 30
      + ((100 - competitionStrength) / 100) * 35
    );

    // Apply Penalties (Sliding Scale)
    let redOceanPenalty = 0;
    if (isExactRed) redOceanPenalty = 25;
    else if (isContainsRed) {
      const nameWords = lowerName.split(' ').filter((w: string) => w.length > 1).length;
      redOceanPenalty = Math.max(8, 22 - (nameWords * 2));
    }

    opportunityScore -= redOceanPenalty;
    if (hasBrand) opportunityScore -= 15;
    opportunityScore -= lowPricePenalty;
    opportunityScore = Math.max(0, Math.min(100, opportunityScore));  // floor 제거 (인플레이션 차단)

    // Grade Logic: 판매신호 없는 Great 차단, 저리뷰·저가가 Good 못 되게
    let grade: 'Great' | 'Excellent' | 'Good' | 'Bad';
    if (opportunityScore >= 65 && saleIndex >= 40) grade = 'Great';
    else if (opportunityScore >= 50) grade = 'Excellent';
    else if (opportunityScore >= 35) grade = 'Good';
    else grade = 'Bad';

    return {
      ...item,
      deliveryType,
      reviewEnriched,
      calculated: {
        saleIndex,
        competitionStrength,
        sourcingScore,
        opportunityScore,
        grade,
      }
    };
  });

  // 결정적 정렬: 리뷰/판매 신호(saleIndex) 우선 → tie-break 고정으로 동일 키워드 동일 순서 보장
  const sorted = scored.sort((a, b) => {
    const s = b.calculated.saleIndex - a.calculated.saleIndex;
    if (s !== 0) return s;
    const o = b.calculated.opportunityScore - a.calculated.opportunityScore;
    if (o !== 0) return o;
    const r = (b.ratingCount || 0) - (a.ratingCount || 0);
    if (r !== 0) return r;
    const n = (a.rank || 9999) - (b.rank || 9999);
    if (n !== 0) return n;
    return (Number(a.productId) || 0) - (Number(b.productId) || 0);
  });
  console.log(`[Filter] Final result: ${sorted.length} scored and sorted items`);
  return sorted;
}
