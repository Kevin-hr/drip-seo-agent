import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(90000);

const id = '536027070486297';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 90000 });
const nameInput = page.locator('input[placeholder="请输入商品名称"]').first();
await nameInput.waitFor({ state: 'visible', timeout: 90000 });
await page.waitForTimeout(3000);

// Capture the save request body
const respP = page.waitForResponse(r => /saveModify|save/i.test(r.url()) && r.request().method() === 'POST', { timeout: 120000 });
const reqP = page.waitForRequest(r => /saveModify|save/i.test(r.url()) && r.method() === 'POST', { timeout: 120000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const [req, resp] = await Promise.all([reqP, respP]);
console.log('SAVE URL:', req.url());
const body = req.postData() || '';
console.log('SAVE BODY LENGTH:', body.length);
// Extract keys present in rows[0]
try {
  const parsed = JSON.parse(body);
  const row = parsed.args?.[0]?.[0]?.rows?.[0];
  if (row) console.log('ROW KEYS:', Object.keys(row).join(', '));
} catch(e) { console.log('Parse err:', e.message); }
console.log('SAVE BODY FULL:', body.slice(0, 8000));
const rj = await resp.json();
console.log('RESPONSE:', JSON.stringify(rj).slice(0, 500));
await browser.close();
