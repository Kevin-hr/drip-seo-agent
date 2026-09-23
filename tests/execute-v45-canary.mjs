import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildV45Description } from '../seo-agent/runtime/v45-description-policy.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.resolve(here, '../reports/evidence/v45-canary-536027542763285');
const plan = JSON.parse(await fs.readFile(path.join(evidenceDir, 'pdp-plan.json'), 'utf8'));
const typesafe = JSON.parse(await fs.readFile(path.join(evidenceDir, 'typesafe-decision.json'), 'utf8'));
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const commit = process.argv.includes('--commit');
const targetId = '536027542763285';

if (plan.product_id !== targetId) throw new Error('Target allowlist mismatch');
if (typesafe.product_id !== targetId || typesafe.normalized?.final_gate !== 'PASS') {
  throw new Error('TypeSafe V4.5 entity gate is not PASS');
}

const forbidden = /\b(?:Women|Women's|WMNS|Men|Men's|GS|PS|TD|Kids|Unisex|Top Quality|Best Quality|PKGod|Pkgod|Batch|1:1|Authentic Quality)\b/i;
const liCount = (plan.key_description_html.match(/<li\b/gi) || []).length;
const deterministic = {
  product_name_equals_h1: plan.product_name === plan.h1,
  title_template: plan.seo_title === `${plan.product_name} IQ9317-001 Reps | Drip Sneakers`,
  keywords_exactly_five: plan.seo_keywords.length === 5,
  meta_template: plan.meta_description === `Shop ${plan.product_name} reps (IQ9317-001) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.`,
  meta_length_in_range: plan.meta_description.length >= 120 && plan.meta_description.length <= 160,
  key_description_field_count_equals_5: liCount === 5,
  product_details_h2_present: /<h2>Product Details<\/h2>/i.test(plan.key_description_html),
  brand_link_present: /<li><strong>Brand:<\/strong>\s*<a href="https:\/\/www\.dripsneakers\.org\/sneakers\/">/i.test(plan.key_description_html),
  supplier_wording_absent: !forbidden.test(JSON.stringify(plan)),
  slug_valid: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plan.slug),
  canonical_matches_slug: plan.canonical_url === `https://www.dripsneakers.org/${plan.slug}`,
  description_images_explicit: Array.isArray(plan.description_images),
  description_policy_valid: plan.description_policy === 'independent-detail-images-only; empty when none',
  typesafe_gate_pass: typesafe.normalized.threshold_pass === true
};
if (Object.values(deterministic).some((v) => v !== true)) {
  throw new Error(`V4.5 deterministic gate failed: ${JSON.stringify(deterministic)}`);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
const formUrl = `https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${targetId}%5D`;

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

const mainRow = (json) => json.result.find((s) => s.name === 'dtb_proProduct')?.rows?.[0];
const contentSha = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');
const setTinyMce = async (index, html) => page.evaluate(({ index, html }) => {
  const main = document.querySelector('main');
  const editors = (window.tinymce?.editors || []).filter((e) => main.contains(e.getElement())).sort((a, b) => {
    const relation = a.getElement().compareDocumentPosition(b.getElement());
    return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : relation & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
  const editor = editors[index];
  if (!editor) return { ok: false, editorCount: editors.length };
  editor.setContent(html);
  editor.fire('change');
  editor.save();
  const source = editor.getElement();
  source.dispatchEvent(new Event('input', { bubbles: true }));
  source.dispatchEvent(new Event('change', { bubbles: true }));
  const content = editor.getContent() || '';
  return {
    ok: content.length > 0,
    editorCount: editors.length,
    length: content.length,
    imageCount: (content.match(/<img\b/gi) || []).length,
    altCount: (content.match(/\balt=/gi) || []).length,
    liCount: (content.match(/<li\b/gi) || []).length,
    hasProductDetails: /<h2>\s*Product Details\s*<\/h2>/i.test(content),
    hasBrandLink: /https:\/\/www\.dripsneakers\.org\/sneakers\//i.test(content)
  };
}, { index, html });

const result = { target_id: targetId, commit, deterministic, steps: [], success: false };
const step = (name, data = {}) => result.steps.push({ step: name, at: new Date().toISOString(), ...data });

try {
  await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const nameInput = page.getByPlaceholder('请输入商品名称').first();
  await nameInput.waitFor({ state: 'visible' });
  const beforeApi = await readApi();
  const before = mainRow(beforeApi);
  if (!before || String(before.Id) !== targetId) throw new Error('Fresh backend snapshot target mismatch');
  if (String(before.Name || '').trim() !== plan.baseline_name_trimmed) throw new Error('Fresh backend name drift');
  if (before.IsShow !== false) throw new Error('Canary is no longer unpublished');
  await fs.writeFile(path.join(evidenceDir, 'baseline-backup.json'), `${JSON.stringify(beforeApi, null, 2)}\n`, 'utf8');
  step('fresh-backup', { is_show: before.IsShow, name: before.Name, content_sha256: contentSha(before.Content), image_count: before.ImgList?.length || 0 });

  const brandProbe = await context.request.get('https://www.dripsneakers.org/sneakers/');
  if (brandProbe.status() !== 200) throw new Error(`Brand/category link returned ${brandProbe.status()}`);
  step('brand-link-probe', { url: 'https://www.dripsneakers.org/sneakers/', status: brandProbe.status() });

  const galleryUrls = new Set((before.ImgList || []).map((img) => /^https?:/i.test(img.s) ? img.s : `https://images.mrshopplus.com/${img.s}`));
  const description = buildV45Description({
    detailImages: plan.description_images,
    galleryUrls: [...galleryUrls],
    altBase: plan.image_alt_base
  });
  const { images, html: descriptionHtml, galleryOverlap } = description;
  await fs.writeFile(path.join(evidenceDir, 'generated-description.html'), `${descriptionHtml}\n`, 'utf8');
  step('description-generated', { source: 'explicit-detail-images-only', image_count: images.length, gallery_overlap: galleryOverlap, empty_when_none: images.length === 0 });

  if (!commit) {
    result.success = true;
    result.mode = 'dry-run';
  } else {

  await nameInput.fill(plan.product_name);
  const subtitle = page.getByPlaceholder('请输入商品副标题').first();
  await subtitle.fill(plan.subtitle);
  const descriptionWrite = await setTinyMce(0, descriptionHtml);
  const keyDescriptionWrite = await setTinyMce(1, plan.key_description_html);
  if ((images.length === 0 && descriptionWrite.length !== 0) ||
      (images.length > 0 && (!descriptionWrite.ok || descriptionWrite.imageCount !== images.length || descriptionWrite.altCount !== images.length))) {
    throw new Error(`Description TinyMCE readback failed: ${JSON.stringify(descriptionWrite)}`);
  }
  if (!keyDescriptionWrite.ok || keyDescriptionWrite.liCount !== 5 || !keyDescriptionWrite.hasProductDetails || !keyDescriptionWrite.hasBrandLink) {
    throw new Error(`Key Description TinyMCE readback failed: ${JSON.stringify(keyDescriptionWrite)}`);
  }
  step('content-filled', { editor_count: descriptionWrite.editorCount, description_images: images.length, key_description_li: liCount });

  await page.getByRole('button', { name: /编辑SEO/ }).click();
  const dialog = page.locator('.el-dialog:visible, .el-drawer:visible').last();
  const textareas = dialog.locator('textarea');
  if (await textareas.count() < 3) throw new Error('SEO dialog field count < 3');
  await textareas.nth(0).fill(plan.seo_title);
  await textareas.nth(1).fill(plan.meta_description);
  await textareas.nth(2).fill(plan.slug);

  const closeTags = dialog.locator('.el-select__tags .el-tag__close, .el-select__tags .el-tag .el-icon-close');
  for (let guard = 0; guard < 20 && await closeTags.count(); guard++) await closeTags.first().click();
  const keywordInput = dialog.locator('input.el-select__input').first();
  for (const keyword of plan.seo_keywords) {
    let added = false;
    for (let attempt = 1; attempt <= 3 && !added; attempt++) {
      const beforeCount = await dialog.locator('.el-select__tags .el-tag').count();
      await keywordInput.fill(keyword);
      await keywordInput.press('Enter');
      await page.waitForTimeout(250);
      added = await dialog.locator('.el-select__tags .el-tag').count() > beforeCount;
    }
    if (!added) throw new Error(`Keyword tag was not accepted: ${keyword}`);
  }
  const seoReadback = await textareas.evaluateAll((els) => els.map((e) => e.value));
  if (seoReadback[0] !== plan.seo_title || seoReadback[1] !== plan.meta_description || seoReadback[2] !== plan.slug) {
    throw new Error('SEO dialog readback mismatch');
  }
  const tagTexts = (await dialog.locator('.el-select__tags .el-tag').allInnerTexts()).map((s) => s.replace(/[×\n\t]/g, '').trim()).filter(Boolean);
  if (tagTexts.length !== 5 || !plan.seo_keywords.every((k) => tagTexts.includes(k))) throw new Error(`SEO keyword readback mismatch: ${JSON.stringify(tagTexts)}`);
  await dialog.getByRole('button', { name: /确定|保存/ }).last().click();
  step('seo-filled', { title_length: plan.seo_title.length, meta_length: plan.meta_description.length, keyword_count: tagTexts.length });

  const switchState = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll('main *')).find((el) => el.children.length === 0 && el.textContent?.trim() === '商品上架');
    const item = label?.closest('.el-form-item') || label?.parentElement;
    const sw = item?.querySelector('[role=switch], .el-switch, input[type=checkbox]');
    return sw ? { checked: sw.classList?.contains('is-checked') || sw.getAttribute('aria-checked') === 'true' || sw.checked === true } : null;
  });
  if (!switchState) throw new Error('Publish switch not found');
  if (switchState.checked) throw new Error('Publish switch unexpectedly already on');
  await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll('main *')).find((el) => el.children.length === 0 && el.textContent?.trim() === '商品上架');
    const item = label.closest('.el-form-item') || label.parentElement;
    item.querySelector('[role=switch], .el-switch, input[type=checkbox]').click();
  });
  step('publish-toggle', { clicks: 1 });

  const saveResponsePromise = page.waitForResponse((r) => /DTB_proProduct\/saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 60000 });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const saveResponse = await saveResponsePromise;
  const saveBody = await saveResponse.json().catch(() => null);
  const savedIds = Array.isArray(saveBody?.result) ? saveBody.result.map(String) : [];
  if (saveResponse.status() !== 200 || savedIds.length !== 1 || savedIds[0] !== targetId) {
    throw new Error(`Save receipt did not contain only target ID: ${JSON.stringify({ status: saveResponse.status(), savedIds })}`);
  }
  step('save-receipt', { status: saveResponse.status(), result_ids: savedIds });

  await page.waitForTimeout(1200);
  const afterApi = await readApi();
  const after = mainRow(afterApi);
  const apiChecks = {
    id: String(after?.Id) === targetId,
    is_show: after?.IsShow === true,
    name: after?.Name === plan.product_name,
    title: after?.SeoTitle === plan.seo_title,
    meta: after?.SeoDesc === plan.meta_description,
    slug: after?.UrlValue === plan.slug,
    description_image_only: !/>[^<\s][^<]*</.test(String(after?.Content || '').replace(/<section[^>]*>|<\/section>|<p>|<\/p>/g, '')),
    description_image_count: (String(after?.Content || '').match(/<img\b/gi) || []).length === images.length,
    description_alt_count: (String(after?.Content || '').match(/\balt=/gi) || []).length === images.length,
    key_description_li: (String(after?.Summary || '').match(/<li\b/gi) || []).length === 5,
    key_description_h2: /<h2>\s*Product Details\s*<\/h2>/i.test(String(after?.Summary || ''))
  };
  if (Object.values(apiChecks).some((v) => v !== true)) throw new Error(`Backend readback failed: ${JSON.stringify(apiChecks)}`);
  await fs.writeFile(path.join(evidenceDir, 'backend-readback.json'), `${JSON.stringify({ checks: apiChecks, row: after }, null, 2)}\n`, 'utf8');
  step('backend-readback', apiChecks);

  let frontend = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await page.goto(plan.canonical_url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    if (response?.status() === 200) {
      frontend = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        canonical: document.querySelector('link[rel=canonical]')?.href || '',
        meta: document.querySelector('meta[name=description]')?.content || '',
        detailsH2: Array.from(document.querySelectorAll('h2')).some((h) => h.textContent?.trim() === 'Product Details'),
        detailsLi: Array.from(document.querySelectorAll('h2')).find((h) => h.textContent?.trim() === 'Product Details')?.nextElementSibling?.querySelectorAll('li').length || 0,
        imageAlts: Array.from(document.querySelectorAll('main img[alt]')).map((img) => img.alt).filter(Boolean),
        schemas: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent || '')
      }));
      frontend.status = response.status();
      if (frontend.h1 === plan.h1 && frontend.canonical === plan.canonical_url) break;
    }
    await page.waitForTimeout(3000);
  }
  if (!frontend) throw new Error('Public frontend did not return HTTP 200');
  const productSchemas = frontend.schemas.flatMap((text) => { try { const parsed = JSON.parse(text); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; } }).filter((x) => x?.['@type'] === 'Product' || x?.['@graph']?.some?.((y) => y?.['@type'] === 'Product'));
  const frontendChecks = {
    http_200: frontend.status === 200,
    title: frontend.title.includes(plan.seo_title),
    h1: frontend.h1 === plan.h1,
    canonical: frontend.canonical === plan.canonical_url,
    meta: frontend.meta === plan.meta_description,
    product_details_h2: frontend.detailsH2,
    product_details_li: frontend.detailsLi === 5,
    image_alt: frontend.imageAlts.some((alt) => alt.includes('Nike Kobe 6 Protro Kay Yow Think Pink')),
    product_schema_present: productSchemas.length > 0,
    product_schema_name: JSON.stringify(productSchemas).includes(plan.product_name)
  };
  if (Object.values(frontendChecks).some((v) => v !== true)) throw new Error(`Frontend acceptance failed: ${JSON.stringify(frontendChecks)}`);
  await fs.writeFile(path.join(evidenceDir, 'frontend-readback.json'), `${JSON.stringify({ checks: frontendChecks, observed: frontend }, null, 2)}\n`, 'utf8');
  step('frontend-readback', frontendChecks);
  result.success = true;
  result.mode = 'commit';
  }
} catch (error) {
  result.error = String(error?.stack || error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(evidenceDir, commit ? 'execution-result.json' : 'dry-run-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  console.log(JSON.stringify({ success: result.success, mode: result.mode, error: result.error, steps: result.steps.map((s) => s.step) }));
}
