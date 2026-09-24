import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B536027542618399%5D', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);

// enumerate XHR/fetch endpoints referenced in page scripts
const endpoints = await page.evaluate(() => {
  const found = new Set();
  for (const s of document.querySelectorAll('script[src]')) found.add(s.src);
  return [...found].filter(u => /\.js/i.test(u)).slice(0, 40);
});
console.log('script srcs:', endpoints.length);
for (const u of endpoints.slice(0, 12)) console.log(' ', u.slice(-90));

// try common redirect/301 related biz routes
const tries = ['/biz/DTB_proSeoRedirect/getList','/biz/DTB_proSeoRedirect/list','/biz/DTB_proUrlRedirect/list','/biz/DTB_proSeoRecord/list'];
for (const route of tries) {
  const r = await page.evaluate(async (rt) => {
    const resp = await fetch(rt, { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [['']], additions: {} }) });
    return { status: resp.status, text: (await resp.text()).slice(0, 150) };
  }, route);
  console.log(`${route} -> ${r.status} ${r.text.slice(0,120)}`);
}
await browser.close();
