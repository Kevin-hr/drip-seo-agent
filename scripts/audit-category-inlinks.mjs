#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'gsc-category-indexing-2026-10-19');
const PAGE_AUDIT = path.join(REPORT_DIR, '188-category-page-audit.json');
const OUTPUT_JSON = path.join(REPORT_DIR, '188-category-inlink-audit.json');
const OUTPUT_CSV = path.join(REPORT_DIR, '188-category-inlink-audit.csv');
const ORIGIN = 'https://www.dripsneakers.org';
const DIRECTORY_URL = `${ORIGIN}/shop-by-category`;

function canonicalKey(value) {
  try {
    const url = new URL(value, ORIGIN);
    if (url.hostname !== 'www.dripsneakers.org') return null;
    url.hash = '';
    url.search = '';
    let pathname = decodeURIComponent(url.pathname).replace(/\/+/g, '/');
    if (!pathname.endsWith('/')) pathname += '/';
    return `${url.origin}${pathname}`.toLowerCase();
  } catch {
    return null;
  }
}

function extractHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)]
    .map((match) => match[1] ?? match[2] ?? match[3] ?? '')
    .filter(Boolean);
}

async function fetchHtml(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; DripCategoryInlinkAudit/1.0)' },
        signal: AbortSignal.timeout(35_000),
      });
      const html = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { status: response.status, html, attempts: attempt, error: null };
    } catch (error) {
      lastError = String(error?.message ?? error);
    }
  }
  return { status: null, html: '', attempts: 3, error: lastError ?? 'Unknown fetch error' };
}

async function mapLimited(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

function csv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const pageAudit = JSON.parse(await fs.readFile(PAGE_AUDIT, 'utf8'));
const targets = pageAudit.records.map((record) => record.originalUrl);
if (targets.length !== 188 || new Set(targets).size !== 188) throw new Error('Expected 188 ordered unique category targets');
const targetByKey = new Map(targets.map((url, index) => [canonicalKey(url), { url, order: index + 1 }]));
const sourceUrls = [`${ORIGIN}/`, DIRECTORY_URL, ...targets];
const fetched = await mapLimited(sourceUrls, 8, async (sourceUrl) => ({ sourceUrl, ...(await fetchHtml(sourceUrl)) }));
const incoming = new Map(targets.map((url) => [url, new Set()]));
for (const source of fetched) {
  if (source.error) continue;
  const destinationKeys = new Set(extractHrefs(source.html).map((href) => canonicalKey(new URL(href, source.sourceUrl).href)).filter(Boolean));
  for (const destinationKey of destinationKeys) {
    const target = targetByKey.get(destinationKey);
    if (target && target.url !== source.sourceUrl) incoming.get(target.url).add(source.sourceUrl);
  }
}
const records = targets.map((url, index) => {
  const sources = [...incoming.get(url)];
  return {
    sitemapOrder: index + 1,
    originalUrl: url,
    inlinkSourceCount: sources.length,
    linkedFromHome: sources.includes(`${ORIGIN}/`),
    linkedFromDirectory: sources.includes(DIRECTORY_URL),
    linkedFromCategoryCount: sources.filter((source) => source !== `${ORIGIN}/`).length,
    sampleSources: sources.slice(0, 10),
  };
});
const summary = {
  checkedAt: new Date().toISOString(),
  sourcesRequested: sourceUrls.length,
  sourcesSucceeded: fetched.filter((row) => !row.error).length,
  sourcesFailed: fetched.filter((row) => row.error).length,
  categoryTargets: targets.length,
  targetsWithAnyInlink: records.filter((row) => row.inlinkSourceCount > 0).length,
  targetsWithNoInlink: records.filter((row) => row.inlinkSourceCount === 0).length,
  targetsLinkedFromHome: records.filter((row) => row.linkedFromHome).length,
  directoryUrl: DIRECTORY_URL,
  targetsLinkedFromDirectory: records.filter((row) => row.linkedFromDirectory).length,
};
await fs.writeFile(OUTPUT_JSON, JSON.stringify({ summary, sourceErrors: fetched.filter((row) => row.error), records }, null, 2) + '\n', 'utf8');
const columns = ['sitemapOrder','originalUrl','inlinkSourceCount','linkedFromHome','linkedFromDirectory','linkedFromCategoryCount','sampleSources'];
const lines = [columns.map(csv).join(',')];
for (const record of records) lines.push(columns.map((column) => csv(Array.isArray(record[column]) ? record[column].join(' | ') : record[column])).join(','));
await fs.writeFile(OUTPUT_CSV, lines.join('\n') + '\n', 'utf8');
console.log(JSON.stringify(summary, null, 2));
