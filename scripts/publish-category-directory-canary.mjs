#!/usr/bin/env node

import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'gsc-category-indexing-2026-10-19');
const BACKEND_AUDIT = path.join(REPORT_DIR, '188-category-backend-audit.json');
const RECEIPT_PATH = path.join(REPORT_DIR, 'category-directory-canary-receipt.json');
const BACKUP_PATH = path.join(REPORT_DIR, 'category-directory-precreate-backup.json');
const UPDATE_BACKUP_PATH = path.join(REPORT_DIR, 'category-directory-preupdate-backup.json');
const STORAGE_STATE = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const EXECUTABLE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';
const COMMIT = process.argv.includes('--commit');
const UPDATE_EXISTING = process.argv.includes('--update-existing');
const NAME = 'Shop by Category';
const SLUG = 'shop-by-category';
const PUBLIC_URL = `https://www.dripsneakers.org/${SLUG}`;
const SEO_TITLE = 'Shop by Category | Sneakers & Streetwear | Drip Sneakers';
const SEO_DESC = 'Browse every Drip Sneakers category in one place, including sneakers, hoodies, T-shirts, jeans, jackets, bags and accessories.';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function normalizeName(record) {
  return String(record.detailName ?? record.name ?? new URL(record.originalUrl).pathname.replaceAll('/', '').replaceAll('-', ' ')).trim();
}

