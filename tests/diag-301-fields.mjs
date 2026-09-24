import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const ids = ['536027542618399', '536027532088342', '536027512671002'];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

for (const id of ids) {
  const j = await page.evaluate(async (pid) => {
    const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [[pid]], additions: {} }) });
    return r.json();
  }, id);
  const row = j.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
  if (!row) { console.log(id, ': no row'); continue; }
  const keys = ['Id','Name','IsShow','UrlValue','Url','OldUrlValue','SeoUrlChangeTo301','SeoTitle','SeoKeyword','SeoDesc','Content'];
  console.log(`\n=== ${id} ===`);
  for (const k of keys) {
    const v = row[k];
    console.log(`  ${k}: ${typeof v === 'string' && v.length > 90 ? v.slice(0,90)+'...' : JSON.stringify(v)}`);
  }
}
await browser.close();
