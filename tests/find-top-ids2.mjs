import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const urls = {
  'Fear of God Essentials': 'https://www.dripsneakers.org/Fear-of-God-Essentials-SS21-Hoodie-Sweatpants-Set-Black',
  'Nike SB Dunk Pink Pig': 'https://www.dripsneakers.org/Nike-SB-Dunk-Low-Pink-Pig',
  'Nike Dunk Community Garden': 'https://www.dripsneakers.org/Nike-Dunk-Low-Community-Garden',
  'AJ4 Black Cat': 'https://www.dripsneakers.org/Air-Jordan-4-Retro-Black-Cat',
  'AF1 Off-White MCA': 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Off-White-MCA-University-Blue',
  'AF1 Travis Sail': 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Travis-Scott-Sail',
};

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const ids = {};
  for (const [name, url] of Object.entries(urls)) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      const html = await page.content();
      const matches = html.match(/\b5\d{14}\b/g) || [];
      const unique = [...new Set(matches)];
      console.log(`${name}: IDs = ${unique.slice(0,5).join(', ')}`);
      ids[name] = unique;
    } catch(e) {
      console.log(`${name}: ERROR ${e.message.slice(0,50)}`);
    }
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/top-product-ids.json', JSON.stringify(ids, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
