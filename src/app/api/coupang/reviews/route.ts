import { NextRequest, NextResponse } from 'next/server';
import { fetchWithPlaywright } from './playwrightFetch';
import { fetchSummaryFromSearch } from '../searchSummary';

// Optional proxy (e.g., http://user:pass@proxyhost:port)


// Simple UA list for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];



/** Build request headers, using provided cookie (client or fallback) */
function buildHeaders(productId: string, cookie: string) {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `https://www.coupang.com/vp/products/${productId}`,
    'Cookie': cookie,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };
}

/** Main fetch logic – tries normal fetch first, falls back to puppeteer on 403 or block page */
async function fetchCoupangReviews(productId: string, cookie: string) {
  const url = `https://www.coupang.com/vp/products/reviews?productId=${productId}&page=1&size=20&sortBy=ORDER_SCORE_ASC&viRoleCode=2&ratingSummary=true`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(productId, cookie),
    });

    if (response.status === 403) {
      console.warn('[Coupang Reviews] 403 차단 → Playwright fallback');
      return await fetchWithPlaywright(productId, cookie);
    }

    const html = await response.text();
    if (html.includes('Access Denied') || html.includes('보안 확인')) {
      console.warn('[Coupang Reviews] 차단 페이지 감지 → Playwright fallback');
      return await fetchWithPlaywright(productId, cookie);
    }

    return parseReviewsFromHtml(html);
  } catch (e) {
    console.error('[Coupang Reviews] fetch 오류', e);
    return await fetchWithPlaywright(productId, cookie);
  }
}

/** Parse HTML to extract reviews and summary stats */
function parseReviewsFromHtml(html: string) {
  const reviews: any[] = [];
  
  // Extract summary stats (Rating and Total Count)
  const ratingMatch = html.match(/rating-star-num[^>]*>([\d\.]+)/) || html.match(/sdp-review__average__total-star__number[^>]*>([\d\.]+)/);
  const countMatch = html.match(/count[^>]*>([\d,]+)/) || html.match(/sdp-review__average__total-count[^>]*>([\d,]+)/);
  
  const summary = {
    rating: parseFloat(ratingMatch?.[1] || '0'),
    count: parseInt((countMatch?.[1] || '0').replace(/,/g, ''), 10)
  };

  const reviewBlocks = html.split(/sdp-review__article__list\s?/).slice(1);
  for (const block of reviewBlocks) {
    try {
      const nameMatch = block.match(/user__name[^>]*>([^<]+)/);
      const nickname = nameMatch ? nameMatch[1].trim() : '익명';
      const ratingMatchInner = block.match(/data-rating="(\d+)"/);
      const rating = ratingMatchInner ? Number(ratingMatchInner[1]) : 0;
      const headlineMatch = block.match(/headline[^>]*>([^<]+)/);
      const headline = headlineMatch ? headlineMatch[1].trim() : '';
      const contentMatch = block.match(/review__content[^>]*>([\s\S]*?)<\/div>/);
      let content = '';
      if (contentMatch) {
        content = contentMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      const dateMatch = block.match(/regdate[^>]*>([^<]+)/);
      const date = dateMatch ? dateMatch[1].trim() : '';
      if (content || headline) {
        reviews.push({ nickname, rating, headline, content, date });
      }
    } catch (e) {
      console.error('[Coupang Reviews] 파싱 오류', e);
    }
  }
  return { reviews, summary };
}

/** API entry point */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const onlySummary = searchParams.get('onlySummary') === 'true';

  if (!productId) {
    return NextResponse.json({ error: 'productId가 필요합니다.' }, { status: 400 });
  }

  const clientCookie = request.headers.get('x-client-cookie')?.trim();
  const envCookie = process.env.COUPANG_COOKIE || '';
  const cookieToUse = clientCookie || envCookie;

  console.log(`[Coupang Reviews API] Request for productId: ${productId}, onlySummary: ${onlySummary}`);

  try {
    let summary: { rating: number, count: number } = { rating: 0, count: 0 };
    let reviews: any[] = [];

    // Step 1: Optimized Summary Fetch (If requested, or as a more stable count source)
    if (onlySummary) {
      console.log(`[Coupang Reviews API] Fetching ONLY summary via Search...`);
      summary = await fetchSummaryFromSearch(productId, cookieToUse);
      return NextResponse.json({ summary, reviews: [], message: '요약 정보만 요청되었습니다.' });
    }

    // Step 2: Full Fetch (Try normal/detail first)
    const data = await fetchCoupangReviews(productId, cookieToUse);
    reviews = data.reviews || [];
    summary = data.summary || { rating: 0, count: 0 };

    // Step 3: Fallback Summary (If detailed fetch failed to get a count)
    if (summary.count === 0) {
      console.warn(`[Coupang Reviews API] Full fetch failed to get summary. Falling back to Search Summary...`);
      const searchData = await fetchSummaryFromSearch(productId, cookieToUse);
      if (searchData.count > 0) {
        summary = searchData;
        console.log(`[Coupang Reviews API] Search fallback success. Count: ${summary.count}`);
      }
    }
    
    if ((!reviews || reviews.length === 0) && (!summary || summary.count === 0)) {
      console.warn(`[Coupang Reviews API] No data found for productId: ${productId}`);
      return NextResponse.json({ 
        reviews: [], 
        summary: { rating: 0, count: 0 },
        message: '리뷰 정보를 가져올 수 없거나 쿠팡에서 차단을 당한 상태입니다.',
        debug: { 
          cookieUsed: !!cookieToUse,
          screenshot: '/debug.png'
        }
      });
    }
    
    console.log(`[Coupang Reviews API] Success. Reviews: ${reviews.length}, Total: ${summary.count}`);
    return NextResponse.json({ reviews, summary });
  } catch (err: any) {
    console.error('[Coupang Reviews API] Fatal Error:', err.message);
    return NextResponse.json({ 
      error: err.message || '리뷰를 가져오는 중 오류가 발생했습니다.',
      debug: {
        screenshot: '/debug.png',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
      }
    }, { status: 500 });
  }
}
