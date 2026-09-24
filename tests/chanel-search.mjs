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

  // Type Chanel in search
  const searchInput = page.locator('input[placeholder="请输入要搜索的内容"]');
  await searchInput.fill('Chanel');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);

  const allProducts = [];

  // Go through all search result pages
  for (let p = 1; p <= 10; p++) {
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

    console.log(`Search page ${p}: ${products.length} products`);
    products.forEach(prod => {
      console.log(`  ${prod.productId}: ${prod.name}`);
      allProducts.push(prod);
    });

    // Click next
    const nextBtn = page.locator('.btn-next');
    const disabled = await nextBtn.getAttribute('disabled').catch(() => 'disabled');
    if (disabled) {
      console.log('No more search result pages');
      break;
    }
    await nextBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log(`\nTotal Chanel search results: ${allProducts.length}`);
  await fs.writeFile('data/runs/v45-batch-2026-09-23/chanel-search-results.json', JSON.stringify(allProducts, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
