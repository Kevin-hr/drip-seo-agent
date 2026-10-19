#!/usr/bin/env node

import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'gsc-category-indexing-2026-10-19');
const OUTPUT_JSON = path.join(REPORT_DIR, '188-category-backend-audit.json');
const OUTPUT_CSV = path.join(REPORT_DIR, '188-category-backend-audit.csv');
const PAGE_AUDIT = path.join(REPORT_DIR, '188-category-page-audit.json');
const STORAGE_STATE = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const ADMIN_ORIGIN = 'https://www.mrshopplus.com';
const STORE_ORIGIN = 'https://www.dripsneakers.org';
const EXECUTABLE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';

function normalizePublicUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw, STORE_ORIGIN);
    url.hash = '';
    url.search = '';
    return url.href;
  } catch {
    return null;
  }
}

function key(value) {
  return normalizePublicUrl(value)?.toLowerCase() ?? null;
}

function csv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const pageAudit = JSON.parse(await fs.readFile(PAGE_AUDIT, 'utf8'));
const sitemapUrls = pageAudit.records.map((record) => record.originalUrl);
if (sitemapUrls.length !== 188 || new Set(sitemapUrls).size !== 188) throw new Error('Page audit must contain 188 ordered unique sitemap URLs');
await fs.access(STORAGE_STATE);

const browser = await chromium.launch({ headless: true, executablePath: EXECUTABLE });
const context = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(45_000);
const readRequests = [];
page.on('request', (request) => {
  const url = request.url();
  if (url.includes('/biz/DTB_proCategory/')) readRequests.push({ method: request.method(), url });
});

