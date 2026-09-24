import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  // Search backend for these products
  const targets = [
    'Fear of God Essentials SS21',
    'Nike SB Dunk Low Pink Pig',
    'Nike Dunk Low Community Garden',
    'Air Jordan 4 Retro Black Cat',
    'Nike Air Force 1 Low Off-White MCA',
    'Nike Air Force 1 Low Travis Scott Sail',
  ];

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Get all products across pages, find matches
  const found = {};
  for (let p = 1; p <= 50; p++) {
    const products = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const results = [];
      rows.forEach(row => {
        const link = row.querySelector('a[href*="form_DTB_proProduct"]');
        const name = link?.textContent?.trim() || '';
        const href = link?.getAttribute('href') || '';
        const match = href.match(/pkValues=%5B(\d+)%5D/);
        if (name && match) results.push({ name, productId: match[1] });
      });
      return results;
    });

    for (const t of targets) {
      const match = products.find(x => x.name.toLowerCase().includes(t.toLowerCase()));
      if (match && !found[t]) {
        found[t] = match;
        console.log(`Found: ${t} -> ${match.productId}: ${match.name}`);
      }
    }

    if (Object.keys(found).length === targets.length) break;
    const nextBtn = page.locator('.btn-next');
    if (await nextBtn.getAttribute('disabled').catch(() => 'disabled')) break;
    await nextBtn.click();
    await page.waitForTimeout(1000);
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/top-product-ids.json', JSON.stringify(found, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
