import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(30000);

await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

// Try to search products via the list API
const searchResults = await page.evaluate(async () => {
  const r = await fetch('/biz/DTB_proProduct/list', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      args: [{ pageIndex: 1, pageSize: 20, keyword: 'New Balance 9060 Grey' }],
      additions: {}
    })
  });
  return await r.json();
});

console.log('Search result:', JSON.stringify(searchResults, null, 2).slice(0, 3000));

await browser.close();
