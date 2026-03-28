import { chromium } from 'playwright';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'
];

/**
 * Fetches review summary (rating and count) from Coupang's search results page.
 * This is safer than visiting product detail pages.
 */
export async function fetchSummaryFromSearch(productId: string, cookie: string = '') {
  const searchUrl = `https://www.coupang.com/np/search?q=${productId}&channel=user`;
  const screenshotPath = '/Users/youngwookkim/Downloads/훈프로 소싱 파인더/public/search_summary_debug.png';

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

    // Stealth script
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
          return { name: parts[0].trim(), value: parts.slice(1).join('=').trim(), url: 'https://www.coupang.com' };
        }).filter(c => !!c.name);
      if (cookies.length > 0) await context.addCookies(cookies);
    }

    // Step 1: Warming
    console.log(`[SearchSummary] Warming session and searching for PID: ${productId}`);
    await page.goto('https://www.coupang.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500 + Math.random() * 1000);

    // Step 2: Navigate to searching for the Product ID
    const response = await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    if (response && response.status() === 403) {
      console.error('[SearchSummary] 403 Forbidden on search page.');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      return { rating: 0, count: 0 };
    }

    // Wait and Scroll
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);

    // Step 3: Extract Summary
    const summary = await page.evaluate((pid) => {
      // Find the specific product in the list that matches the ID
      // Coupang search list items often have data-product-id
      const items = Array.from(document.querySelectorAll('li.search-product, .search-product-link, [data-product-id]'));
      let targetItem = items.find(item => item.getAttribute('data-product-id') === pid) || items[0];

      if (!targetItem) return { rating: 0, count: 0 };

      const ratingElement = targetItem.querySelector('.rating-star-num, .rating-score, em.rating, .rating, i.star-score');
      const countElement = targetItem.querySelector('.total-count, .rating-total-count, .review-count, .count');

      const rating = parseFloat(ratingElement?.textContent?.trim() || '0');
      const countStr = countElement?.textContent?.trim()?.replace(/[^0-9]/g, '') || '0';

      return {
        rating,
        count: parseInt(countStr, 10)
      };
    }, productId);

    if (summary.count === 0) {
      console.warn(`[SearchSummary] Search returned no review count for PID ${productId}. Searching fallback via class name...`);
      // Fallback: If not found specifically by ID, try any rating count on the page (if direct PID search redirects)
      const fallbackSummary = await page.evaluate(() => {
          const rating = document.querySelector('.rating-star-num, .rating-score, em.rating, .rating')?.textContent?.trim();
          const count = document.querySelector('.total-count, .rating-total-count, .review-count, .count')?.textContent?.trim();
          return {
              rating: parseFloat(rating || '0'),
              count: parseInt((count || '0').replace(/[^0-9]/g, ''), 10)
          };
      });
      if (fallbackSummary.count > 0) return fallbackSummary;
      
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    return summary;
  } catch (err: any) {
    console.error('[SearchSummary] Error:', err.message);
    return { rating: 0, count: 0 };
  } finally {
    await browser.close();
  }
}
