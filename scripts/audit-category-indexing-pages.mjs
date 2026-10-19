#!/usr/bin/env node

import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'gsc-category-indexing-2026-10-19');
const SITEMAP_URL = 'https://www.dripsneakers.org/sitemap-product-category.xml';
const OUTPUT_JSON = path.join(REPORT_DIR, '188-category-page-audit.json');
const OUTPUT_CSV = path.join(REPORT_DIR, '188-category-page-audit.csv');
const CONCURRENCY = 6;
const ATTEMPTS = 2;
const TIMEOUT_MS = 40_000;

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseResultCount(texts) {
  const candidates = [];
  for (const value of texts) {
    const text = clean(value);
    let match = text.match(/^(\d+)\s+Results$/i);
    if (!match) match = text.match(/^\d+\s*-\s*\d+\s+of\s+(\d+)\s+Results$/i);
    if (match) candidates.push({ text, count: Number(match[1]) });
  }
  const counts = [...new Set(candidates.map((item) => item.count))];
  if (counts.length !== 1) return { text: candidates.map((item) => item.text).join(' | ') || null, count: null, state: candidates.length ? 'conflict' : 'missing' };
  const selected = candidates.find((item) => /^\d+\s*-/.test(item.text)) ?? candidates[0];
  return { text: selected.text, count: selected.count, state: selected.count === 0 ? 'zero' : 'nonzero' };
}

