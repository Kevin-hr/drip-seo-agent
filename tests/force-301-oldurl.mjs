import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const defaults = {
  IsShow: true, BasePrice: 0, IsDelete: false, SaleCount: 0, ReviewCount: 0, MarketPrice: 0,
  Sort: 9999, TradePrice: 0, NeedTax: false, MeasureUnit: '件/个', IsDisableStock: false,
  ReviewRate: 0, Rate5Count: 0, Rate4Count: 0, Rate3Count: 0, Rate2Count: 0, Rate1Count: 0,
  ImageReviewCount: 0, MultipleSku: false, SingleAttr: false, VedioPosition: 1, EnabledCoupon: true,
  MeasureType: 0, PackageItems: 1, MinItems: 1, MeasureDiscountType: 0, State: 0, ViewCount: 0,
  ViewCountAttr: 0, ViewCountAccValue: 0, UrlSuffix: '.html'
};

// pick 2 remediated products: read current row, set OldUrlValue back to the old pkgod path
const plan = [
  { id: '536027542618399', old: '-Pkgod-Nike-Kobe-5-Protro-Clark-Coconut-Milk-Spruce-IZ1852-100' },
  { id: '536027532088342', old: '-Pkgod-Nike-Mind-001-Slide-Mineral-Slate-HQ4307-300' },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

for (const t of plan) {
  const j = await page.evaluate(async (pid) => {
    const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [[pid]], additions: {} }) });
    return r.json();
  }, t.id);
  const row = j.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
  if (!row) { console.log(t.id, ': no row'); continue; }

  const rowClone = { ...row, OldUrlValue: t.old, SeoUrlChangeTo301: true, IsShow: true };
  const resp = await page.evaluate(async (b) => {
    const r = await fetch('/biz/DTB_proProduct/saveModify', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b) });
    return r.json();
  }, { args: [[{ name: 'dtb_proProduct', defaults, rows: [rowClone] }]] });
  console.log(t.id, 'save:', resp.success === true ? 'OK' : JSON.stringify(resp).slice(0,150));

  await page.waitForTimeout(800);
  const v = await page.evaluate(async (pid) => {
    const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [[pid]], additions: {} }) });
    return r.json();
  }, t.id);
  const vrow = v.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
  console.log('   verify OldUrlValue:', vrow?.OldUrlValue, '| SeoUrlChangeTo301:', vrow?.SeoUrlChangeTo301);
}
await browser.close();