function buildDirectory(records) {
  const sorted = records.map((record) => ({ name: normalizeName(record), url: record.originalUrl }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.url.localeCompare(b.url));
  const groups = new Map();
  for (const item of sorted) {
    const first = item.name[0]?.toUpperCase() ?? '#';
    const group = /^[A-Z0-9]$/.test(first) ? first : '#';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }
  const sections = [...groups.entries()].map(([letter, items]) => [
    `<section class="category-directory-group" aria-labelledby="category-${escapeHtml(letter)}">`,
    `<h2 id="category-${escapeHtml(letter)}">${escapeHtml(letter)}</h2>`,
    '<ul>',
    ...items.map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a></li>`),
    '</ul>',
    '</section>',
  ].join('\n')).join('\n');
  return [
    '<div class="category-directory">',
    '<p>Browse our complete category directory for sneakers, clothing, bags and accessories. Each link opens the current category page with available products, photos and sizing information.</p>',
    '<nav aria-label="All product categories">',
    sections,
    '</nav>',
    '</div>',
  ].join('\n');
}

const backend = JSON.parse(await fs.readFile(BACKEND_AUDIT, 'utf8'));
const records = backend.records;
if (records.length !== 188 || records.some((record) => !record.match || !record.detailIsShow)) throw new Error('Backend audit must contain 188 matched, published categories');
const html = buildDirectory(records);
const hrefs = [...html.matchAll(/<a\s+href="([^"]+)"/g)].map((match) => match[1]);
if (hrefs.length !== 188 || new Set(hrefs).size !== 188) throw new Error(`Directory link invariant failed: links=${hrefs.length}, unique=${new Set(hrefs).size}`);

const browser = await chromium.launch({ headless: true, executablePath: EXECUTABLE });
const context = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(45_000);
const receipt = {
  startedAt: new Date().toISOString(),
  mode: COMMIT ? (UPDATE_EXISTING ? 'commit-update' : 'commit-create') : (UPDATE_EXISTING ? 'dry-run-update' : 'dry-run-create'),
  name: NAME,
  slug: SLUG,
  publicUrl: PUBLIC_URL,
  categoryLinks: hrefs.length,
  uniqueCategoryLinks: new Set(hrefs).size,
  htmlLength: html.length,
  steps: [],
};

async function listPages() {
  return page.evaluate(async () => {
    const response = await fetch('/biz/DTB_CustomPage/queryList', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ args: [{}, 0, 100] }),
    });
    const json = await response.json();
    if (!response.ok || !json?.success) throw new Error(`Custom page list failed: HTTP ${response.status}`);
    return { total: json.result?.total ?? null, rows: json.result?.data?.rows ?? [] };
  });
}

try {
  await page.goto('https://www.mrshopplus.com/#/shop/list_DTB_CustomPage', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);
  const before = await listPages();
  const existing = before.rows.filter((row) => String(row.Name ?? '').trim().toLowerCase() === NAME.toLowerCase() || String(row.Url ?? '').toLowerCase().replace(/^\//, '') === SLUG);
  if (existing.length && !UPDATE_EXISTING) throw new Error(`Directory page already exists: ${JSON.stringify(existing.map((row) => ({ Id: row.Id, Name: row.Name, Url: row.Url })))}`);
  if (UPDATE_EXISTING && existing.length !== 1) throw new Error(`Update requires exactly one existing directory page, found ${existing.length}`);
  await fs.writeFile(BACKUP_PATH, JSON.stringify({ capturedAt: new Date().toISOString(), total: before.total, rows: before.rows }, null, 2) + '\n', 'utf8');
  receipt.steps.push({ step: 'precreate-backup', pageCount: before.rows.length, path: BACKUP_PATH });

  if (UPDATE_EXISTING) {
    const detail = await page.evaluate(async (id) => {
      const response = await fetch('/biz/DTB_CustomPage/modify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
        body: JSON.stringify({ args: [[id]], additions: {} }),
      });
      const json = await response.json();
      if (!response.ok || !json?.success) throw new Error(`Custom page detail failed: HTTP ${response.status}`);
      return json;
    }, existing[0].Id);
    await fs.writeFile(UPDATE_BACKUP_PATH, JSON.stringify({ capturedAt: new Date().toISOString(), id: existing[0].Id, detail }, null, 2) + '\n', 'utf8');
    receipt.steps.push({ step: 'preupdate-backup', id: existing[0].Id, path: UPDATE_BACKUP_PATH });
  }

  const formUrl = UPDATE_EXISTING
    ? `https://www.mrshopplus.com/#/shop/form_DTB_CustomPage/0?action=3&pkValues=%5B${existing[0].Id}%5D`
    : 'https://www.mrshopplus.com/#/shop/form_DTB_CustomPage/0?action=2';
  await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1000);
  const nameInput = page.locator('input[placeholder="请输入名称"]');
  if (await nameInput.count() !== 1) throw new Error('Expected one custom-page name input');
  await nameInput.fill(NAME);

  const editorState = await page.evaluate((content) => {
    const main = document.querySelector('main');
    const editors = (window.tinymce?.editors ?? []).filter((editor) => main?.contains(editor.getElement()));
    if (editors.length !== 1) return { ok: false, editorCount: editors.length };
    const editor = editors[0];
    editor.setContent(content);
    editor.fire('change');
    editor.save();
    editor.getElement().dispatchEvent(new Event('input', { bubbles: true }));
    return { ok: editor.getContent().includes('Browse our complete category directory'), editorCount: editors.length, contentLength: editor.getContent().length };
  }, html);
  if (!editorState.ok) throw new Error(`Editor fill failed: ${JSON.stringify(editorState)}`);

  const seoButton = page.locator('button.el-button--text').filter({ hasText: '编辑SEO' });
  if (await seoButton.count() !== 1) throw new Error('Expected one Edit SEO button');
  await seoButton.click();
  const drawer = page.locator('.el-drawer').filter({ visible: true });
  if (await drawer.count() !== 1) throw new Error('Expected one visible SEO drawer');
  const textareas = drawer.locator('textarea');
  if (await textareas.count() !== 3) throw new Error('Expected SEO title, description and slug textareas');
  await textareas.nth(0).fill(SEO_TITLE);
  await textareas.nth(1).fill(SEO_DESC);
  await textareas.nth(2).fill(SLUG);
  const confirm = drawer.getByRole('button', { name: '确定', exact: true });
  if (await confirm.count() !== 1) throw new Error('Expected one SEO confirm button');
  await confirm.click();
  receipt.steps.push({ step: 'form-prepared', editorState, seoTitle: SEO_TITLE, seoDesc: SEO_DESC, slug: SLUG });

  if (!COMMIT) {
    receipt.completedAt = new Date().toISOString();
    await fs.writeFile(RECEIPT_PATH, JSON.stringify(receipt, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify(receipt, null, 2));
    process.exitCode = 0;
  } else {
    const saveButton = page.getByRole('button', { name: '保存', exact: true });
    if (await saveButton.count() !== 1) throw new Error('Expected one Save button');
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes('/biz/DTB_CustomPage/') &&
      response.request().method() === 'POST' &&
      !/\/queryList$/i.test(response.url()) &&
      !/\/modify$/i.test(response.url()), { timeout: 60_000 });
    await saveButton.click();
    const saveResponse = await responsePromise;
    const saveText = await saveResponse.text();
    let saveJson;
    try { saveJson = JSON.parse(saveText); } catch { saveJson = { raw: saveText.slice(0, 500) }; }
    receipt.steps.push({ step: 'saved', endpoint: saveResponse.url(), status: saveResponse.status(), response: saveJson });
    if (saveResponse.status() !== 200 || saveJson?.success !== true) throw new Error(`Save failed: ${saveResponse.status()} ${saveText.slice(0, 300)}`);

    await page.goto('https://www.mrshopplus.com/#/shop/list_DTB_CustomPage', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(800);
    const after = await listPages();
    const verified = after.rows.filter((row) => String(row.Name ?? '').trim() === NAME && String(row.Url ?? '').toLowerCase().replace(/^\//, '') === SLUG);
    if (verified.length !== 1) throw new Error(`Page verification failed: ${JSON.stringify(verified)}`);
    receipt.created = { Id: verified[0].Id, Name: verified[0].Name, Url: verified[0].Url, ModifyTime: verified[0].ModifyTime };
    receipt.steps.push({ step: 'backend-verified', created: receipt.created });

    const publicResponse = await page.goto(PUBLIC_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(800);
    const publicCheck = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')].map((anchor) => anchor.href).filter((href) => {
        try { return new URL(href).hostname === 'www.dripsneakers.org'; } catch { return false; }
      });
      const categoryLinks = [...new Set(links.filter((href) => /\/$/.test(new URL(href).pathname)))];
      return {
        title: document.title,
        canonical: document.querySelector('link[rel~="canonical"]')?.href ?? null,
        h1: [...document.querySelectorAll('h1')].map((node) => node.innerText.trim()).filter(Boolean),
        categoryLinkCount: categoryLinks.length,
      };
    });
    receipt.publicCheck = { httpStatus: publicResponse?.status() ?? null, ...publicCheck };
    if (receipt.publicCheck.httpStatus !== 200 || publicCheck.h1.length !== 1 || publicCheck.h1[0] !== NAME || publicCheck.categoryLinkCount < 188) {
      throw new Error(`Public verification failed: ${JSON.stringify(receipt.publicCheck)}`);
    }
    receipt.steps.push({ step: 'public-verified', check: receipt.publicCheck });
    receipt.completedAt = new Date().toISOString();
    await fs.writeFile(RECEIPT_PATH, JSON.stringify(receipt, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify(receipt, null, 2));
  }
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}