async function fetchSitemap() {
  const response = await fetch(SITEMAP_URL, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; DripCategoryIndexingAudit/1.0)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}`);
  const xml = await response.text();
  const listed = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].replace(/&amp;/g, '&'));
  const unique = [...new Set(listed)];
  if (listed.length !== 188 || unique.length !== 188) throw new Error(`Expected 188 unique sitemap URLs, got listed=${listed.length}, unique=${unique.length}`);
  return { urls: unique, status: response.status };
}

async function auditOne(browser, url, order) {
  let lastError = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
      await page.waitForTimeout(900);
      const data = await page.evaluate(() => {
        const tidy = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
        const bodyText = tidy(document.body?.innerText);
        const mainText = tidy(document.querySelector('main')?.innerText || document.body?.innerText);
        const textNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const parent = walker.currentNode.parentElement;
          if (!parent) continue;
          const style = getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const text = tidy(walker.currentNode.textContent);
          if (text) textNodes.push(text);
        }
        const anchors = [...document.querySelectorAll('a[href]')].map((node) => {
          try { return new URL(node.getAttribute('href'), location.href).href; } catch { return null; }
        }).filter(Boolean);
        const internalLinks = [...new Set(anchors.filter((href) => {
          try { return new URL(href).hostname === location.hostname; } catch { return false; }
        }))];
        const schemaTypes = [];
        for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
          try {
            const parsed = JSON.parse(node.textContent);
            const visit = (value) => {
              if (!value || typeof value !== 'object') return;
              if (value['@type']) schemaTypes.push(...(Array.isArray(value['@type']) ? value['@type'] : [value['@type']]));
              if (Array.isArray(value)) value.forEach(visit);
              else Object.values(value).forEach(visit);
            };
            visit(parsed);
          } catch {}
        }
        return {
          title: tidy(document.title),
          h1: [...document.querySelectorAll('h1')].map((node) => tidy(node.innerText)).filter(Boolean),
          canonical: document.querySelector('link[rel~="canonical"]')?.href || null,
          robotsMeta: document.querySelector('meta[name="robots" i]')?.content || null,
          bodyText,
          mainText,
          textNodes,
          internalLinkCount: internalLinks.length,
          selfLinkPresent: internalLinks.some((href) => href.replace(/[?#].*$/, '') === location.href.replace(/[?#].*$/, '')),
          schemaTypes: [...new Set(schemaTypes)].sort(),
        };
      });
      const results = parseResultCount(data.textNodes);
      const status = response?.status() ?? null;
      const finalUrl = page.url();
      const xRobotsTag = response?.headers()?.['x-robots-tag'] ?? null;
      const challenge = /captcha|verify you are human|cloudflare challenge|access denied/i.test(`${data.title} ${data.bodyText.slice(0, 1600)}`);
      const noindex = /(?:^|[,;\s])noindex(?:$|[,;\s])/i.test(`${data.robotsMeta ?? ''} ${xRobotsTag ?? ''}`);
      const contentHash = crypto.createHash('sha256').update(data.mainText.slice(0, 200_000)).digest('hex');
      const record = {
        sitemapOrder: order,
        originalUrl: url,
        attempt,
        httpStatus: status,
        finalUrl,
        redirected: finalUrl !== url,
        canonical: data.canonical,
        canonicalMatchesOriginal: data.canonical === url,
        robotsMeta: data.robotsMeta,
        xRobotsTag,
        noindex,
        title: data.title,
        h1: data.h1,
        resultText: results.text,
        resultCount: results.count,
        resultState: results.state,
        mainTextLength: data.mainText.length,
        contentHash,
        internalLinkCount: data.internalLinkCount,
        selfLinkPresent: data.selfLinkPresent,
        schemaTypes: data.schemaTypes,
        challenge,
        error: null,
      };
      if (status === 200 && !challenge && data.bodyText.length >= 80) return record;
      lastError = `Unacceptable response: status=${status}, challenge=${challenge}, bodyLength=${data.bodyText.length}`;
    } catch (error) {
      lastError = clean(error?.message ?? error);
    } finally {
      await page.close().catch(() => {});
    }
  }
  return {
    sitemapOrder: order,
    originalUrl: url,
    attempt: ATTEMPTS,
    httpStatus: null,
    finalUrl: null,
    redirected: null,
    canonical: null,
    canonicalMatchesOriginal: null,
    robotsMeta: null,
    xRobotsTag: null,
    noindex: null,
    title: null,
    h1: [],
    resultText: null,
    resultCount: null,
    resultState: 'unknown',
    mainTextLength: null,
    contentHash: null,
    internalLinkCount: null,
    selfLinkPresent: null,
    schemaTypes: [],
    challenge: null,
    error: lastError ?? 'Unknown error',
  };
}

async function mapLimited(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await mapper(items[index], index);
      if ((index + 1) % 25 === 0 || index + 1 === items.length) process.stderr.write(`audited ${index + 1}/${items.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

function csv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const startedAt = new Date().toISOString();
const sitemap = await fetchSitemap();
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',
});
let records;
try {
  records = await mapLimited(sitemap.urls, CONCURRENCY, (url, index) => auditOne(browser, url, index + 1));
} finally {
  await browser.close().catch(() => {});
}
const completedAt = new Date().toISOString();
const summary = {
  startedAt,
  completedAt,
  sitemapUrl: SITEMAP_URL,
  sitemapHttpStatus: sitemap.status,
  total: records.length,
  http200: records.filter((r) => r.httpStatus === 200).length,
  redirected: records.filter((r) => r.redirected).length,
  canonicalMatch: records.filter((r) => r.canonicalMatchesOriginal).length,
  canonicalMismatch: records.filter((r) => r.canonical && !r.canonicalMatchesOriginal).length,
  canonicalMissing: records.filter((r) => !r.canonical).length,
  noindex: records.filter((r) => r.noindex).length,
  nonzero: records.filter((r) => r.resultState === 'nonzero').length,
  zero: records.filter((r) => r.resultState === 'zero').length,
  resultUnknown: records.filter((r) => !['nonzero', 'zero'].includes(r.resultState)).length,
  errors: records.filter((r) => r.error).length,
};
await fs.mkdir(REPORT_DIR, { recursive: true });
await fs.writeFile(OUTPUT_JSON, JSON.stringify({ summary, records }, null, 2) + '\n', 'utf8');
const columns = ['sitemapOrder','originalUrl','httpStatus','finalUrl','redirected','canonical','canonicalMatchesOriginal','robotsMeta','xRobotsTag','noindex','title','h1','resultText','resultCount','resultState','mainTextLength','contentHash','internalLinkCount','selfLinkPresent','schemaTypes','challenge','attempt','error'];
const lines = [columns.map(csv).join(',')];
for (const record of records) {
  lines.push(columns.map((key) => csv(Array.isArray(record[key]) ? record[key].join(' | ') : record[key])).join(','));
}
await fs.writeFile(OUTPUT_CSV, lines.join('\n') + '\n', 'utf8');
console.log(JSON.stringify(summary, null, 2));
