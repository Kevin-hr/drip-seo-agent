import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

// Debug: open a failing product and capture the full save response
const id = '536027437550618';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });

// Read current state
const before = await page.evaluate(async (pid) => {
  const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [[pid]], additions: {} }) });
  return await res.json();
}, id);
const row = before.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
console.log('Name:', row.Name, 'IsShow:', row.IsShow, 'Price:', row.SalePrice, 'Stock:', row.Stock);

// Just click save without changing anything, capture response
const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 60000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const resp = await respPromise;
const body = await resp.json();
console.log('Save status:', resp.status());
console.log('Save body:', JSON.stringify(body).slice(0, 2000));

await browser.close();
