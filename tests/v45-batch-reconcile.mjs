import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const baselinePath = process.env.V45_BASELINE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/p0-unpublish-plan/unpublished_products.json';
const outDir = path.resolve(process.env.V45_RUN_DIR || 'data/runs/v45-batch-2026-09-23');
const readConcurrency = Math.max(1, Math.min(12, Number(process.env.V45_READ_CONCURRENCY || 8)));

const sha256 = (value) => crypto.createHash('sha256').update(String(value ?? '')).digest('hex');
const normalizeName = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const extractSku = (value) => {
  const matches = normalizeName(value).toUpperCase().match(/\b[A-Z]{1,4}\d{2,6}-\d{2,4}\b/g) || [];
  return matches.at(-1) || '';
};
const classifyIndex = (name) => {
  const n = normalizeName(name);
  if (!n || n.length < 6) return { disposition: 'HOLD', reason: 'empty_or_short_name' };
  if (/send\s*pictures|send\s+picture/i.test(n)) return { disposition: 'HOLD', reason: 'placeholder_send_pictures' };
  if (/[\u4e00-\u9fff]/.test(n)) return { disposition: 'HOLD', reason: 'non_english_placeholder_or_test' };
  if (/(^|[\s-])test($|[\s-])|测试/i.test(n)) return { disposition: 'HOLD', reason: 'test_product' };
  if (/\*/.test(n)) return { disposition: 'HOLD', reason: 'masked_entity' };
  return { disposition: 'VERIFY', reason: 'requires_v45_entity_evidence' };
};
const brandBucket = (name) => {
  const n = normalizeName(name).toLowerCase();
  const brands = [
    ['nike', /\b(?:nike|air jordan|jordan)\b/], ['balenciaga', /\bbalenciaga\b/],
    ['adidas', /\badidas\b/], ['new-balance', /\bnew balance\b/],
    ['louis-vuitton', /\b(?:louis vuitton|lv)\b/], ['off-white', /\boff[ -]?white\b/],
    ['gucci', /\bgucci\b/], ['dior', /\bdior\b/], ['bape', /\b(?:bape|a bathing ape)\b/],
    ['asics', /\basics\b/], ['stussy', /\bstussy\b/], ['other', /.*/]
  ];
  return brands.find(([, re]) => re.test(n))?.[0] || 'other';
};

await fs.mkdir(outDir, { recursive: true });
const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
const baselineIds = new Set((baseline.products || []).map((p) => String(p.productId)));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/#/product', { waitUntil: 'domcontentloaded', timeout: 60000 });

const index = await page.evaluate(async () => {
  const rows = [];
  let pageNo = 0;
  let total = 0;
  while (pageNo < 50) {
    const response = await fetch('/biz/DTB_proProduct/queryList', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ args: [{}, pageNo, 500], additions: { Stoke: true } })
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(`queryList failed on page ${pageNo}`);
    total = Number(json.result.total);
    const batch = json.result.data?.rows || [];
    rows.push(...batch.map((r) => ({ id: String(r.Id), name: r.Name || '', isShow: r.IsShow, url: r.Url || '' })));
    pageNo += 1;
    if (!batch.length || rows.length >= total) break;
  }
  return { total, rows };
});

const unpublished = index.rows.filter((r) => r.isShow === false);
const indexById = new Map(index.rows.map((r) => [r.id, r]));
const baselineNoLongerUnpublished = [...baselineIds].filter((id) => indexById.get(id)?.isShow !== false);

