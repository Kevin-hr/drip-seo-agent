import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

const id = '536027437550618';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });

const readSave = async (label) => {
  const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 60000 });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const resp = await respPromise;
  const body = await resp.json();
  console.log(`${label}: status=${resp.status()} body=${JSON.stringify(body).slice(0,500)}`);
};

// Step 1: fill name only
await page.locator('input[placeholder="请输入商品名称"]').first().fill('Test Name Debug');
await readSave('after-name');

// Reload
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });

// Step 2: click publish switch then save
const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('[role=switch], .el-switch').first();
console.log('Switch before:', await sw.getAttribute('aria-checked'));
await sw.click();
await readSave('after-switch');

await browser.close();
