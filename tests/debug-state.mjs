import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

const ids = ['536027388721431','536027387258911','536027384321563'];
for (const id of ids) {
  const row = await page.evaluate(async (pid) => {
    const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [[pid]], additions: {} }) });
    const j = await res.json();
    return j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
  }, id);
  console.log(id, '| Name:', row.Name?.trim()?.slice(0,50), '| IsShow:', row.IsShow, '| UrlValue:', row.UrlValue, '| SeoTitle:', row.SeoTitle?.slice(0,30));
}
await browser.close();
