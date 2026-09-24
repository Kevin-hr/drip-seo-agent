import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const plans = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/bulk-nosku-1790196495326-exec/plans.json','utf8'));
const plan = plans.find(p => p.product_id === '536027371831825') || plans[20];
const id = String(plan.product_id);
console.log('Testing product:', id, plan.product_name?.slice(0,40));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });
await page.waitForTimeout(2000);

// Fill name
await page.locator('input[placeholder="请输入商品名称"]').first().fill(plan.product_name);
await page.locator('input[placeholder="请输入商品副标题"]').first().fill('QC Photos · 30-Day Returns');

// Fill editors via same method
await page.evaluate(({ html }) => {
  const main = document.querySelector('main');
  const editors = (window.tinymce?.editors || []).filter(e => main?.contains(e.getElement()));
  editors[0]?.setContent(''); editors[0]?.fire('change'); editors[0]?.save();
  editors[1]?.setContent(html); editors[1]?.fire('change'); editors[1]?.save();
}, { html: plan.key_description_html });

// Switch
const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('.el-switch').first();
console.log('Switch before:', await sw.evaluate(el => el.classList.contains('is-checked')));
await sw.locator('.el-switch__core').click({ force: true });
await page.waitForTimeout(500);
console.log('Switch after:', await sw.evaluate(el => el.classList.contains('is-checked')));

// Save and log request
const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 30000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const resp = await respPromise;
const post = resp.request().postData() || '';
const isShowMatch = post.match(/"IsShow"\s*:\s*([^,}]+)/);
console.log('IsShow in request:', isShowMatch?.[1]);
console.log('Response:', JSON.stringify(await resp.json()).slice(0,200));

await page.waitForTimeout(1000);
const after = await page.evaluate(async (pid) => {
  const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [[pid]], additions: {} }) });
  const j = await res.json();
  return j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0]?.IsShow;
}, id);
console.log('IsShow after save:', after);
await browser.close();
