#!/usr/bin/env node
/**
 * HKRR — 全量扫描并发版（15 并发，断点续跑）
 * K: index 已存在 → 并发 modify 读全行 → scan 文件
 * R: 每批落盘、失败重试 2 次、会话失效终止
 * R: 数量门禁 vs index total
 */
const { chromium } = require('playwright-core');
const fs = require('fs');

const STORAGE = 'mrshopplus-storage-state.json';
const BASE = 'data/runs/v45-batch-2026-09-25/minimal-run';
const INDEX_FILE = `${BASE}/products-index.json`;
const SCAN_FILE = `${BASE}/all-products-scan.json`;
const CONCURRENCY = 15;

const needFields = (row) => ({
  id: String(row.Id),
  name: (row.Name || '').trim(),
  isShow: row.IsShow,
  urlValue: row.UrlValue || '',
  url: row.Url || '',
  oldUrlValue: row.OldUrlValue || '',
  seoTitle: (row.SeoTitle || '').trim(),
  seoKeyword: (row.SeoKeyword || '').trim(),
  seoDesc: (row.SeoDesc || '').trim(),
  seoUrlChangeTo301: row.SeoUrlChangeTo301,
});

(async () => {
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  let scan = [];
  if (fs.existsSync(SCAN_FILE)) {
    scan = JSON.parse(fs.readFileSync(SCAN_FILE, 'utf8'));
    console.log(`existing scan: ${scan.length}`);
  }
  const doneIds = new Set(scan.filter(x => x.status === 'ok').map(x => x.id));
  const todo = index.filter(p => !doneIds.has(p.id));
  console.log(`index=${index.length} done=${doneIds.size} todo=${todo.length}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ storageState: STORAGE });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

  const api = async (route, body) => page.evaluate(async ([r, b]) => {
    const res = await fetch(r, { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    return res.json();
  }, [route, body]);

  const readOne = async (p) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await api('/biz/DTB_proProduct/modify', { args: [[p.id]], additions: {} });
        if (r.success !== true) {
          if (JSON.stringify(r).includes('未登录')) throw new Error('SESSION_EXPIRED');
          return { id: p.id, name: p.name, isShow: p.isShow, url: p.url, status: 'api-fail', error: JSON.stringify(r).slice(0, 120) };
        }
        const row = r.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
        if (!row) return { id: p.id, status: 'no-row' };
        return { ...needFields(row), status: 'ok' };
      } catch (e) {
        if (e.message === 'SESSION_EXPIRED') throw e;
        if (attempt === 2) return { id: p.id, name: p.name, status: 'error', error: String(e?.message || e).slice(0, 120) };
      }
    }
  };

  let fail = 0, done = 0;
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    let recs;
    try {
      recs = await Promise.all(batch.map(readOne));
    } catch (e) {
      if (e.message === 'SESSION_EXPIRED') { console.log('\nSESSION EXPIRED, aborting'); break; }
      throw e;
    }
    for (const rec of recs) { scan.push(rec); if (rec.status !== 'ok') fail++; }
    done += batch.length;
    if (done % 300 < CONCURRENCY || done >= todo.length) {
      fs.writeFileSync(SCAN_FILE, JSON.stringify(scan, null, 2));
      process.stdout.write(`\r${done}/${todo.length} fail=${fail}`);
    }
  }

  // R: gates
  fs.writeFileSync(SCAN_FILE, JSON.stringify(scan, null, 2));
  const okRows = scan.filter(x => x.status === 'ok');
  const summary = {
    framework: 'HKRR',
    indexTotal: index.length,
    scanTotal: scan.length,
    ok: okRows.length,
    fail: scan.length - okRows.length,
    isShowTrue: okRows.filter(x => x.isShow === true).length,
    isShowFalse: okRows.filter(x => x.isShow === false).length,
    pkgodUrl: okRows.filter(x => /pkgod/i.test(x.urlValue)).length,
    seoFull: okRows.filter(x => x.seoTitle && x.seoKeyword && x.seoDesc).length,
    seoZero: okRows.filter(x => !x.seoTitle && !x.seoKeyword && !x.seoDesc).length,
    seoPartial: okRows.filter(x => (x.seoTitle || x.seoKeyword || x.seoDesc) && !(x.seoTitle && x.seoKeyword && x.seoDesc)).length,
    generated: new Date().toISOString(),
  };
  console.log('\nsummary:', JSON.stringify(summary, null, 2));
  fs.writeFileSync(`${BASE}/scan-summary.json`, JSON.stringify(summary, null, 2));
  await browser.close();
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
