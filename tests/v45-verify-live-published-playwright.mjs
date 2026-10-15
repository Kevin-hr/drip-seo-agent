#!/usr/bin/env node

import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const manifestPath = path.resolve(process.argv[2] ?? 'reports/V4.5_PUBLISHED_MANIFEST.json');
const outDir = path.resolve(process.argv[3] ?? 'reports');
const concurrency = 8;
const attempts = 3;
const timeoutMs = 35_000;

const norm = (value) => String(value ?? '')
  .replace(/\u2013|\u2014/g, '-')
  .replace(/\u2019/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

async function inspect(browser, entry) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const page = await browser.newPage();
    try {
      await page.route('**/*', async (route) => {
        const type = route.request().resourceType();
        if (['image', 'media', 'font', 'stylesheet'].includes(type)) await route.abort();
        else await route.continue();
      });
      const response = await page.goto(entry.target_url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      const httpStatus = response?.status() ?? null;
      const data = await page.evaluate(() => {
        const schemas = [];
        for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
          try { schemas.push(JSON.parse(node.textContent || 'null')); } catch { /* ignore malformed JSON-LD */ }
        }
        return {
          title: document.title,
          h1s: [...document.querySelectorAll('h1')].map((node) => node.textContent?.trim() ?? ''),
          canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
          metaDescription: document.querySelector('meta[name="description"]')?.content ?? null,
          schemas,
          bodyPrefix: document.body?.innerText?.slice(0, 1500) ?? '',
        };
      });
      const challenge = /captcha|verify you are human|cloudflare challenge|access denied/i.test(`${data.title} ${data.bodyPrefix}`);
      if (httpStatus !== 200 || challenge) throw new Error(challenge ? 'challenge/captcha page' : `HTTP ${httpStatus ?? 'missing'}`);

      const schemaNodes = [];
      const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(visit); return; }
        schemaNodes.push(node);
        if (node['@graph']) visit(node['@graph']);
      };
      data.schemas.forEach(visit);
      const product = schemaNodes.find((node) => {
        const type = node['@type'];
        return type === 'Product' || (Array.isArray(type) && type.includes('Product'));
      });
      const canonicalMatch = norm(data.canonical).replace(/\/$/, '') === norm(entry.target_url).replace(/\/$/, '');
      const checks = {
        http_200: true,
        h1_match: norm(data.h1s[0]) === norm(entry.product_name),
        canonical_match: canonicalMatch,
        title_match: norm(data.title) === norm(entry.seo_title),
        meta_description_match: norm(data.metaDescription) === norm(entry.meta_description),
        product_schema_present: Boolean(product),
      };
      return {
        product_id: entry.product_id,
        product_name: entry.product_name,
        url: entry.target_url,
        state: 'verified',
        attempts: attempt,
        http_status: httpStatus,
        checks,
        pass: Object.values(checks).every(Boolean),
        h1_count: data.h1s.length,
        h1: data.h1s[0] ?? null,
        canonical: data.canonical,
        title: data.title,
        meta_description: data.metaDescription,
        schema_sku: product?.sku == null ? null : String(product.sku),
        schema_sku_is_pid: String(product?.sku ?? '') === String(entry.product_id),
        error: null,
      };
    } catch (error) {
      lastError = error?.message ?? String(error);
    } finally {
      await page.close();
    }
  }
  return {
    product_id: entry.product_id,
    product_name: entry.product_name,
    url: entry.target_url,
    state: 'unknown',
    attempts,
    http_status: null,
    checks: null,
    pass: false,
    error: lastError,
  };
}

async function mapLimited(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
      const result = results[index];
      console.log(`[${index + 1}/${items.length}] ${result.state.toUpperCase()} ${result.pass ? 'PASS' : 'FAIL'} ${result.http_status ?? '-'} ${result.url}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (!Array.isArray(manifest) || manifest.some((entry) => !entry.target_url)) {
  throw new Error('Manifest must be an array and every entry must have target_url');
}

const startedAt = new Date().toISOString();
let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
}
let results;
try {
  results = await mapLimited(manifest, concurrency, (entry) => inspect(browser, entry));
} finally {
  await browser.close();
}

const summary = {
  startedAt,
  completedAt: new Date().toISOString(),
  manifest: path.relative(process.cwd(), manifestPath).replace(/\\/g, '/'),
  total: results.length,
  pass: results.filter((item) => item.pass).length,
  fail: results.filter((item) => item.state === 'verified' && !item.pass).length,
  unknown: results.filter((item) => item.state === 'unknown').length,
  schemaSkuIsPid: results.filter((item) => item.schema_sku_is_pid).length,
  multipleH1: results.filter((item) => item.h1_count > 1).length,
  onlineWrites: 0,
};

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'V4.5_LIVE_VERIFICATION_PLAYWRIGHT.json'), `${JSON.stringify({ summary, results }, null, 2)}\n`);
const md = [
  '# V4.5 Live Verification (Playwright)',
  '',
  `- Completed: ${summary.completedAt}`,
  `- Total: ${summary.total}`,
  `- PASS: ${summary.pass}`,
  `- FAIL: ${summary.fail}`,
  `- UNKNOWN: ${summary.unknown}`,
  `- Product schema SKU equals internal PID: ${summary.schemaSkuIsPid}`,
  `- Pages with more than one H1: ${summary.multipleH1}`,
  `- Online writes: ${summary.onlineWrites}`,
  '',
  '| PID | Product | State | PASS | HTTP | Failed checks / error |',
  '|---|---|---|---:|---:|---|',
];
for (const result of results) {
  const failed = result.checks
    ? Object.entries(result.checks).filter(([, ok]) => !ok).map(([key]) => key).join(', ')
    : result.error;
  md.push(`| ${result.product_id} | ${String(result.product_name).replace(/\|/g, '\\|')} | ${result.state} | ${result.pass ? 'YES' : 'NO'} | ${result.http_status ?? '-'} | ${failed || '-'} |`);
}
await fs.writeFile(path.join(outDir, 'V4.5_LIVE_VERIFICATION_PLAYWRIGHT.md'), `${md.join('\n')}\n`);
console.log(`SUMMARY total=${summary.total} pass=${summary.pass} fail=${summary.fail} unknown=${summary.unknown} schemaSkuIsPid=${summary.schemaSkuIsPid} multipleH1=${summary.multipleH1}`);
