import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const names = [
  'Fear of God Essentials SS21',
  'Ultra Boost Tech Ink',
  'Ultraboost All Terrain Black Red',
  'Ultra Boost All Terrain Shock Red',
  'SB Dunk Low Pink Pig',
  'Dunk Low Community Garden',
  'Ultra Boost OG 2018',
  'SB Dunk Low Veneer',
  'SB Dunk High Atlas Lost',
  'Air Force 1 Low Yin Yang',
  'Air Force 1 07 MID White',
  'Air Force 1 Mid Utility University Red',
  'Air Force 1 Mid LV8 Cool Grey',
  'Air Force 1 Low Be True',
  'Air Force 1 High Flax',
  'Air Force 1 Mid Flax',
  'Air Force 1 Flyleather Ruohan',
  'Air Force 1 Low Good Game',
  'Air Force 1 Low Flax 2019',
  'Air Force 1 Low Stussy Black',
  'Air Force 1 Low Travis Scott white',
  'Air Force 1 Low Fragment Clot white',
  'Air Force 1 Low Fragment Clot black',
  'Air Force 1 Low Clot Blue Silk',
  'Air Force 1 Low Clot Rose Gold',
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const results = {};
  for (const name of names) {
    try {
      // Clear search and type
      const searchInput = page.locator('input[placeholder*="商品名称"], input[placeholder*="请输入"]').first();
      await searchInput.fill('');
      await page.waitForTimeout(300);
      await searchInput.fill(name);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Get first result
      const row = page.locator('table tbody tr').first();
      const link = row.locator('a[href*="form_DTB_proProduct"]');
      const text = await link.textContent().catch(() => '');
      const href = await link.getAttribute('href').catch(() => '');
      const match = href.match(/pkValues=%5B(\d+)%5D/);
      if (match) {
        results[name] = { pid: match[1], name: text.trim() };
        console.log(`✓ ${name} -> ${match[1]}: ${text.trim().slice(0,40)}`);
      } else {
        console.log(`✗ ${name} -> no result`);
        results[name] = null;
      }
    } catch(e) {
      console.log(`✗ ${name} -> ${e.message.slice(0,40)}`);
      results[name] = null;
    }
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/top26-pids.json', JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
