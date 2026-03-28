import { chromium } from 'playwright';
import { fetchSummaryFromSearch } from '../searchSummary';

/**
 * Super Stealth Fetch V2 using Local Chrome Channel.
 * Bypasses Akamai by using rotating user-agents, session warming, and human logic.
 */
const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
];

export async function fetchWithPlaywright(productId: string, cookie: string) {
  const productUrl = `https://m.coupang.com/vm/products/${productId}`; 
  const reviewAjaxUrl = `https://m.coupang.com/vm/products/reviews?productId=${productId}&page=1&size=20&sortBy=ORDER_SCORE_ASC&viRoleCode=2&ratingSummary=true`;
  const screenshotPath = '/Users/youngwookkim/Downloads/훈프로 소싱 파인더/public/debug.png';

  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('iPhone');

  const browser = await chromium.launch({ 
    headless: true,
    channel: 'chrome', 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  }).catch(() => chromium.launch({ headless: true, args: ['--no-sandbox'] }));
  
  try {
    const context = await browser.newContext({
      userAgent,
      viewport: isMobile ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      isMobile,
      hasTouch: isMobile,
    });

    await context.addInitScript(() => {
      // @ts-ignore
      delete navigator.__proto__.webdriver;
      // @ts-ignore
      window.chrome = { runtime: {} };
    });

    const page = await context.newPage();

    if (cookie) {
      const cookies = cookie.split(';')
        .map(s => s.trim())
        .filter(s => s.includes('=') && s.length > 3)
        .map(s => {
          const parts = s.split('=');
          return { name: parts[0].trim(), value: parts.slice(1).join('=').trim(), url: 'https://m.coupang.com' };
        }).filter(c => !!c.name);
      if (cookies.length > 0) await context.addCookies(cookies);
    }

    // --- STEP 1: Session Warming ---
    await page.goto('https://www.coupang.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000 + Math.random() * 1500);

    // --- STEP 2: Visit Product Page ---
    const response = await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (response && response.status() === 403) {
      console.warn(`[PlaywrightFetch] 403 on detail page. Falling back to Search Summary...`);
      const searchSummary = await fetchSummaryFromSearch(productId, cookie);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      return { reviews: [], summary: searchSummary };
    }

    await page.waitForTimeout(1000);
    
    // Scrape Summary
    const summary = await page.evaluate(() => {
        const rating = document.querySelector('.rating-star-num, .rating-score, em.rating, .rating, i.star-score')?.textContent?.trim();
        const count = document.querySelector('.total-count, .rating-total-count, .review-count, .count')?.textContent?.trim();
        const dRating = document.querySelector('.sdp-review__average__total-star__number')?.textContent?.trim();
        const dCount = document.querySelector('.sdp-review__average__total-count')?.textContent?.trim();
        
        return {
            rating: parseFloat(rating || dRating || '0'),
            count: parseInt((count || dCount || '0').replace(/[^0-9]/g, ''), 10)
        };
    });

    // --- STEP 3: Fetch AJAX Reviews ---
    let reviews: any[] = [];
    try {
        const ajaxRes = await page.goto(reviewAjaxUrl, { waitUntil: 'networkidle', timeout: 15000 });
        if (ajaxRes && ajaxRes.status() === 200) {
            reviews = await page.evaluate(() => {
                const blocks = Array.from(document.querySelectorAll('.sdp-review__article__list, .review-item, [data-review-id], .review-list-item'));
                return blocks.map(block => {
                    const nickname = (block.querySelector('.user__name, .nickname, .user-name')?.textContent ?? '익명').trim();
                    const ratingAttr = block.querySelector('[data-rating]')?.getAttribute('data-rating') || block.querySelector('.rating-score')?.getAttribute('data-rating');
                    const rating = ratingAttr ? Number(ratingAttr) : 0;
                    const headline = (block.querySelector('.headline, .review-title, .title')?.textContent ?? '').trim();
                    const content = (block.querySelector('.review__content, .review-text, .content')?.textContent ?? '').replace(/\s+/g, ' ').trim();
                    const date = (block.querySelector('.regdate, .date, .time')?.textContent ?? '').trim();
                    return { nickname, rating, headline, content, date };
                });
            });
        }
    } catch (e) {}

    if (reviews.length === 0 && summary.count === 0) {
        await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    return { reviews, summary };
  } catch (err: any) {
    // console.error('[PlaywrightFetch] Error:', err.message);
    return { reviews: [], summary: { rating: 0, count: 0 } };
  } finally {
    await browser.close();
  }
}
