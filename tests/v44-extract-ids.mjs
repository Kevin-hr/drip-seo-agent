import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Extract all product names and their edit links/IDs
  const products = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    const results = [];
    rows.forEach(row => {
      const link = row.querySelector('a[href*="form_DTB_proProduct"]');
      const name = row.querySelector('a[href*="form_DTB_proProduct"]')?.textContent?.trim() || '';
      const href = link?.getAttribute('href') || '';
      // Extract productId from href like: #/product/form_DTB_proProduct/0?action=3&pkValues=%5B123456%5D
      const match = href.match(/pkValues=%5B(\d+)%5D/);
      const productId = match ? match[1] : '';
      if (name && productId) {
        results.push({ name, productId });
      }
    });
    return results;
  });

  console.log('Found products on page:');
  for (const p of products) {
    console.log(`  ${p.productId}: ${p.name}`);
  }

  // Check if there's pagination and go to next pages
  const nextBtn = page.locator('.btn-next, .el-pagination .btn-next');
  const hasNext = await nextBtn.count();
  if (hasNext > 0) {
    const disabled = await nextBtn.getAttribute('disabled').catch(() => null);
    console.log('Next button exists, disabled:', disabled);
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/product-ids-page1.json', JSON.stringify(products, null, 2));

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
