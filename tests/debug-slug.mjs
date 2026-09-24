import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

const id = '536027388721431';
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
console.log('Before: Name=', before.Name, 'IsShow=', before.IsShow, 'UrlValue=', before.UrlValue);

// Fill name
await page.locator('input[placeholder="请输入商品名称"]').first().fill(before.Name.trim());
await page.locator('input[placeholder="请输入商品副标题"]').first().fill('QC Photos · 30-Day Returns');

// Open SEO dialog
await page.getByRole('button', { name: /编辑SEO/ }).click();
await page.waitForTimeout(500);
const dialog = page.locator('.el-dialog:visible, .el-drawer:visible').last();
const textareas = dialog.locator('textarea');
console.log('SEO textareas:', await textareas.count());
console.log('Current slug value:', await textareas.nth(2).inputValue());

const newSlug = `chrome-hearts-hat-ch030-${id.slice(-6)}`;
await textareas.nth(0).fill('Chrome Hearts Hat CH030 | Drip Sneakers');
await textareas.nth(1).fill('Shop Chrome Hearts Hat CH030 at Drip Sneakers.');
await textareas.nth(2).fill(newSlug);
console.log('Filled slug:', newSlug);
console.log('Slug field now:', await textareas.nth(2).inputValue());

// Clear tags and add keywords
const closeTags = dialog.locator('.el-select__tags .el-tag__close, .el-select__tags .el-tag .el-icon-close');
while (await closeTags.count()) { await closeTags.first().click({ force: true }).catch(()=>{}); await page.waitForTimeout(100); }
const kwInput = dialog.locator('input.el-select__input').first();
for (const kw of ['chrome','hearts','hat','fashion','drip']) { await kwInput.fill(kw); await kwInput.press('Enter'); await page.waitForTimeout(150); }
console.log('Tags:', await dialog.locator('.el-select__tags .el-tag').count());

await dialog.getByRole('button', { name: /确定|保存/ }).last().click();
await page.waitForTimeout(800);
console.log('SEO dialog closed');

// Toggle publish switch
const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('[role=switch], .el-switch').first();
console.log('Switch before:', await sw.getAttribute('aria-checked'));
await sw.click();
console.log('Switch clicked');

// Save
const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 30000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const resp = await respPromise;
const body = await resp.json();
console.log('Save status:', resp.status());
console.log('Save body:', JSON.stringify(body).slice(0, 500));

await browser.close();
