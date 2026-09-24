import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const targets = [
  'New Balance 9060 Grey Lilac',
  'Represent Hermes Hoodie',
  'Represent Luggage Tag Hoodie',
  'Represent Keys To The Club',
  'Represent Owners Club Script Hoodie',
  'Represent Owners Club Hoodie',
  'Represent Patron',
  'Vale Forever Classico',
  'New Balance 9060 Bricks',
  'New Balance 9060 Ivory',
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const searchInput = page.locator('input[placeholder="请输入要搜索的内容"]');
  const results = {};

  for (const target of targets) {
    await searchInput.fill('');
    await searchInput.fill(target);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Get table rows
    const rows = await page.locator('table tbody tr').all();
    console.log(`\n=== Search: ${target} ===`);
    for (const row of rows) {
      const text = await row.innerText().catch(() => '');
      if (text.trim()) {
        console.log('  Row:', text.slice(0, 200));
      }
    }
    if (rows.length === 0) {
      console.log('  No rows found');
      // Try to get any text from the page
      const bodyText = await page.locator('.app-container, .main-container, main').innerText().catch(() => '');
      console.log('  Page text:', bodyText.slice(0, 300));
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
