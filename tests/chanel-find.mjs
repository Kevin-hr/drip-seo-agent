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

  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Search for Chanel
  const searchInput = page.locator('input[placeholder="请输入要搜索的内容"]');
  await searchInput.fill('Chanel');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);

  // Extract all Chanel products from pages
  const allProducts = [];
  for (let pageNum = 1; pageNum <= 5; pageNum++) {
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
    allProducts.push(...products);
    console.log(`Page ${pageNum}: ${products.length} products`);
    products.forEach(p => console.log(`  ${p.productId}: ${p.name}`));

    // Click next
    const nextBtn = page.locator('.btn-next:not(.disabled)');
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(2000);
    } else break;
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/chanel-products.json', JSON.stringify(allProducts, null, 2));
  console.log(`\nTotal Chanel products found: ${allProducts.length}`);
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