try {
  await page.goto(`${ADMIN_ORIGIN}/#/product/list_DTB_proCategory`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2500);

  const categoryResponse = await page.evaluate(async () => {
    const response = await fetch('/biz/DTB_proCategory/queryList', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ args: [{}, 0, 500] }),
    });
    const json = await response.json();
    if (!response.ok || !json?.success) throw new Error(`Category query failed: HTTP ${response.status}`);
    return json;
  });

  const rawRows = categoryResponse?.result?.data?.rows ?? [];
  const backendReportedTotal = categoryResponse?.result?.total ?? rawRows.length;
  const categories = rawRows.map((row) => ({
    id: row.Id,
    name: row.Name ?? null,
    url: row.Url ?? null,
    publicUrl: normalizePublicUrl(row.Url),
    isShow: row.IsShow === true,
    isAutomatic: row.IsAutomatic ?? null,
    seoTitle: row.SeoTitle ?? null,
    seoDesc: row.SeoDesc ?? null,
    seoKeyword: row.SeoKeyword ?? null,
    descriptionLength: String(row.Description ?? row.Desc ?? row.Content ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length,
  }));

  const byUrl = new Map(categories.filter((row) => row.publicUrl).map((row) => [key(row.publicUrl), row]));
  const matched = sitemapUrls.map((url, index) => {
    const category = byUrl.get(key(url));
    if (!category) return { sitemapOrder: index + 1, originalUrl: url, match: false };
    return { sitemapOrder: index + 1, originalUrl: url, match: true, ...category };
  });

  const memberById = new Map();
  for (let start = 0; start < matched.length; start += 4) {
    const chunk = matched.slice(start, start + 4).filter((item) => item.match);
    const results = await page.evaluate(async (targets) => Promise.all(targets.map(async (target) => {
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
            body: JSON.stringify({ args: [1, 1, { CategoryId: target.id, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc' }, target.id] }),
          });
          const text = await response.text();
          let json;
          try {
            json = JSON.parse(text);
          } catch {
            throw new Error(`Non-JSON HTTP ${response.status}: ${text.slice(0, 40)}`);
          }
          if (!response.ok || !json?.success) throw new Error(`HTTP ${response.status}`);
          const result = json.result ?? {};
          const cate = result.cate?.rows?.[0] ?? result.cate ?? {};
          return {
            id: target.id,
            total: result.queryResult?.total ?? null,
            showCount: result.showCount ?? null,
            isAutomatic: cate.IsAutomatic ?? null,
            isCondAnd: cate.IsCondAnd ?? null,
            andConditions: result.cateAndCond?.rows?.length ?? 0,
            orConditions: result.cateOrCond?.rows?.length ?? 0,
            attempts: attempt,
            error: null,
          };
        } catch (error) {
          lastError = String(error?.message ?? error);
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }
      return { id: target.id, attempts: 3, error: lastError ?? 'Unknown backend read error' };
    })), chunk.map((item) => ({ id: item.id })));
    for (const result of results) memberById.set(String(result.id), result);
    process.stderr.write(`backend categories ${Math.min(start + 4, matched.length)}/${matched.length}\n`);
  }

  const detailById = new Map();
  for (let start = 0; start < matched.length; start += 4) {
    const chunk = matched.slice(start, start + 4).filter((item) => item.match);
    const details = await page.evaluate(async (targets) => Promise.all(targets.map(async (target) => {
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch('/biz/DTB_proCategory/modify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
            body: JSON.stringify({ args: [[target.id]], additions: {} }),
          });
          const text = await response.text();
          let json;
          try {
            json = JSON.parse(text);
          } catch {
            throw new Error(`Non-JSON HTTP ${response.status}: ${text.slice(0, 40)}`);
          }
          if (!response.ok || !json?.success) throw new Error(`HTTP ${response.status}`);
          const table = (json.result ?? []).find((item) => String(item?.name ?? '').toLowerCase() === 'dtb_procategory');
          const row = table?.rows?.[0];
          if (!row || String(row.Id) !== String(target.id)) throw new Error('Category detail identity mismatch');
          return {
            id: target.id,
            detailName: row.Name ?? null,
            detailUrl: row.Url ?? null,
            detailIsShow: row.IsShow === true,
            descriptionHtml: row.Description ?? '',
            seoTitle: row.SeoTitle ?? '',
            seoDesc: row.SeoDesc ?? '',
            seoKeyword: row.SeoKeyword ?? '',
            modifyTime: row.ModifyTime ?? null,
            oldUrlValue: row.OldUrlValue ?? null,
            seoUrlChangeTo301: row.SeoUrlChangeTo301 ?? null,
            detailAttempts: attempt,
            detailError: null,
          };
        } catch (error) {
          lastError = String(error?.message ?? error);
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }
      return { id: target.id, detailAttempts: 3, detailError: lastError ?? 'Unknown category detail read error' };
    })), chunk.map((item) => ({ id: item.id })));
    for (const detail of details) detailById.set(String(detail.id), detail);
    process.stderr.write(`backend details ${Math.min(start + 4, matched.length)}/${matched.length}\n`);
  }

  const records = matched.map((item) => {
    const member = item.match ? memberById.get(String(item.id)) : {};
    const detail = item.match ? detailById.get(String(item.id)) : {};
    const html = String(detail?.descriptionHtml ?? '');
    const text = html.replace(/<[^>]*>/g, ' ').replace(/&[a-zA-Z0-9#]+;/g, ' ').replace(/\s+/g, ' ').trim();
    const internalLinks = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((href) => href.startsWith('/') || /dripsneakers\.org/i.test(href));
    const escapedMarkupCount = (html.match(/&lt;\/?(?:a|strong|p|h[1-6]|ul|li)\b/gi) ?? []).length;
    const result = {
      ...item,
      ...member,
      ...detail,
      descriptionHtmlLength: html.length,
      descriptionTextLength: text.length,
      descriptionHash: html ? crypto.createHash('sha256').update(html).digest('hex') : null,
      descriptionInternalLinkCount: internalLinks.length,
      escapedMarkupCount,
    };
    delete result.descriptionHtml;
    return result;
  });
  const published = categories.filter((row) => row.isShow && row.publicUrl);
  const summary = {
    checkedAt: new Date().toISOString(),
    mode: 'read-only',
    writeRequests: 0,
    backendReportedTotal,
    backendRows: categories.length,
    backendPublishedWithUrl: published.length,
    sitemapTotal: sitemapUrls.length,
    matched: records.filter((row) => row.match).length,
    missing: records.filter((row) => !row.match).length,
    matchedPublished: records.filter((row) => row.match && row.isShow).length,
    matchedHidden: records.filter((row) => row.match && !row.isShow).length,
    seoTitlePresent: records.filter((row) => row.match && String(row.seoTitle ?? '').trim()).length,
    seoDescPresent: records.filter((row) => row.match && String(row.seoDesc ?? '').trim()).length,
    seoKeywordPresent: records.filter((row) => row.match && String(row.seoKeyword ?? '').trim()).length,
    categoryDescriptionPresent: records.filter((row) => row.match && row.descriptionTextLength > 0).length,
    descriptionInternalLinkPresent: records.filter((row) => row.match && row.descriptionInternalLinkCount > 0).length,
    escapedMarkupPresent: records.filter((row) => row.match && row.escapedMarkupCount > 0).length,
    memberQueryErrors: records.filter((row) => row.error).length,
    detailQueryErrors: records.filter((row) => row.detailError).length,
    observedCategoryRequests: readRequests.length,
    observedNonPostCategoryRequests: readRequests.filter((request) => request.method !== 'POST').length,
  };
  if (summary.matched !== 188 || summary.matchedPublished !== 188 || summary.missing !== 0) {
    throw new Error(`Wrong tenant or backend mismatch: ${JSON.stringify(summary)}`);
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify({ summary, records }, null, 2) + '\n', 'utf8');
  const columns = ['sitemapOrder','originalUrl','match','id','name','url','publicUrl','isShow','isAutomatic','isCondAnd','total','showCount','andConditions','orConditions','attempts','detailName','detailUrl','detailIsShow','seoTitle','seoDesc','seoKeyword','descriptionHtmlLength','descriptionTextLength','descriptionHash','descriptionInternalLinkCount','escapedMarkupCount','modifyTime','oldUrlValue','seoUrlChangeTo301','detailAttempts','error','detailError'];
  const lines = [columns.map(csv).join(',')];
  for (const record of records) lines.push(columns.map((column) => csv(record[column])).join(','));
  await fs.writeFile(OUTPUT_CSV, lines.join('\n') + '\n', 'utf8');
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}
