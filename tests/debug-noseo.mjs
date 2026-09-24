import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

const id = '536027400872473';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });

// Read current state
const before = await page.evaluate(async (pid) => {
  const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [[pid]], additions: {} }) });
  const j = await res.json();
  return j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
}, id);
console.log('Before:', before.Name?.slice(0,40), '| UrlValue:', before.UrlValue, '| IsShow:', before.IsShow);

// Fill name and subtitle only
await page.locator('input[placeholder="请输入商品名称"]').first().fill(before.Name.trim());
await page.locator('input[placeholder="请输入商品副标题"]').first().fill('QC Photos · 30-Day Returns');

// Toggle switch
const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('[role=switch], .el-switch').first();
const checked = await sw.getAttribute('aria-checked');
console.log('Switch before:', checked);
if (checked !== 'true') await sw.click();

// Save WITHOUT touching SEO
const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 30000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const resp = await respPromise;
console.log('Save:', resp.status(), JSON.stringify(await resp.json()).slice(0, 300));
await browser.close();
