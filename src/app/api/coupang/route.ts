import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchCoupangViaNaver } from './naverSearch';
// Coupang Partners API는 이용 제한 누적으로 사용 불가. Naver Shopping API 경유로 전환.

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
    console.log(`[Search Handler] Start search for: "${keyword}"`);

    const debug = { cache: 'MISS', api: 0 };
    // Naver Shopping API는 일일 25,000 호출 한도가 있고 IP 공유 환경에서 429가 잦아
    // 캐시를 길게 유지해 호출량을 최소화.
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

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

    // 1) 캐시 miss이면 Naver Shopping API로 쿠팡 상품 조회
    let naverDiagnostic: any = null;
    if (coupangData.length === 0) {
      const naverResult = await fetchCoupangViaNaver(keyword);
      coupangData = naverResult.items;
      naverDiagnostic = naverResult.diagnostic;
      debug.api = coupangData.length;
      console.log(`[Search Handler] naver=${debug.api}`);
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

    console.log(`[Search Handler] Raw data count: ${coupangData.length}`);

    if (coupangData.length === 0) {
      console.error(`[Search Handler] No data from Naver API!`);
      return NextResponse.json({
        error: '검색 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
        debug: {
          keyword,
          apiDataCount: 0,
          source: 'naver',
          naver: naverDiagnostic,
          message: 'Naver Shopping returned 0 Coupang products. See `naver` diagnostic for cause.'
        }
      }, { status: 500 });
    }

    let finalResult = filterAndScoreProducts(coupangData, minPrice, maxPrice, keyword);

    finalResult = finalResult.map((product) => ({
      ...product,
      productImage: cleanCoupangImageUrl(product.productImage, product.productId),
    }));

    if (finalResult.length === 0) {
      console.warn(`[Search Handler] No products after filtering.`);
      return NextResponse.json({
        error: '필터링 후 검색 결과가 없습니다.',
        debug: {
          keyword,
          rawDataCount: coupangData.length,
          filteredCount: 0,
          message: 'All products filtered out'
        }
      }, { status: 200 });
    }

    console.log(`[Search Handler] ${finalResult.length} items remain after filtering.`);
    return NextResponse.json(finalResult, {
      headers: {
        'x-cache': debug.cache,
        'x-debug-api': String(debug.api),
        'x-debug-final': String(finalResult.length),
        'x-debug-source': 'naver',
        'x-debug-supabase': supabase ? 'on' : `off:${supabaseInitErr.slice(0, 60)}`,
      },
    });

  } catch (error: any) {
    console.error('[Search Fatal Error]:', error.message);
    return NextResponse.json({
      error: error.message || '검색 중 오류가 발생했습니다.'
    }, { status: 500 });
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
      // API 폴백 시 구분이 불가하므로 통합 표기 (UI에서 로켓/제트 등으로 표기)
      explicitDelivery = 'rocket_fallback';
    } else if (!explicitDelivery) {
      explicitDelivery = 'general';
    }
    const deliveryType = explicitDelivery;

    // 판매지수: 노출순위 + 가격 구간 + 배송 유형
    const deliverySaleBonus = (deliveryType === 'rocket' || deliveryType === 'rocket_fallback') ? 12 : deliveryType === 'jet' ? 8 : 0;
    const saleIndex = Math.min(120, rankScore + priceRangeScore + deliverySaleBonus);

    // 경쟁강도: 저가 + 배송유형 + 리뷰수 + 평점 (높을수록 진입 어려움)
    let baseComp = (price < 15000 ? 45 : price < 35000 ? 35 : price < 80000 ? 25 : 15);
    let deliveryComp = (deliveryType === 'rocket' || deliveryType === 'rocket_fallback') ? 25 : deliveryType === 'jet' ? 15 : 0;
    
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
    
    // Grade Logic (Bad 기준 대폭 완화 — floor=5라 거의 Good 이상 노출)
    let grade: 'Great' | 'Excellent' | 'Good' | 'Bad' = 'Bad';
    if (opportunityScore >= 50) grade = 'Great';
    else if (opportunityScore >= 30) grade = 'Excellent';
    else if (opportunityScore >= 5) grade = 'Good';
    else grade = 'Bad';

    return {
      ...item,
      deliveryType, // Ensure the mapped/heuristic deliveryType is returned to the client
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
