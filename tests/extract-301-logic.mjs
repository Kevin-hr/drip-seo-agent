import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B536027542618399%5D', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

const src = 'https://assets.mrshopplus.com/admin/js/chunk-common.1d666d60.js';
const resp = await fetch(src);
const code = await resp.text();
fs.writeFileSync('data/runs/v45-batch-2026-09-23/minimal-run/chunk-common.js', code);
console.log('downloaded', code.length, 'chars');

// find context around SeoUrlChangeTo301 and redirect-related biz routes
function ctxOf(needle, before=120, after=240) {
  const i = code.indexOf(needle);
  if (i < 0) return null;
  return code.slice(Math.max(0,i-before), i+after);
}
for (const n of ['SeoUrlChangeTo301','OldUrlValue','hideRedirect']) {
  const c = ctxOf(n);
  console.log(`\n===== ${n} =====`);
  console.log(c ? c.replace(/\n+/g,'\n') : 'NOT FOUND');
}
const routes = code.match(/\/biz\/[A-Za-z0-9_\/]+/g) || [];
const uniq = [...new Set(routes)];
console.log('\n=== biz routes in chunk-common:', uniq.length, '===');
console.log(uniq.join('\n'));
await browser.close();
