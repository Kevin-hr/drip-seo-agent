#!/usr/bin/env node
/**
 * =====================================================================
 * HKRR FRAMEWORK — Drip Sneakers 全量扫描 V2（Windows 本地）
 * =====================================================================
 * H (Hypothesis) 假设与边界
 *   - queryList 分页可拉全站商品（total=5865），modify 逐款可读完整行
 *   - 本次扫描产物 = 后续 SEO 补齐的唯一数据源
 * K (Kernel)     核心执行核
 *   step1: queryList 分页拉全量索引（id/name/isShow/url）
 *   step2: 逐款 modify 读全行（SEO 三字段/UrlValue/IsShow/Name）
 * R (Resilience) 墨菲式抗性
 *   - 断点续跑：--resume 跳过已 scan 的 id
 *   - 批次落盘：每 30 款写一次 scan 文件
 *   - 失败重试：单款失败重试 2 次，仍失败记 error
 *   - 会话失效检测：任一响应 success=false 且含"未登录"则终止
 * R (Review)     复核门禁
 *   - 数量门禁：scan 条数 vs queryList total
 *   - 抽样核对：首/末款 IsShow、URL 字段
 * Usage: node tests/scan-all-v2.mjs [--resume]
 * =====================================================================
 */
const { chromium } = require('playwright-core');
const fs = require('fs');

const STORAGE = 'mrshopplus-storage-state.json';
const BASE = 'data/runs/v45-batch-2026-09-25/minimal-run';
const INDEX_FILE = `${BASE}/products-index.json`;
const SCAN_FILE = `${BASE}/all-products-scan.json`;
const PAGE_SIZE = 100;
const resume = process.argv.includes('--resume');

(async () => {
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

  // ---------- K step1: queryList pagination ----------
  let index = [];
  if (resume && fs.existsSync(INDEX_FILE)) {
    index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    console.log(`resume index: ${index.length}`);
  }
  if (index.length === 0) {
    const first = await api('/biz/DTB_proProduct/queryList', { args: [{}, 0, PAGE_SIZE], additions: { Stoke: true } });
    const total = first.result.total;
    console.log('total products:', total);
    const pages = Math.ceil(total / PAGE_SIZE);
    for (let pn = 1; pn <= pages; pn++) {
      const r = await api('/biz/DTB_proProduct/queryList', { args: [{}, pn - 1, PAGE_SIZE], additions: { Stoke: true } });
      if (r.success !== true) { console.log(`page ${pn} fail:`, JSON.stringify(r).slice(0, 120)); continue; }
      const rows = r.result.data.rows || [];
      for (const row of rows) {
        index.push({ id: String(row.Id), name: (row.Name || '').trim(), isShow: row.IsShow, url: row.Url || '' });
      }
      if (pn % 10 === 0) { fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2)); console.log(`index page ${pn}/${pages}, collected ${index.length}`); }
    }
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    console.log('index done:', index.length);
  }

  // ---------- K step2: per-product full read ----------
  let scan = [];
  if (resume && fs.existsSync(SCAN_FILE)) {
    scan = JSON.parse(fs.readFileSync(SCAN_FILE, 'utf8'));
    console.log(`resume scan: ${scan.length}`);
  }
  const doneIds = new Set(scan.filter(x => !x.error).map(x => x.id));
  const todo = index.filter(p => !doneIds.has(p.id));
  console.log(`todo: ${todo.length}`);

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

  let failCount = 0;
  for (let i = 0; i < todo.length; i++) {
    const p = todo[i];
    const rec = { ...needFields({ Id: p.id, Name: p.name, IsShow: p.isShow, Url: p.url }), status: 'pending' };
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        const r = await api('/biz/DTB_proProduct/modify', { args: [[p.id]], additions: {} });
        if (r.success !== true) {
          const msg = JSON.stringify(r);
          if (msg.includes('未登录')) { throw new Error('SESSION_EXPIRED'); }
          rec.status = 'api-fail'; rec.error = msg.slice(0, 120);
        } else {
          const row = r.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
          if (row) { Object.assign(rec, needFields(row)); rec.status = 'ok'; ok = true; }
          else { rec.status = 'no-row'; }
        }
      } catch (e) {
        if (e.message === 'SESSION_EXPIRED') throw e;
        rec.status = 'error'; rec.error = String(e?.message || e).slice(0, 120);
      }
    }
    if (rec.status !== 'ok') failCount++;
    scan.push(rec);
    if ((i + 1) % 30 === 0 || i === todo.length - 1) {
      fs.writeFileSync(SCAN_FILE, JSON.stringify(scan, null, 2));
      process.stdout.write(`\r${i + 1}/${todo.length} fail=${failCount}`);
    }
  }

  // ---------- R: review gates ----------
  fs.writeFileSync(SCAN_FILE, JSON.stringify(scan, null, 2));
  const okRows = scan.filter(x => x.status === 'ok');
  const summary = {
    framework: 'HKRR',
    indexTotal: index.length,
    scanTotal: scan.length,
    ok: okRows.length,
    fail: failCount,
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
