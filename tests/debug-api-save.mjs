import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

const id = '536027070486297';
// 1. Read full row
const read = await page.evaluate(async (pid) => {
  const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [[pid]], additions: {} }) });
  return r.json();
}, id);
const row = read.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
if (!row) { console.log('NO ROW'); process.exit(1); }

console.log('Read OK. UrlValue:', row.UrlValue, '| IsShow:', row.IsShow, '| Content len:', (row.Content || '').length);

// 2. Build saveModify body with unique UrlValue
const newUrlValue = `${row.UrlValue}-${id}`;
const rowClone = { ...row, IsShow: true, UrlValue: newUrlValue, Url: `/${newUrlValue}${row.UrlSuffix || '.html'}` };
// Keep OldUrlValue so old path 301s

const defaults = {
  IsShow: true, BasePrice: 0, IsDelete: false, SaleCount: 0, ReviewCount: 0, MarketPrice: 0,
  Sort: 9999, TradePrice: 0, NeedTax: false, MeasureUnit: '件/个', IsDisableStock: false,
  ReviewRate: 0, Rate5Count: 0, Rate4Count: 0, Rate3Count: 0, Rate2Count: 0, Rate1Count: 0,
  ImageReviewCount: 0, MultipleSku: false, SingleAttr: false, VedioPosition: 1, EnabledCoupon: true,
  MeasureType: 0, PackageItems: 1, MinItems: 1, MeasureDiscountType: 0, State: 0, ViewCount: 0,
  ViewCountAttr: 0, ViewCountAccValue: 0, UrlSuffix: '.html'
};

const body = { args: [[{ name: 'dtb_proProduct', defaults, rows: [rowClone] }]] };
const resp = await page.evaluate(async (b) => {
  const r = await fetch('/biz/DTB_proProduct/saveModify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b) });
  return r.json();
}, body);
console.log('SAVE RESPONSE:', JSON.stringify(resp).slice(0, 500));

// 3. Verify
await page.waitForTimeout(1500);
const verify = await page.evaluate(async (pid) => {
  const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [[pid]], additions: {} }) });
  return r.json();
}, id);
const vrow = verify.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
console.log('VERIFY: IsShow =', vrow?.IsShow, '| UrlValue =', vrow?.UrlValue, '| Content len =', (vrow?.Content || '').length);
await browser.close();
