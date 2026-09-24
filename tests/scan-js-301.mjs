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
await page.waitForTimeout(6000);

const srcs = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map(s => s.src).filter(u => /assets\.mrshopplus\.com\/admin\/js\//.test(u)));

const hits = [];
for (const src of srcs) {
  try {
    const resp = await fetch(src);
    const code = await resp.text();
    const pats = [/[A-Za-z_]*[Rr]edirect[A-Za-z_]*/g, /SeoUrlChangeTo301/g, /OldUrlValue/g, /SeoPath/g, /UrlValue/g];
    const found = new Set();
    for (const p of pats) {
      const m = code.match(p);
      if (m) for (const x of m) found.add(x);
    }
    if (found.size) hits.push({ src: src.slice(-40), terms: [...found].slice(0, 20) });
  } catch(e) { /* skip */ }
}
console.log(JSON.stringify(hits, null, 2));

// search for any biz route mentioning redirect/301 in the bundle text
for (const src of srcs) {
  try {
    const resp = await fetch(src);
    const code = await resp.text();
    const m = code.match(/\/biz\/[A-Za-z0-9_\/]*[Rr]edirect[A-Za-z0-9_\/]*/g);
    if (m) { console.log(src.slice(-40), 'redirect-routes:', [...new Set(m)].slice(0,10)); }
  } catch(e) {}
}
await browser.close();
