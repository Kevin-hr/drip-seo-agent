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

  // Click next page
  await page.locator('.btn-next').click();
  await page.waitForTimeout(3000);

  // Extract products from page 2
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

  console.log('Page 2 products:');
  for (const p of products) {
    console.log(`  ${p.productId}: ${p.name}`);
  }

  // Go to page 3
  await page.locator('.btn-next').click();
  await page.waitForTimeout(3000);

  const products3 = await page.evaluate(() => {
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

  console.log('\nPage 3 products:');
  for (const p of products3) {
    console.log(`  ${p.productId}: ${p.name}`);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
