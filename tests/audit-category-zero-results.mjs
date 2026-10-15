#!/usr/bin/env node

import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const SITEMAP_URL = 'https://www.dripsneakers.org/sitemap-product-category.xml';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = path.join(ROOT, 'reports', 'category-zero-results-2026-09-28.json');
const MD_PATH = path.join(ROOT, 'reports', 'category-zero-results-2026-09-28.md');
const MAX_CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;
const NAVIGATION_TIMEOUT_MS = 35_000;

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function parseResultsTexts(values) {
  const matches = [];
  for (const value of values) {
    const text = normalizeText(value);
    let match = text.match(/^(\d+)\s+Results$/i);
    if (match) {
      const number = Number(match[1]);
      matches.push({ text, number });
      continue;
    }
    match = text.match(/^\d+\s*-\s*\d+\s+of\s+(\d+)\s+Results$/i);
    if (match) matches.push({ text, number: Number(match[1]) });
  }
  if (matches.length === 0) return { state: 'unknown', text: null, number: null, error: 'Results node not found' };
  const distinct = [...new Set(matches.map((item) => item.number))];
  if (distinct.length !== 1) {
    return { state: 'unknown', text: matches.map((item) => item.text).join(' | '), number: null, error: 'Conflicting Results nodes' };
  }
  const chosen = matches.find((item) => /^\d+\s*-/.test(item.text)) ?? matches[0];
  return { state: chosen.number === 0 ? 'zero' : 'nonzero', text: chosen.text, number: chosen.number, error: null };
}

function runSelfTest() {
  const cases = [
    { name: 'zero', input: ['0 Results'], expected: 'zero', number: 0 },
    { name: 'nonzero', input: ['22 Results'], expected: 'nonzero', number: 22 },
    { name: 'missing', input: ['Products'], expected: 'unknown', number: null },
  ];
  let failures = 0;
  for (const test of cases) {
    const actual = parseResultsTexts(test.input);
    const pass = actual.state === test.expected && actual.number === test.number;
    console.log(`${pass ? 'PASS' : 'FAIL'} ${test.name}: expected=${test.expected}/${test.number ?? 'null'} actual=${actual.state}/${actual.number ?? 'null'}`);
    if (!pass) failures += 1;
  }
  console.log(`SELF_TEST ${failures === 0 ? 'PASS' : 'FAIL'}: ${cases.length - failures}/${cases.length}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

async function fetchSitemap() {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(SITEMAP_URL, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; DripCategoryReadOnlyAudit/1.0)' },
        signal: AbortSignal.timeout(NAVIGATION_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      const listed = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].replace(/&amp;/g, '&'));
      const urls = [...new Set(listed)];
      if (urls.length === 0) throw new Error('No category URLs in sitemap');
      return { urls, listedCount: listed.length, status: response.status, attempts: attempt };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Sitemap failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message ?? lastError}`);
}

function slugToName(url) {
  const slug = decodeURIComponent(new URL(url).pathname).replace(/^\/+|\/+$/g, '');
  return slug.replace(/--/g, ' & ').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

async function inspectPage(browser, url) {
  let last = { httpStatus: null, title: null, resultsText: null, resultsNumber: null, state: 'unknown', error: 'Not attempted' };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
      const httpStatus = response?.status() ?? null;
      await page.waitForTimeout(900);
      const title = normalizeText(await page.title());
      const pageData = await page.evaluate(() => {
        const bodyText = document.body?.innerText?.replace(/\s+/g, ' ').trim() ?? '';
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) {
          const parent = walker.currentNode.parentElement;
          if (!parent) continue;
          const style = getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const text = walker.currentNode.textContent?.replace(/\s+/g, ' ').trim();
          if (text) textNodes.push(text);
        }
        return { bodyText, textNodes };
      });

      const challenge = /captcha|verify you are human|cloudflare challenge|access denied/i.test(`${title} ${pageData.bodyText.slice(0, 1500)}`);
      let parsed = parseResultsTexts(pageData.textNodes);
      let error = parsed.error;
      if (httpStatus !== 200) {
        parsed = { state: 'unknown', text: parsed.text, number: null };
        error = `HTTP status ${httpStatus ?? 'missing'}`;
      } else if (challenge) {
        parsed = { state: 'unknown', text: parsed.text, number: null };
        error = 'Challenge/captcha page detected';
      } else if (pageData.bodyText.length < 80) {
        parsed = { state: 'unknown', text: parsed.text, number: null };
        error = 'Blank or near-blank page';
      }
      last = {
        httpStatus,
        title: title || null,
        resultsText: parsed.text,
        resultsNumber: parsed.number,
        state: parsed.state,
        attempts: attempt,
        error: parsed.state === 'unknown' ? error : null,
      };
      if (last.state !== 'unknown') return last;
    } catch (error) {
      last = {
        httpStatus: null,
        title: null,
        resultsText: null,
        resultsNumber: null,
        state: 'unknown',
        attempts: attempt,
        error: normalizeText(error?.message ?? error),
      };
    } finally {
      await page.close().catch(() => {});
    }
  }
  return last;
}

