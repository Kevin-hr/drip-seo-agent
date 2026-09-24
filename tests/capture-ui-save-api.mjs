import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);

const apiCalls = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('/biz/')) apiCalls.push({ method: req.method(), url: u, postData: (req.postData()||'').slice(0,200) });
});

await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B536027542618399%5D', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);
console.log('form loaded. api calls so far:', apiCalls.length);
for (const c of apiCalls) console.log('  ', c.method, c.url.replace('https://www.mrshopplus.com',''), '|', c.postData.slice(0,120));

// click 编辑SEO to see what loads
try {
  await page.locator('text=编辑SEO').first().click();
  await page.waitForTimeout(2000);
  console.log('\nafter 编辑SEO click:');
  for (const c of apiCalls.slice(0)) console.log('  ', c.method, c.url.replace('https://www.mrshopplus.com',''), '|', c.postData.slice(0,120));
} catch(e) { console.log('no 编辑SEO button:', e.message.slice(0,80)); }
await browser.close();
