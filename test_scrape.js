const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
    });
    const page = await context.newPage();
    
    // Search for women's knit shirt
    await page.goto('https://m.coupang.com/nm/search?q=' + encodeURIComponent('여성 니트티'), { waitUntil: 'networkidle' });
    
    await page.waitForTimeout(2000);
    
    const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('li.search-product, .search-product-link, .search-product')).slice(0, 10);
        return items.map(item => {
            const name = item.querySelector('.name, .product-name, h3, .title')?.textContent?.trim() || '';
            const html = item.innerHTML;
            
            // Check badges
            const badges = Array.from(item.querySelectorAll('img, span, div.badge')).map(el => {
                if (el.tagName === 'IMG') {
                    return `IMG: src=${el.getAttribute('src')}, alt=${el.getAttribute('alt')}`;
                } else {
                    return `${el.tagName}: class=${el.className}, text=${el.textContent?.trim()}`;
                }
            });
            
            return { name, badges };
        });
    });
    
    console.log(JSON.stringify(products, null, 2));
    await browser.close();
})();