let cursor = 0;
const details = new Array(unpublished.length);
const worker = async () => {
  const workerPage = await context.newPage();
  try {
    await workerPage.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    while (true) {
      const i = cursor++;
      if (i >= unpublished.length) return;
      const item = unpublished[i];
      let detail = null;
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        detail = await workerPage.evaluate(async (id) => {
        const response = await fetch('/biz/DTB_proProduct/modify', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
          body: JSON.stringify({ args: [[id]], additions: {} })
        });
        const text = await response.text();
        let json;
        try { json = JSON.parse(text); } catch { return { error: `modify_read_non_json_${response.status}` }; }
        if (!response.ok || !json.success) return { error: `modify_read_${response.status}` };
        const segment = (name) => json.result.find((s) => s.name === name)?.rows || [];
        const row = segment('dtb_proProduct')[0] || {};
        return {
          id: String(row.Id || id), isShow: row.IsShow, name: row.Name || '', url: row.Url || '',
          urlValue: row.UrlValue || '', brandName: row.BrandName || '', imageCount: (row.ImgList || []).length,
          imageFingerprint: (row.ImgList || []).map((x) => `${x.s || ''}|${x.a || ''}`).join('\n'),
          categories: segment('dtb_proProductCates').map((x) => x.CategoryName).filter(Boolean),
          skuCodes: segment('DTB_proSKU_ref').map((x) => x.SkuCode).filter(Boolean),
          seoTitle: row.SeoTitle || '', seoDesc: row.SeoDesc || '', seoKeyword: row.SeoKeyword || '',
          summary: row.Summary || '', content: row.Content || '', modifyTime: row.ModifyTime || null
        };
        }, item.id);
        if (!detail.error) break;
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
      details[i] = { ...item, ...detail };
    }
  } finally {
    await workerPage.close();
  }
};

await Promise.all(Array.from({ length: readConcurrency }, () => worker()));
await context.close();
await browser.close();

const queue = details.map((r) => {
  if (r.error) return { productId: r.id, name: normalizeName(r.name), disposition: 'HOLD', reason: r.error };
  const base = classifyIndex(r.name);
  let disposition = base.disposition;
  let reason = base.reason;
  if (r.isShow !== false) { disposition = 'SKIP'; reason = 'live_state_changed_during_reconcile'; }
  else if (r.imageCount < 1) { disposition = 'HOLD'; reason = 'no_gallery_image'; }
  const sku = extractSku(`${r.name} ${r.urlValue} ${r.skuCodes.join(' ')}`);
  return {
    productId: r.id, name: normalizeName(r.name), liveIsShow: r.isShow, disposition, reason,
    brandBucket: brandBucket(r.name), sku, skuEvidence: sku ? 'backend_name_url_or_sku_row' : 'none',
    imageCount: r.imageCount, imageFingerprintSha256: sha256(r.imageFingerprint), categories: r.categories,
    current: {
      seoTitleLength: r.seoTitle.length, seoDescLength: r.seoDesc.length,
      seoKeywordLength: r.seoKeyword.length, summaryLength: r.summary.length,
      contentLength: r.content.length, descriptionImageCount: (r.content.match(/<img\b/gi) || []).length,
      modifyTime: r.modifyTime, urlValue: r.urlValue
    }
  };
});

const countBy = (key) => Object.fromEntries([...queue.reduce((m, x) => m.set(x[key], (m.get(x[key]) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]));
const summary = {
  generatedAt: new Date().toISOString(), standard: 'V4.5', mode: 'read-only-reconcile',
  readConcurrency, indexTotal: index.total, fetched: index.rows.length, unpublishedAtIndex: unpublished.length,
  baselineTotal: baseline.meta?.total || baseline.products?.length || null,
  baselineNoLongerUnpublished: baselineNoLongerUnpublished.length,
  dispositions: countBy('disposition'), brands: countBy('brandBucket'),
  invariant: 'No product write or publish request was issued.'
};

await fs.writeFile(path.join(outDir, 'queue.json'), `${JSON.stringify({ summary, products: queue }, null, 2)}\n`);
await fs.writeFile(path.join(outDir, 'baseline-no-longer-unpublished.json'), `${JSON.stringify(baselineNoLongerUnpublished, null, 2)}\n`);
await fs.writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
