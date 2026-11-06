// Import only inside the supported CUA JavaScript session, with its existing tab binding.
// This module has no browser connection, cookie, CDP, fetch or login implementation.
import fs from 'node:fs/promises';
import path from 'node:path';

const publicQueryKeys = new Set(['q', 'db', 'date', 'device', 'mode', 'searchType', 'phrase']);

export function safeUrl(value) {
  if (!value) return undefined;
  const u = new URL(value);
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) {
    throw new Error('Use a public HTTP(S) URL without embedded credentials.');
  }
  for (const key of [...u.searchParams.keys()]) {
    if (!publicQueryKeys.has(key)) u.searchParams.delete(key);
  }
  u.hash = '';
  return u.toString();
}

export function publicTarget(value) {
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password ||
      [...u.searchParams.keys()].some(k => /token|cookie|secret|password|authorization|session|__gmitm|api.?key/i.test(k))) {
    throw new Error('Target must be public and contain no credential-like URL parameters.');
  }
  u.hash = '';
  return u.toString();
}

export async function captureKeywordData(tab, outDir, context) {
  for (const key of ['target_url', 'country', 'language', 'device', 'metrics_updated']) {
    if (!context?.[key]) throw new Error(`Read the visible UI and supply context.${key}.`);
  }
  if (!path.isAbsolute(outDir)) throw new Error('outDir must be an absolute new directory.');
  // Only the documented read-only DOM interface is used. No hidden application state.
  const raw = await tab.playwright.evaluate(() => ({
    h1: document.querySelector('h1')?.innerText || '',
    rows: [...document.querySelectorAll('tr,[role="row"]')].map(e => e.innerText),
    selected_tabs: [...document.querySelectorAll('[role="tab"][aria-selected="true"]')].map(e => e.innerText),
    country_controls: [...document.querySelectorAll('button')]
      .filter(e => /国家|地区|country|database/i.test(e.getAttribute('aria-label') || ''))
      .map(e => ({label: e.getAttribute('aria-label'), text: e.innerText}))
  }));
  if (!/关键词魔法工具|Keyword Magic Tool/i.test(raw.h1) || raw.rows.length < 2) {
    throw new Error('The current DOM is not a populated Keyword Magic result table.');
  }
  const capturedAt = new Date().toISOString();
  await fs.mkdir(outDir); // EEXIST stops; historical evidence is never overwritten.
  const savedContext = {
    schema_version: 1,
    source: 'Semrush UI',
    target_url: publicTarget(context.target_url),
    country: context.country,
    language: context.language,
    device: context.device,
    observed_at: capturedAt,
    report_date: context.report_date || null,
    metrics_updated: context.metrics_updated,
    capture_mode: 'LIVE_UI',
    capture_scope: 'currently_rendered_DOM_rows_only',
    evidence_path: path.join(outDir, 'semrush-dom-rows.json'),
    screenshot_path: path.join(outDir, 'semrush-keywords.jpg'),
    source_url: safeUrl(context.source_url),
    context_verification: 'Operator must compare supplied country/device with visible controls; these values are not inferred from query text.'
  };
  await fs.writeFile(path.join(outDir, 'semrush-dom-rows.json'), JSON.stringify(raw, null, 2), {flag: 'wx'});
  await fs.writeFile(path.join(outDir, 'context.json'), JSON.stringify(savedContext, null, 2), {flag: 'wx'});
  return {raw_path: savedContext.evidence_path, context_path: path.join(outDir, 'context.json'), captured_at: capturedAt, screenshot_status: 'PENDING'};
}

export async function captureKeywordScreenshot(tab, outDir) {
  // A separate call permits progress updates between potentially slow browser operations.
  const screenshotPath = path.join(outDir, 'semrush-keywords.jpg');
  await fs.access(path.join(outDir, 'context.json'));
  await fs.writeFile(screenshotPath, await tab.screenshot({fullPage: false}), {flag: 'wx'});
  return {screenshot_path: screenshotPath};
}
