import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);

let body = '';
page.on('request', req => {
  if (req.url().includes('saveModify')) body = req.postData() || '';
});

await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B536027542618399%5D', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);
const saveBtn = page.locator('button:visible').filter({ hasText: /保存/ }).last();
await saveBtn.click();
await page.waitForTimeout(3000);
if (body) {
  fs.writeFileSync('data/runs/v45-batch-2026-09-23/minimal-run/ui-save-body.json', body);
  const parsed = JSON.parse(body);
  const row = parsed.args[0][0].rows[0];
  const keys = Object.keys(row);
  console.log('row keys:', keys.length);
  const focus = ['Id','Name','IsShow','UrlValue','Url','OldUrlValue','SeoUrlChangeTo301','SeoTitle','SeoKeyword','SeoDesc','Content','Sort','State'];
  for (const k of focus) {
    const v = row[k];
    console.log(`  ${k}: ${typeof v === 'string' && v.length > 80 ? v.slice(0,80)+'...' : JSON.stringify(v)}`);
  }
} else {
  console.log('no saveModify body captured');
}
await browser.close();
