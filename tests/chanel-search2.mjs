import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function searchTerm(page, term) {
  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const searchInput = page.locator('input[placeholder="请输入要搜索的内容"]');
  await searchInput.fill(term);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);

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

  return products;
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  for (const term of ['Fringe', 'Wool', 'Scarf', 'Two-Tone']) {
    console.log(`\n=== Search: "${term}" ===`);
    const results = await searchTerm(page, term);
    results.forEach(r => console.log(`  ${r.productId}: ${r.name}`));
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
