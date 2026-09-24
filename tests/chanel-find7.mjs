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

    // Look for Chanel specifically
    const chanel = products.filter(x => /chanel/i.test(x.name));
    if (chanel.length > 0) {
      console.log(`Page ${p}: ${chanel.length} Chanel products`);
      chanel.forEach(c => {
        console.log(`  ${c.productId}: ${c.name}`);
        chanelProducts.push(c);
      });
    }

    if (p < 50) {
      const nextBtn = page.locator('.btn-next');
      const disabled = await nextBtn.getAttribute('disabled').catch(() => 'disabled');
      if (disabled) {
        console.log(`No more pages at page ${p}`);
        break;
      }
      await nextBtn.click();
      await page.waitForTimeout(1200);
    }
  }

  console.log(`\nTotal Chanel products found: ${chanelProducts.length}`);
  chanelProducts.forEach(c => console.log(`  ${c.productId}: ${c.name}`));
  await fs.writeFile('data/runs/v45-batch-2026-09-23/chanel-all.json', JSON.stringify(chanelProducts, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
