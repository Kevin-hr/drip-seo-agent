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

  // First, let's look at page 11 full content to find #09 Black White
  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Navigate to page 11
  for (let i = 1; i < 11; i++) {
    await page.locator('.btn-next').click();
    await page.waitForTimeout(1500);
  }

  // Get ALL products on page 11
  const pageProducts = await page.evaluate(() => {
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

  console.log('=== Page 11 ALL products ===');
  pageProducts.forEach(p => console.log(`  ${p.productId}: ${p.name}`));

  // Also search for Scarf
  console.log('\n=== Searching for Scarf ===');
  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const searchInput = page.locator('input[placeholder="请输入要搜索的内容"]');
  await searchInput.fill('Scarf');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);

  const scarfProducts = await page.evaluate(() => {
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

  console.log('Scarf search results:');
  scarfProducts.forEach(p => console.log(`  ${p.productId}: ${p.name}`));

  await fs.writeFile('data/runs/v45-batch-2026-09-23/chanel-products-full.json', JSON.stringify({ page11: pageProducts, scarves: scarfProducts }, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
