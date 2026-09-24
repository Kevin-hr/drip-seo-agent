import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

const id = '536027437550618';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });

// Fill name
await page.locator('input[placeholder="请输入商品名称"]').first().fill('Test Name Debug');
console.log('Name filled');

// Try save — capture ALL network requests
page.on('response', r => { if (/save|product/i.test(r.url())) console.log('NET:', r.request().method(), r.url().slice(0,120), r.status()); });

try {
  const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 10000 });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  console.log('Save clicked, waiting...');
  const resp = await respPromise;
  console.log('Save result:', resp.status(), JSON.stringify(await resp.json()).slice(0,500));
} catch (e) {
  console.log('Save error:', e.message);
  // Check for dialog/alert
  const dialog = await page.locator('.el-message--error, .el-notification, .el-message-box').allTextContents();
  console.log('Error dialogs:', dialog);
}

await browser.close();
