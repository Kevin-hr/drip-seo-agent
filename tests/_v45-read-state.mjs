// Read current state of a product via the modify API (no save).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const id = process.argv[2];
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
await page.goto('https://www.mrshopplus.com/#/product/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);
const j = await page.evaluate(async (pid) => {
  const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ args: [[pid]], additions: {} }) });
  return r.json();
}, String(id));
const row = j.result.find((s) => s.name === 'dtb_proProduct')?.rows?.[0];
console.log(JSON.stringify({
  id, IsShow: row.IsShow, Name: row.Name,
  UrlValue: row.UrlValue, Url: row.Url, OldUrlValue: row.OldUrlValue, SeoUrlChangeTo301: row.SeoUrlChangeTo301,
  summaryLen: String(row.Summary || '').length, contentLen: String(row.Content || '').length,
  summaryHead: String(row.Summary || '').slice(0, 120),
}, null, 2));
await browser.close();
