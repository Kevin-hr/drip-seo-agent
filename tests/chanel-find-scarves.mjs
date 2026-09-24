import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Find the page containing product 536027442758422 (#09)
  for (let p = 1; p <= 50; p++) {
    const products = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const results = [];
      rows.forEach(row => {
        const link = row.querySelector('a[href*="form_DTB_proProduct"]');
        const name = link?.textContent?.trim() || '';
        const href = link?.getAttribute('href') || '';
        const match = href.match(/pkValues=%5B(\d+)%5D/);
        const productId = match ? match[1] : '';
        if (name && productId) results.push({ name, productId });
      });
      return results;
    });

    const target = products.find(x => x.productId === '536027442758422');
    if (target) {
      console.log(`Found #09 on page ${p}:`);
      products.forEach(prod => console.log(`  ${prod.productId}: ${prod.name}`));
      break;
    }

    await page.locator('.btn-next').click();
    await page.waitForTimeout(1200);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
