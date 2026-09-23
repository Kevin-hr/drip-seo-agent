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

const slugOk = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
for (const plan of plans) {
  const decision = decisionById.get(String(plan.product_id));
  const liCount = (plan.key_description_html.match(/<li\b/gi) || []).length;
  if (!decision?.normalized?.threshold_pass || decision.normalized.final_gate !== 'PASS') throw new Error(`TypeSafe gate not PASS: ${plan.product_id}`);
  if (plan.description_images.length !== 0) throw new Error(`Description image allowlist must be empty: ${plan.product_id}`);
  if (plan.seo_keywords.length !== 5 || liCount !== 5 || !slugOk(plan.slug)) throw new Error(`Deterministic plan gate failed: ${plan.product_id}`);
  if (!/<h2>Product Details<\/h2>/.test(plan.key_description_html)) throw new Error(`Product Details missing: ${plan.product_id}`);
}

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
      if (String(before?.Id) !== id || before?.IsShow !== false) throw new Error('Fresh state is not the allowlisted unpublished product');
      if (String(before.Name || '').trim() !== plan.baseline_name_trimmed) throw new Error('Fresh backend name drift');
      await fs.writeFile(path.join(outDir, 'backups', `${id}.json`), `${JSON.stringify(beforeApi, null, 2)}\n`);
      result.steps.push({ step: 'fresh-backup', image_count: before.ImgList?.length || 0 });
      if (!commit) { result.success = true; continue; }

      await nameInput.fill(plan.product_name);
      await page.locator('input[placeholder="请输入商品副标题"]').first().fill(plan.subtitle);
      const description = await setEditor(0, '');
      const summary = await setEditor(1, plan.key_description_html);
      if (!description.ok || description.content !== '') throw new Error('Description empty-policy write failed');
      if (!summary.ok || (summary.content.match(/<li\b/gi) || []).length !== 5) throw new Error('Key Description write failed');
      result.steps.push({ step: 'content-filled', description_images: 0, details_fields: 5 });

      await page.getByRole('button', { name: /编辑SEO/ }).click();
      const dialog = page.locator('.el-dialog:visible, .el-drawer:visible').last();
      const textareas = dialog.locator('textarea');
      if (await textareas.count() < 3) throw new Error('SEO dialog field count < 3');
      await textareas.nth(0).fill(plan.seo_title);
      await textareas.nth(1).fill(plan.meta_description);
      await textareas.nth(2).fill(plan.slug);
      const closeTags = dialog.locator('.el-select__tags .el-tag__close, .el-select__tags .el-tag .el-icon-close');
      let guard = 0;
      while (await closeTags.count() && guard++ < 20) {
        await closeTags.first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(120);
      }
      const keywordInput = dialog.locator('input.el-select__input').first();
      for (const keyword of plan.seo_keywords) { await keywordInput.fill(keyword); await keywordInput.press('Enter'); await page.waitForTimeout(150); }
      if (await dialog.locator('.el-select__tags .el-tag').count() !== 5) throw new Error('SEO keyword write failed');
      await dialog.getByRole('button', { name: /确定|保存/ }).last().click();
      result.steps.push({ step: 'seo-filled', keywords: 5 });

      const publishSwitch = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('[role=switch], .el-switch').first();
      if (!await publishSwitch.count()) throw new Error('Publish switch not found');
      const checked = await publishSwitch.getAttribute('aria-checked');
      if (checked === 'true' || await publishSwitch.evaluate((el) => el.classList.contains('is-checked'))) throw new Error('Publish switch already on');
      await publishSwitch.click();
      const saveResponsePromise = page.waitForResponse((r) => /DTB_proProduct\/saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 60000 });
      await page.getByRole('button', { name: '保存', exact: true }).click();
      const saveResponse = await saveResponsePromise;
      const receipt = await saveResponse.json();
      const ids = Array.isArray(receipt?.result) ? receipt.result.map(String) : [];
      if (saveResponse.status() !== 200 || ids.length !== 1 || ids[0] !== id) throw new Error(`Unsafe save receipt: ${JSON.stringify(ids)}`);
      result.steps.push({ step: 'save-receipt', ids });

      await page.waitForTimeout(1000);
      const after = rowOf(await readApi(id));
      const checks = {
        is_show: after?.IsShow === true, name: after?.Name === plan.product_name,
        title: after?.SeoTitle === plan.seo_title, meta: after?.SeoDesc === plan.meta_description,
        slug: after?.UrlValue === plan.slug, description_empty: String(after?.Content || '').trim() === '',
        details_fields: (String(after?.Summary || '').match(/<li\b/gi) || []).length === 5,
        gallery_preserved: (after?.ImgList || []).length === (before?.ImgList || []).length
      };
      if (Object.values(checks).some((x) => x !== true)) throw new Error(`Backend readback failed: ${JSON.stringify(checks)}`);
      result.steps.push({ step: 'backend-readback', checks });

      const canonical = `https://www.dripsneakers.org/${plan.slug}`;
      let frontend;
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await page.goto(canonical, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
        if (response?.status() === 200) {
          frontend = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent?.trim() || '', canonical: document.querySelector('link[rel=canonical]')?.href || '', descriptionImages: document.querySelectorAll('.description img, [class*=description] img').length }));
          if (frontend.h1 === plan.product_name && frontend.canonical === canonical) break;
        }
        await page.waitForTimeout(2000);
      }
      if (!frontend || frontend.h1 !== plan.product_name || frontend.canonical !== canonical) throw new Error(`Frontend readback failed: ${JSON.stringify(frontend)}`);
      result.steps.push({ step: 'frontend-readback', canonical, h1: frontend.h1 });
      result.success = true;
      result.completed_at = new Date().toISOString();
    } catch (error) {
      result.success = false;
      result.error = String(error?.stack || error);
      break;
    } finally {
      await fs.writeFile(path.join(outDir, 'execution-results.json'), `${JSON.stringify(results, null, 2)}\n`);
    }
  }
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}

console.log(JSON.stringify(results.map((x) => ({ product_id: x.product_id, success: x.success, error: x.error, steps: x.steps.map((s) => s.step) }))));
if (results.some((x) => !x.success)) process.exitCode = 1;
