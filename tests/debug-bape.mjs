import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

const id = '536027384321563';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });

// Fill name
await page.locator('input[placeholder="请输入商品名称"]').first().fill('Bape Shark Full Zip Hoodie');
await page.locator('input[placeholder="请输入商品副标题"]').first().fill('QC Photos · 30-Day Returns');

// Open SEO
await page.getByRole('button', { name: /编辑SEO/ }).click();
await page.waitForTimeout(500);
const dialog = page.locator('.el-dialog:visible, .el-drawer:visible').last();
const textareas = dialog.locator('textarea');
console.log('Slug before:', await textareas.nth(2).inputValue());

const newSlug = `bape-shark-full-zip-hoodie-${id.slice(-6)}`;
await textareas.nth(0).fill('Bape Shark Full Zip Hoodie | Drip Sneakers');
await textareas.nth(1).fill('Shop Bape Shark Full Zip Hoodie at Drip Sneakers.');
await textareas.nth(2).fill(newSlug);
console.log('Slug after fill:', await textareas.nth(2).inputValue());

// Clear tags
const closeTags = dialog.locator('.el-select__tags .el-tag__close, .el-select__tags .el-tag .el-icon-close');
while (await closeTags.count()) { await closeTags.first().click({ force: true }).catch(()=>{}); await page.waitForTimeout(100); }
const kwInput = dialog.locator('input.el-select__input').first();
for (const kw of ['bape','shark','hoodie','fashion','drip']) { await kwInput.fill(kw); await kwInput.press('Enter'); await page.waitForTimeout(150); }
console.log('Tags:', await dialog.locator('.el-select__tags .el-tag').count());

await dialog.getByRole('button', { name: /确定|保存/ }).last().click();
await page.waitForTimeout(800);

// Switch
const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('[role=switch], .el-switch').first();
await sw.click();

// Save
const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 30000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const resp = await respPromise;
console.log('Save:', resp.status(), JSON.stringify(await resp.json()).slice(0,300));
await browser.close();
