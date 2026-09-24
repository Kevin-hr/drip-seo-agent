import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });

// Test 3 products with different approaches
const ids = ['536027320218901','53602731831825','536027316452437'];
for (const id of ids) {
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(2000);

  // Read current name and IsShow
  const before = await page.evaluate(async (pid) => {
    const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [[pid]], additions: {} }) });
    const j = await r.json();
    if (!j.success) return { error: JSON.stringify(j).slice(0,100) };
    const row = j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
    return row || { error: 'no row', result: JSON.stringify(j).slice(0,200) };
  }, id);
  console.log(`\n${id}: IsShow=${before.IsShow} UrlValue=${before.UrlValue?.slice(0,40)}`);
  if (before.IsShow === true) { console.log('  already published, skip'); await page.close(); continue; }

  // ONLY toggle switch - no content changes
  const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('.el-switch').first();
  const uiOn = await sw.evaluate(el => el.classList.contains('is-checked'));
  console.log('  UI switch on:', uiOn);
  if (uiOn) { await sw.locator('.el-switch__core').click({ force: true }); await page.waitForTimeout(300); }
  await sw.locator('.el-switch__core').click({ force: true });
  await page.waitForTimeout(500);

  // Save
  const respP = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 30000 });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const resp = await respP;
  const receipt = await resp.json();
  console.log('  Save:', JSON.stringify(receipt).slice(0, 150));
  await page.close();
}
await browser.close();
