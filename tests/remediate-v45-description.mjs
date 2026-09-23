import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.resolve(here, '../reports/evidence/v45-canary-536027542763285');
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const targetId = '536027542763285';
const canonicalUrl = 'https://www.dripsneakers.org/nike-kobe-6-protro-kay-yow-think-pink-2026-iq9317-001';
const expectedName = 'Nike Kobe 6 Protro Kay Yow Think Pink (2026)';
const expectedDuplicateCount = 12;
const commit = process.argv.includes('--commit');

const sha = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');
const stable = (value) => JSON.stringify(value);
const rowOf = (json) => json.result.find((segment) => segment.name === 'dtb_proProduct')?.rows?.[0];
const segmentRows = (json, name) => json.result.find((segment) => segment.name === name)?.rows || [];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
const result = { target_id: targetId, commit, success: false, steps: [] };
const step = (name, data = {}) => result.steps.push({ step: name, at: new Date().toISOString(), ...data });

const readApi = async () => page.evaluate(async (id) => {
  const response = await fetch('/biz/DTB_proProduct/modify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
    credentials: 'include',
    body: JSON.stringify({ args: [[id]], additions: {} })
  });
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(`modify read failed: ${response.status}`);
  return json;
}, targetId);

try {
  await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${targetId}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByPlaceholder('请输入商品名称').first().waitFor({ state: 'visible' });

  const beforeApi = await readApi();
  const before = rowOf(beforeApi);
  if (!before || String(before.Id) !== targetId || before.Name !== expectedName || before.IsShow !== true) {
    throw new Error('Target identity or publication state changed');
  }

  const content = String(before.Content || '');
  const contentUrls = [...content.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((match) => match[1]);
  const galleryUrls = (before.ImgList || []).map((image) => /^https?:/i.test(image.s) ? image.s : `https://images.mrshopplus.com/${image.s}`);
  const isKnownCanaryDefect =
    /data-standard="4\.5"/i.test(content) &&
    contentUrls.length === expectedDuplicateCount &&
    contentUrls.every((url) => galleryUrls.includes(url)) &&
    galleryUrls.every((url) => contentUrls.includes(url));
  if (!isKnownCanaryDefect) throw new Error('Description is not the exact known 12-gallery-image duplication; refusing to clear');

  await fs.writeFile(path.join(evidenceDir, 'description-remediation-backup.json'), `${JSON.stringify(beforeApi, null, 2)}\n`, 'utf8');
  step('backup', { content_sha256: sha(content), duplicate_images: contentUrls.length, gallery_images: galleryUrls.length });

  if (!commit) {
    result.success = true;
    result.mode = 'dry-run';
  } else {
  const editorResult = await page.evaluate(() => {
    const main = document.querySelector('main');
    const editors = (window.tinymce?.editors || []).filter((editor) => main.contains(editor.getElement())).sort((a, b) => {
      const relation = a.getElement().compareDocumentPosition(b.getElement());
      return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : relation & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
    });
    if (editors.length !== 2) return { ok: false, editorCount: editors.length };
    const editor = editors[0];
    editor.setContent('');
    editor.fire('change');
    editor.save();
    const source = editor.getElement();
    source.dispatchEvent(new Event('input', { bubbles: true }));
    source.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: (editor.getContent() || '').trim() === '', editorCount: editors.length, keyDescriptionLength: (editors[1].getContent() || '').length };
  });
  if (!editorResult.ok) throw new Error(`Description editor did not clear: ${JSON.stringify(editorResult)}`);
  step('editor-cleared', editorResult);

  const savePromise = page.waitForResponse((response) => /DTB_proProduct\/saveModify/i.test(response.url()) && response.request().method() !== 'GET', { timeout: 60000 });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const saveResponse = await savePromise;
  const saveBody = await saveResponse.json().catch(() => null);
  const savedIds = Array.isArray(saveBody?.result) ? saveBody.result.map(String) : [];
  if (saveResponse.status() !== 200 || savedIds.length !== 1 || savedIds[0] !== targetId) {
    throw new Error(`Unexpected save receipt: ${JSON.stringify({ status: saveResponse.status(), savedIds })}`);
  }
  step('save-receipt', { status: saveResponse.status(), result_ids: savedIds });

  await page.waitForTimeout(1200);
  const afterApi = await readApi();
  const after = rowOf(afterApi);
  const invariantKeys = [
    'Id', 'IsShow', 'Name', 'Summary', 'SeoTitle', 'SeoKeyword', 'SeoDesc', 'UrlValue', 'Url',
    'BasePrice', 'MarketPrice', 'FirstImg', 'ImgList', 'Attrs', 'MultipleSku', 'DefaultSku',
    'DeliveryTemp', 'TplId', 'EnabledCoupon', 'Weight', 'MeasureUnit'
  ];
  const drift = invariantKeys.filter((key) => stable(before[key]) !== stable(after[key]));
  if (String(after.Content || '').trim() !== '') throw new Error('Backend Description is not empty after save');
  if (drift.length) throw new Error(`Unexpected backend drift: ${drift.join(', ')}`);
  if (stable(segmentRows(beforeApi, 'DTB_proSKU_ref')) !== stable(segmentRows(afterApi, 'DTB_proSKU_ref'))) throw new Error('SKU rows drifted');
  if (stable(segmentRows(beforeApi, 'dtb_proProductCates')) !== stable(segmentRows(afterApi, 'dtb_proProductCates'))) throw new Error('Category rows drifted');
  await fs.writeFile(path.join(evidenceDir, 'description-remediation-backend-readback.json'), `${JSON.stringify({ content_empty: true, invariant_drift: drift, row: after }, null, 2)}\n`, 'utf8');
  step('backend-readback', { content_empty: true, invariant_drift: drift, gallery_images: after.ImgList?.length || 0 });

  let frontend;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await page.goto(canonicalUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    if (response?.status() === 200) {
      frontend = await page.evaluate(() => ({
        statusMarker: document.readyState,
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        canonical: document.querySelector('link[rel=canonical]')?.href || '',
        exactProductGalleryImages: Array.from(document.querySelectorAll('main img')).filter((image) => image.alt === 'Nike Kobe 6 Protro Kay Yow Think Pink (2026)').length,
        descriptionImages: document.querySelectorAll('section.ds-pdp-description img').length,
        productDetails: Array.from(document.querySelectorAll('h2')).some((heading) => heading.textContent?.trim() === 'Product Details')
      }));
      frontend.httpStatus = response.status();
      if (frontend.h1 === expectedName && frontend.descriptionImages === 0) break;
    }
    await page.waitForTimeout(2500);
  }
  const frontendChecks = {
    http_200: frontend?.httpStatus === 200,
    h1_unchanged: frontend?.h1 === expectedName,
    canonical_unchanged: frontend?.canonical === canonicalUrl,
    gallery_preserved: frontend?.exactProductGalleryImages >= expectedDuplicateCount,
    description_duplicate_images_removed: frontend?.descriptionImages === 0,
    product_details_preserved: frontend?.productDetails === true
  };
  if (Object.values(frontendChecks).some((value) => value !== true)) throw new Error(`Frontend remediation verification failed: ${JSON.stringify(frontendChecks)}`);
  await fs.writeFile(path.join(evidenceDir, 'description-remediation-frontend-readback.json'), `${JSON.stringify({ checks: frontendChecks, observed: frontend }, null, 2)}\n`, 'utf8');
  step('frontend-readback', frontendChecks);

  result.success = true;
  result.mode = 'commit';
  }
} catch (error) {
  result.error = String(error?.stack || error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(evidenceDir, 'description-remediation-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  console.log(JSON.stringify({ success: result.success, error: result.error, steps: result.steps.map((entry) => entry.step) }));
}
