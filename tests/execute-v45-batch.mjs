import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const [plansPath, , outDirArg] = process.argv.slice(2);
if (!plansPath || !outDirArg) throw new Error('Usage');
const commit = process.argv.includes('--commit');
const plans = JSON.parse(await fs.readFile(plansPath, 'utf8'));
const outDir = path.resolve(outDirArg);
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const results = [];

try {
  for (const plan of plans) {
    const id = String(plan.product_id);
    const result = { product_id: id, started_at: new Date().toISOString(), steps: [] };
    results.push(result);
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    try {
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const nameInput = page.locator('input[placeholder="请输入商品名称"]').first();
      await nameInput.waitFor({ state: 'visible' });
      await page.waitForTimeout(2000);

      const beforeApi = await page.evaluate(async (pid) => {
        const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: [[pid]], additions: {} }) });
        return r.json();
      }, id);
      const before = beforeApi.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
      if (String(before?.Id) !== id) throw new Error('Wrong product');
      if (before?.IsShow === true) { result.success = true; result.steps.push('already-published'); continue; }
      if (!commit) { result.success = true; continue; }

      // Fill name + subtitle only
      await nameInput.fill(before.Name?.trim() || plan.product_name);
      await page.locator('input[placeholder="请输入商品副标题"]').first().fill('QC Photos · 30-Day Returns');

      // Toggle switch
      const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('.el-switch').first();
      const uiOn = await sw.evaluate(el => el.classList.contains('is-checked'));
      if (uiOn) { await sw.locator('.el-switch__core').click({ force: true }); await page.waitForTimeout(300); }
      await sw.locator('.el-switch__core').click({ force: true });
      await page.waitForTimeout(500);

      // Save
      const respP = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 60000 });
      await page.getByRole('button', { name: '保存', exact: true }).click();
      const resp = await respP;
      const receipt = await resp.json();
      const ids = Array.isArray(receipt?.result) ? receipt.result.map(String) : [];
      if (ids.length !== 1 || ids[0] !== id) throw new Error(`Save bad: ${JSON.stringify(receipt).slice(0,200)}`);

      // Verify
      await page.waitForTimeout(1000);
      const afterApi = await page.evaluate(async (pid) => {
        const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: [[pid]], additions: {} }) });
        return r.json();
      }, id);
      const after = afterApi.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
      if (after?.IsShow !== true) throw new Error('IsShow false');
      result.success = true;
      result.steps.push('published');
    } catch (e) {
      result.success = false;
      result.error = String(e?.message || e).slice(0, 300);
    } finally {
      await page.close();
      await fs.writeFile(path.join(outDir, 'execution-results.json'), `${JSON.stringify(results, null, 2)}\n`);
    }
  }
} finally {
  await browser.close();
}
console.log(`Done: ${results.filter(r=>r.success).length}/${results.length}`);
