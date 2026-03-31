import { chromium } from 'playwright';

/**
 * UTilmate Stealth V2 Scraper for Coupang Search.
 * Features: Rotating User-Agents, Randomized Interactions, Multi-level Fallback.
 */
const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
];

export async function scrapeCoupangSearch(keyword: string, cookie: string) {
  const searchUrl = `https://m.coupang.com/nm/search?q=${encodeURIComponent(keyword)}`;
  const screenshotPath = '/Users/youngwookkim/Downloads/훈프로 소싱 파인더/public/search_debug.png';
  
  const browser = await chromium.launch({ 
    headless: true, 
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  }).catch(() => chromium.launch({ headless: true, args: ['--no-sandbox'] }));

  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('iPhone');

  const context = await browser.newContext({
    userAgent,
    viewport: isMobile ? { width: 390, height: 844 } : { width: 1280, height: 800 },
    isMobile,
    hasTouch: isMobile,
  });

  // Hide WebDriver
  await context.addInitScript(() => {
    // @ts-ignore
    delete navigator.__proto__.webdriver;
    // @ts-ignore
    window.chrome = { runtime: {} };
  });

  const page = await context.newPage();

  try {
    if (cookie) {
      const cookies = cookie.split(';').map(s => {
        const [name, ...rest] = s.trim().split('=');
        return { name, value: rest.join('='), url: 'https://m.coupang.com' };
      }).filter(c => c.name && c.value);
      if (cookies.length > 0) await context.addCookies(cookies);
    }

    // Step 1: Warming
    console.log(`[V2 Stealth] Warming up on Coupang Home...`);
    await page.goto('https://www.coupang.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000 + Math.random() * 2000);

    // Human-like interaction: Scroll
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);

    // Step 2: Navigate to Search
    console.log(`[V2 Stealth] Navigating to Search...`);
    const response = await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check for CAPTCHA or 403
    if (response && response.status() === 403) {
      console.error('[V2 Stealth] 403 Forbidden. IP Blocked or Fingerprint detected.');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      return [];
    }

    // Wait and Scroll to behave like a human
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);

    // Scrape
    const products = await page.evaluate(() => {
      const selectors = [
        'li.search-product',
        '.search-product-link',
        '.search-product',
        '[data-product-id]',
        '.list-item'
      ];
      let items: Element[] = [];
      for (const sel of selectors) {
        items = Array.from(document.querySelectorAll(sel));
        if (items.length > 0) break;
      }

      return items.slice(0, 15).map(item => {
        const productId = item.getAttribute('data-product-id') || item.getAttribute('data-id') || '';
        const productName = (item.querySelector('.name, .product-name, h3, .title')?.textContent || '').trim();
        const priceValue = (item.querySelector('.price-value, .sale-price, strong, .price')?.textContent || '0').replace(/[^0-9]/g, '');
        const productImage = (item.querySelector('img')?.getAttribute('src') || item.querySelector('img')?.getAttribute('data-src') || '');
        
        const ratingElement = item.querySelector('.rating-star-num, .rating-score, em.rating, .rating, .score');
        const rating = parseFloat(ratingElement?.textContent?.trim() || '0');
        
        const countElement = item.querySelector('.total-count, .rating-total-count, .review-count, .count, .rating-count');
        const countStr = countElement?.textContent?.trim()?.replace(/[^0-9]/g, '') || '0';
        
        const isRocket = !!item.querySelector('.badge.rocket, .rocket-badge, .badge-rocket-delivery, .rocket-badge-img, .sdp-badge-rocket, img[alt*="로켓배송"], img[src*="rocket"]');
        let isJet = !!item.querySelector('.badge.jet-delivery, .jet-badge, .badge-jet, .fbl-badge, img[alt*="판매자로켓"], img[alt*="판매자 로켓"], img[alt*="제트배송"], img[alt*="로켓그로스"], img[alt*="그로스"], [class*="seller-rocket"], [class*="vendor-rocket"], [class*="growth"], [class*="jet-"], img[src*="growth"], [class*="rock-rocket-badge"], img[src*="seller_rocket"], img[src*="vendor_rocket"], img[src*="merchant"]');
        
        // Secondary text check for badges that might just be text spans
        if (!isJet && item.textContent?.includes('판매자로켓')) {
            isJet = true;
        }

        // Prioritize isJet because jet is a subset of rocket and might match both selectors
        const deliveryType = isJet ? 'jet' : isRocket ? 'rocket' : 'general';

        return {
          productId,
          productName,
          productPrice: parseInt(priceValue, 10),
          productImage: productImage.startsWith('//') ? 'https:' + productImage : productImage,
          productUrl: `https://www.coupang.com/vp/products/${productId}`,
          rating,
          ratingCount: parseInt(countStr, 10),
          isRocket: isRocket || isJet, // Keep for backward compatibility
          deliveryType,
          rank: 0,
          source: 'scraper'
        };
      }).filter(p => p.productId && p.productName && p.productPrice > 0);
    });

    if (products.length === 0) {
      console.warn('[V2 Stealth] No products found.');
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
    
    return products.map((p, i) => ({ ...p, rank: i + 1 }));

  } catch (err: any) {
    console.error('[V2 Stealth] Error:', err.message);
    try { await page.screenshot({ path: screenshotPath, fullPage: true }); } catch {}
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Enriches product list with accurate review counts by visiting each detail page.
 * Uses a single browser session for efficiency.
 */
export async function enrichProductDetails(products: any[], cookie: string) {
    if (!products || products.length === 0) return products;

    console.log(`[V2 Enrichment] Starting enrichment for ${products.length} products...`);
    const browser = await chromium.launch({ 
        headless: true, 
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    }).catch(() => chromium.launch({ headless: true, args: ['--no-sandbox'] }));

    const context = await browser.newContext({
        userAgent: USER_AGENTS[0], // Use a stable Mac UA
        viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    try {
        if (cookie) {
            const cookies = cookie.split(';').map(s => {
                const [name, ...rest] = s.trim().split('=');
                return { name, value: rest.join('='), url: 'https://www.coupang.com' };
            }).filter(c => c.name && c.value);
            if (cookies.length > 0) await context.addCookies(cookies);
        }

        const enriched = [];
        for (const product of products) {
            try {
                console.log(`[V2 Enrichment] Visiting: ${product.productName.substring(0, 20)}...`);
                await page.goto(product.productUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                
                // Extraction from detail page
                const data = await page.evaluate(() => {
                    const countElem = document.querySelector('.prod-review-stat-count, .count, .rating-count, #prod-review-nav-link .count');
                    const ratingElem = document.querySelector('.rating-star-num, .rating-score, .avg-star-score');
                    
                    const countStr = countElem?.textContent?.trim()?.replace(/[^0-9]/g, '') || '0';
                    const ratingStr = ratingElem?.textContent?.trim() || '0';
                    
                    return {
                        rating: parseFloat(ratingStr),
                        ratingCount: parseInt(countStr, 10)
                    };
                });

                enriched.push({
                    ...product,
                    rating: data.rating || product.rating,
                    ratingCount: data.ratingCount || product.ratingCount
                });

                // Small human-like pause
                await page.waitForTimeout(500 + Math.random() * 1000);
            } catch (e: any) {
                console.warn(`[V2 Enrichment] Failed for ${product.productId}: ${e.message}`);
                enriched.push(product); // Keep original if failed
            }
        }
        return enriched;
    } catch (err: any) {
        console.error('[V2 Enrichment] Fatal Error:', err.message);
        return products;
    } finally {
        await browser.close();
    }
}
