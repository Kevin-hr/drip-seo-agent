import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

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

  const chanelProducts = [];

  // Continue from page 13 onwards
  for (let p = 1; p <= 30; p++) {
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

    // Look for Chanel, Scarf, Fringe, T-shirt products
    const interesting = products.filter(x =>
      /chanel|scarf|fringe|wool|t-shirt|tshirt/i.test(x.name)
    );
    if (interesting.length > 0) {
      console.log(`Page ${p}: ${interesting.length} interesting products`);
      interesting.forEach(c => {
        console.log(`  ${c.productId}: ${c.name}`);
        chanelProducts.push(c);
      });
    }

    if (p < 30) {
      const nextBtn = page.locator('.btn-next');
      const disabled = await nextBtn.getAttribute('disabled').catch(() => 'disabled');
      if (disabled) {
        console.log(`No more pages at page ${p}`);
        break;
      }
      await nextBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  console.log(`\nTotal interesting products: ${chanelProducts.length}`);
  await fs.writeFile('data/runs/v45-batch-2026-09-23/chanel-products-found.json', JSON.stringify(chanelProducts, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
