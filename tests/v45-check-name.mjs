import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState });
const page = await context.newPage();
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
const r = await page.evaluate(async () => {
  const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ args: [['536027444911378']], additions: {} }) });
  const j = await res.json();
  const row = j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0] || {};
  return { Name: row.Name, IsShow: row.IsShow };
});
console.log(JSON.stringify(r, null, 2));
await context.close(); await browser.close();
