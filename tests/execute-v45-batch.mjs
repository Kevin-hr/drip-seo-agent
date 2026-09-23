import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const [plansPath, decisionsPath, outDirArg] = process.argv.slice(2);
if (!plansPath || !decisionsPath || !outDirArg) throw new Error('Usage: execute-v45-batch.mjs plans.json decisions.json out-dir [--commit]');
const commit = process.argv.includes('--commit');
const plans = JSON.parse(await fs.readFile(plansPath, 'utf8'));
const decisions = JSON.parse(await fs.readFile(decisionsPath, 'utf8'));
const decisionById = new Map(decisions.map((x) => [String(x.product_id), x]));
const outDir = path.resolve(outDirArg);
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
await fs.mkdir(path.join(outDir, 'backups'), { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
const results = [];

const readApi = (id) => page.evaluate(async (productId) => {
  const response = await fetch('/biz/DTB_proProduct/modify', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
    body: JSON.stringify({ args: [[productId]], additions: {} })
  });
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(`modify read ${response.status}`);
  return json;
}, id);
const rowOf = (json) => json.result.find((x) => x.name === 'dtb_proProduct')?.rows?.[0];
const setEditor = (index, html) => page.evaluate(({ index, html }) => {
  const main = document.querySelector('main');
  const editors = (window.tinymce?.editors || []).filter((e) => main?.contains(e.getElement()));
  const editor = editors[index];
  if (!editor) return { ok: false, count: editors.length };
  editor.setContent(html); editor.fire('change'); editor.save();
  editor.getElement().dispatchEvent(new Event('input', { bubbles: true }));
  const content = editor.getContent() || '';
  return { ok: html === '' ? content === '' : content.length > 0, content };
}, { index, html });

try {
  for (const plan of plans) {
    const id = String(plan.product_id);
    const result = { product_id: id, mode: commit ? 'commit' : 'dry-run', started_at: new Date().toISOString(), steps: [] };
    results.push(result);
    const formUrl = `https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`;
    try {
      await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const nameInput = page.locator('input[placeholder="请输入商品名称"]').first();
      await nameInput.waitFor({ state: 'visible' });
      const beforeApi = await readApi(id);
      const before = rowOf(beforeApi);
      if (String(before?.Id) !== id) throw new Error('Fresh state is not the allowlisted product');
      if (before?.IsShow === true) { result.success = true; result.steps.push({ step: 'already-published' }); result.completed_at = new Date().toISOString(); continue; }
      await fs.writeFile(path.join(outDir, 'backups', `${id}.json`), `${JSON.stringify(beforeApi, null, 2)}\n`);
      result.steps.push({ step: 'fresh-backup', image_count: before.ImgList?.length || 0 });
      if (!commit) { result.success = true; continue; }

      // Fill name and subtitle only - do NOT touch SEO/URL
      await nameInput.fill(before.Name?.trim() || plan.product_name);
      await page.locator('input[placeholder="请输入商品副标题"]').first().fill('QC Photos · 30-Day Returns');

      // Fill editors: clear description, set summary with Product Details
      const description = await setEditor(0, '');
      const summary = await setEditor(1, plan.key_description_html);
      result.steps.push({ step: 'content-filled', descOk: description.ok, summaryLi: (summary.content.match(/<li\b/gi) || []).length });

      // Toggle publish switch - click the switch core
      const publishSwitch = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('.el-switch').first();
      if (!await publishSwitch.count()) throw new Error('Publish switch not found');
      const alreadyOn = await publishSwitch.evaluate((el) => el.classList.contains('is-checked'));
      if (!alreadyOn) {
        await publishSwitch.locator('.el-switch__core').click({ force: true });
        await page.waitForTimeout(500);
      }
      const nowOn = await publishSwitch.evaluate((el) => el.classList.contains('is-checked'));
      result.steps.push({ step: 'switch-set', alreadyOn, nowOn });

      // Save
      let ids = [];
      let lastBody = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const saveResponsePromise = page.waitForResponse((r) => /DTB_proProduct\/saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 60000 });
        await page.getByRole('button', { name: '保存', exact: true }).click();
        const saveResponse = await saveResponsePromise;
        const receipt = await saveResponse.json();
        lastBody = receipt;
        ids = Array.isArray(receipt?.result) ? receipt.result.map(String) : [];
        if (saveResponse.status() === 200 && ids.length === 1) break;
        result.steps.push({ step: `save-retry-${attempt}`, body: JSON.stringify(receipt).slice(0, 200) });
        await page.waitForTimeout(2000);
      }
      if (ids.length !== 1) throw new Error(`Save failed: ${JSON.stringify(lastBody).slice(0,200)}`);
      result.steps.push({ step: 'saved', ids });

      // Verify
      await page.waitForTimeout(1000);
      const after = rowOf(await readApi(id));
      if (after?.IsShow !== true) throw new Error('IsShow not true after save');
      result.steps.push({ step: 'verified', isShow: after.IsShow, url: after.UrlValue });
      result.success = true;
      result.completed_at = new Date().toISOString();
    } catch (error) {
      result.success = false;
      result.error = String(error?.stack || error);
    } finally {
      await fs.writeFile(path.join(outDir, 'execution-results.json'), `${JSON.stringify(results, null, 2)}\n`);
    }
  }
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}

console.log(JSON.stringify(results.map((x) => ({ product_id: x.product_id, success: x.success, error: x.error?.slice(0,200) }))));
