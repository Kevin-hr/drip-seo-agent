import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

const id = '536027371831825';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });
await page.waitForTimeout(2000);

// Click the IsShow switch core
const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('.el-switch').first();
console.log('Before click, is-checked:', await sw.evaluate(el => el.classList.contains('is-checked')));

await sw.locator('.el-switch__core').click({ force: true });
await page.waitForTimeout(500);
console.log('After click, is-checked:', await sw.evaluate(el => el.classList.contains('is-checked')));

// Save
const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 30000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const resp = await respPromise;
console.log('Save:', resp.status(), JSON.stringify(await resp.json()).slice(0, 200));

await page.waitForTimeout(1000);
const after = await page.evaluate(async (pid) => {
  const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [[pid]], additions: {} }) });
  const j = await res.json();
  return j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0]?.IsShow;
}, id);
console.log('IsShow after:', after);
await browser.close();