async function mapLimited(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      output[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return output;
}

function slugTokens(url) {
  return new Set(new URL(url).pathname.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
}

function relatedNonzero(target, records) {
  const targetTokens = slugTokens(target.url);
  const primaryToken = [...targetTokens][0];
  return records
    .filter((candidate) => candidate.state === 'nonzero' && candidate.url !== target.url)
    .map((candidate) => {
      const tokens = slugTokens(candidate.url);
      const shared = [...targetTokens].filter((token) => tokens.has(token)).length;
      const prefix = new URL(target.url).pathname.toLowerCase().startsWith(new URL(candidate.url).pathname.toLowerCase().replace(/\/$/, '-')) ? 2 : 0;
      const samePrimary = primaryToken && tokens.has(primaryToken) ? 2 : 0;
      return { candidate, score: shared + prefix + samePrimary };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.resultsNumber - a.candidate.resultsNumber)
    .slice(0, 3)
    .map((entry) => entry.candidate);
}

function recommendation(record, records) {
  const slug = new URL(record.url).pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const related = relatedNonzero(record, records);
  const alternatives = related.map((item) => `${item.categoryName} (${item.resultsNumber} Results)`);
  if (slug === 'drip-outfit') {
    return {
      recommendation: 'CLOSE',
      reason: '命名宽泛且为非标准小写旧式分类，当前为 0；站内已有 Apparel、Sets、STYLE PICKS 等更明确入口，建议关闭前先确认无外链依赖。',
      alternative: alternatives.join('；') || 'Apparel / Sets / STYLE PICKS',
    };
  }
  const reviewOnly = new Set(['common-projects', 'fendi', 'loewe', 'roger-vivier', 'versace', 'zegna', 'jordan-jumpman']);
  if (reviewOnly.has(slug)) {
    return {
      recommendation: 'REVIEW',
      reason: related.length > 0
        ? `当前为 0，但存在非零相关分类 ${alternatives[0]}；仅凭前台无法判断该独立入口是否仍有经营价值。`
        : '当前为 0，且 sitemap 内未发现可确认承接关系的非零同品牌分类；仅凭前台无法判断是否继续经营。',
      alternative: alternatives.join('；') || '需人工确认品牌经营计划与替代入口',
    };
  }
  if (related.length > 0) {
    return {
      recommendation: 'CONFIGURE',
      reason: `这是有效品牌、款式或品类入口；当前为 0，且站内存在非零相关分类 ${alternatives[0]}，应核对商品分类映射。`,
      alternative: alternatives.join('；'),
    };
  }
  if (slug === 'accessories') {
    const accessoryAlternatives = records
      .filter((item) => item.state === 'nonzero' && /\/(bags|scarf)\/?$/i.test(new URL(item.url).pathname))
      .map((item) => `${item.categoryName} (${item.resultsNumber} Results)`);
    return {
      recommendation: 'CONFIGURE',
      reason: '这是有效主分类入口；当前为 0，而站内 Bags 与 Scarf 子类为非零，应核对 Accessories 的商品映射或聚合规则。',
      alternative: accessoryAlternatives.join('；') || 'Bags / Scarf',
    };
  }
  return {
    recommendation: 'CONFIGURE',
    reason: '这是 sitemap 中仍公开的品牌、款式或主分类入口；当前为 0，建议核对商品分类映射，无法仅凭前台推断后台数量。',
    alternative: '对应品牌主分类或同商品类型主分类（需人工确认）',
  };
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function buildMarkdown(report) {
  const { summary, records } = report;
  const zero = records.filter((item) => item.state === 'zero');
  const unknown = records.filter((item) => item.state === 'unknown');
  const counts = Object.fromEntries(['CLOSE', 'CONFIGURE', 'REVIEW'].map((kind) => [kind, zero.filter((item) => item.recommendation === kind).length]));
  const lines = [
    '# 分类 0 Results 只读审计',
    '',
    `- 扫描时间：${summary.scannedAt}`,
    `- Sitemap：${summary.sitemapUrl}（HTTP ${summary.sitemapHttpStatus}；原始 ${summary.sitemapListed} 条；去重 ${summary.total} 条）`,
    `- 汇总：total=${summary.total}，zero=${summary.zero}，nonzero=${summary.nonzero}，unknown=${summary.unknown}`,
    `- 恒等式：${summary.total} = ${summary.zero} + ${summary.nonzero} + ${summary.unknown}（${summary.identityHolds ? '成立' : '不成立'}）`,
    '- 判定口径：仅 HTTP 200 且存在精确 Results 文本节点时计数；请求异常、非 200、验证码、空白页或缺少 Results 节点均为 UNKNOWN。',
    '',
    '## 0 Results 处理清单',
    '',
    '| 分类名 | URL | Results | HTTP | 建议 | 理由 | 可能对应的上级/替代分类 |',
    '|---|---|---:|---:|---|---|---|',
  ];
  for (const item of zero) {
    lines.push(`| ${escapeCell(item.categoryName)} | ${item.url} | ${escapeCell(item.resultsText)} | ${item.httpStatus} | ${item.recommendation} | ${escapeCell(item.reason)} | ${escapeCell(item.alternative)} |`);
  }
  lines.push('', '## UNKNOWN 清单', '');
  if (unknown.length === 0) {
    lines.push('无');
  } else {
    lines.push('| 分类名 | URL | HTTP | 尝试次数 | 错误 |', '|---|---|---:|---:|---|');
    for (const item of unknown) lines.push(`| ${escapeCell(item.categoryName)} | ${item.url} | ${item.httpStatus ?? '无'} | ${item.attempts} | ${escapeCell(item.error)} |`);
  }
  lines.push(
    '',
    '## 建议汇总与处理顺序',
    '',
    `- CLOSE：${counts.CLOSE} 页`,
    `- CONFIGURE：${counts.CONFIGURE} 页`,
    `- REVIEW：${counts.REVIEW} 页`,
    '',
    '优先级：① 先复核并处理 UNKNOWN，避免误判；② CONFIGURE 主分类与高关联款式分类，恢复商品映射；③ REVIEW 品牌经营价值和承接入口；④ CLOSE 前核对流量、外链与重定向，再由领导执行关闭。',
    '',
    '> 本报告只提供前台只读审计建议；未登录后台，未修改分类、商品、sitemap 或线上配置。',
    '',
  );
  return lines.join('\n');
}

async function readPreviousTotal() {
  try {
    const previous = JSON.parse(await fs.readFile(JSON_PATH, 'utf8'));
    return Number(previous?.summary?.total) || 0;
  } catch {
    return 0;
  }
}

async function main() {
  const startedAt = new Date();
  const sitemap = await fetchSitemap();
  const previousTotal = await readPreviousTotal();
  if (previousTotal > sitemap.urls.length) {
    console.warn(`SCAN_SKIPPED: current sitemap has ${sitemap.urls.length} URLs, fewer than preserved report ${previousTotal}; existing artifacts kept.`);
    return;
  }
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }
  const scanned = await mapLimited(sitemap.urls, MAX_CONCURRENCY, async (url, index) => {
    const result = await inspectPage(browser, url);
    console.log(`[${index + 1}/${sitemap.urls.length}] ${result.state.toUpperCase()} ${result.httpStatus ?? '-'} ${result.resultsText ?? '-'} ${url}`);
    return { url, categoryName: slugToName(url), ...result };
  });
  await browser.close();

  const records = scanned.map((record) => record.state === 'zero' ? { ...record, ...recommendation(record, scanned) } : record);
  const summary = {
    scannedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    sitemapUrl: SITEMAP_URL,
    sitemapHttpStatus: sitemap.status,
    sitemapListed: sitemap.listedCount,
    sitemapUnique: sitemap.urls.length,
    total: records.length,
    zero: records.filter((item) => item.state === 'zero').length,
    nonzero: records.filter((item) => item.state === 'nonzero').length,
    unknown: records.filter((item) => item.state === 'unknown').length,
    maxConcurrency: MAX_CONCURRENCY,
    maxRetriesPerPage: MAX_ATTEMPTS - 1,
    onlineWrites: 0,
  };
  summary.identityHolds = summary.total === summary.zero + summary.nonzero + summary.unknown;
  if (!summary.identityHolds || new Set(records.map((item) => item.url)).size !== sitemap.urls.length) {
    throw new Error('Audit invariant failed; reports not written');
  }
  const report = { summary, records };
  await fs.mkdir(path.dirname(JSON_PATH), { recursive: true });
  await fs.writeFile(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(MD_PATH, buildMarkdown(report), 'utf8');
  console.log(`SUMMARY total=${summary.total} zero=${summary.zero} nonzero=${summary.nonzero} unknown=${summary.unknown} identity=${summary.identityHolds ? 'PASS' : 'FAIL'}`);
  console.log(`REPORT_JSON ${JSON_PATH}`);
  console.log(`REPORT_MD ${MD_PATH}`);
}

if (process.argv.includes('--self-test')) {
  runSelfTest();
} else {
  main().catch((error) => {
    console.error(`FATAL ${error?.stack ?? error}`);
    process.exitCode = 1;
  });
}
