#!/usr/bin/env node
/**
 * =====================================================================
 * HKRR FRAMEWORK — Drip Sneakers Pkgod URL 修复（并发版，Windows）
 * =====================================================================
 * H (Hypothesis) 假设与边界
 *   - 全站扫描中 urlValue 含 -Pkgod- 的 235 款需重写规范 slug
 *   - 不改 Content/PDP；IsShow 保持；SeoUrlChangeTo301=true 请求 301
 *   - 边界：不碰 HOLD 类目（此批仅 URL 修复，SEO 走另一批）
 * K (Kernel)     核心执行核
 *   read row → slugify(去 Pkgod/噪音前缀) → 全局 used 查重(冲突加 id 尾6)
 *   → saveModify(UrlValue+Url+SeoUrlChangeTo301) → 回读验证 UrlValue
 * R (Resilience) 墨菲式抗性
 *   - code=-3 路径冲突：自动加 id 后缀重试一次（已验证方案）
 *   - 15 并发 + 失败重试 2 次；断点续跑 --resume；会话失效终止
 * R (Review)     复核门禁
 *   - 回读 UrlValue 必须等于目标 slug；旧值无 Pkgod
 *   - 输出 ok / save-fail / verify-fail / error 统计
 * Usage: node tests/remediate-pkgod-concurrent.cjs [--resume]
 * =====================================================================
 */
const { chromium } = require('playwright-core');
const fs = require('fs');

const STORAGE = 'mrshopplus-storage-state.json';
const SCAN = 'data/runs/v45-batch-2026-09-25/minimal-run/all-products-scan.json';
const OUT = 'data/runs/v45-batch-2026-09-25/minimal-run/pkgod-remediation-results.json';
const CONCURRENCY = 15;
const resume = process.argv.includes('--resume');

function decodeHtml(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/\u200b/g, '').trim();
}

function slugifyName(name) {
  let s = decodeHtml(name);
  s = s.replace(/^\[[^\]]*\]\s*/, '');
  s = s.replace(/^Top-Quality-?\s*/i, '');
  s = s.replace(/^OWF\s*/i, '');
  s = s.replace(/^Special\s*Sale\s*&\s*/i, '');
  s = s.replace(/^Batch\s+Sneaker\s*&\s*/i, '');
  s = s.replace(/[^A-Za-z0-9&']+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  s = s.replace(/&/g, 'and').replace(/'/g, '');
  return s;
}

const defaults = {
  IsShow: true, BasePrice: 0, IsDelete: false, SaleCount: 0, ReviewCount: 0, MarketPrice: 0,
  Sort: 9999, TradePrice: 0, NeedTax: false, MeasureUnit: '件/个', IsDisableStock: false,
  ReviewRate: 0, Rate5Count: 0, Rate4Count: 0, Rate3Count: 0, Rate2Count: 0, Rate1Count: 0,
  ImageReviewCount: 0, MultipleSku: false, SingleAttr: false, VedioPosition: 1, EnabledCoupon: true,
  MeasureType: 0, PackageItems: 1, MinItems: 1, MeasureDiscountType: 0, State: 0, ViewCount: 0,
  ViewCountAttr: 0, ViewCountAccValue: 0, UrlSuffix: '.html'
};

(async () => {
  const scan = JSON.parse(fs.readFileSync(SCAN, 'utf8'));
  const cleanScan = scan.filter(x => x.status === 'ok' && x.id);
  const targets = cleanScan.filter(p => /pkgod/i.test(p.urlValue));
  console.log('pkgod targets:', targets.length);

  // global used slugs (excluding target own old values)
  const used = new Set(cleanScan.map(p => (p.urlValue || '').trim()).filter(Boolean).filter(v => !/pkgod/i.test(v)));

  let results = [];
  if (resume && fs.existsSync(OUT)) {
    const saved = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    results = saved.results || saved;
    console.log(`resume: ${results.length}`);
  }
  const doneIds = new Set(results.filter(r => r.status === 'ok').map(r => r.id));
  const todo = targets.filter(p => !doneIds.has(p.id));
  console.log(`todo=${todo.length}`);

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

  const fixOne = async (p) => {
    const rec = { id: p.id, name: p.name, oldUrlValue: p.urlValue, status: 'pending' };
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const read = await api('/biz/DTB_proProduct/modify', { args: [[p.id]], additions: {} });
        if (read.success !== true) { rec.status = 'no-read'; rec.error = JSON.stringify(read).slice(0, 120); return rec; }
        const row = read.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
        if (!row) { rec.status = 'no-row'; return rec; }

        const name = decodeHtml(p.name || row.Name || '').replace(/\s+/g, ' ').trim();
        // if already clean (concurrent edit or previous run), skip
        if (!/pkgod/i.test(row.UrlValue || '')) { rec.status = 'skip-clean'; return rec; }
        let slug = slugifyName(name) || `product-${p.id}`;
        let candidate = slug;
        while (used.has(candidate)) candidate = `${slug}-${p.id.slice(-6)}`;
        used.add(candidate);

        // IMPORTANT: pass SeoUrlChangeTo301=false when changing UrlValue.
        // Backend forces it to true and manages OldUrlValue itself;
        // passing true with a Pkgod old value triggers code=-3 System error.
        const rowClone = {
          ...row,
          UrlValue: candidate,
          Url: `/${candidate}${row.UrlSuffix || '.html'}`,
          SeoUrlChangeTo301: false,
          IsShow: true,
        };

        let resp = await api('/biz/DTB_proProduct/saveModify', { args: [[{ name: 'dtb_proProduct', defaults, rows: [rowClone] }]] });
        if (resp.success !== true && JSON.stringify(resp).includes('code":-3')) {
          // Seo path collision → id suffix retry
          const suffixed = `${candidate}-${p.id.slice(-6)}`;
          used.add(suffixed);
          rowClone.UrlValue = suffixed;
          rowClone.Url = `/${suffixed}${row.UrlSuffix || '.html'}`;
          await page.waitForTimeout(500);
          resp = await api('/biz/DTB_proProduct/saveModify', { args: [[{ name: 'dtb_proProduct', defaults, rows: [rowClone] }]] });
          if (resp.success === true) candidate = suffixed;
        }
        if (resp.success !== true) {
          if (JSON.stringify(resp).includes('未登录')) throw new Error('SESSION_EXPIRED');
          rec.status = 'save-fail'; rec.error = JSON.stringify(resp).slice(0, 200); return rec;
        }

        await page.waitForTimeout(400);
        const verify = await api('/biz/DTB_proProduct/modify', { args: [[p.id]], additions: {} });
        const vrow = verify.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
        if (!vrow || vrow.IsShow !== true) { rec.status = 'verify-fail'; rec.actual = vrow?.UrlValue; return rec; }
        if (vrow.UrlValue !== candidate || /pkgod/i.test(vrow.UrlValue || '')) { rec.status = 'verify-fail'; rec.actualUrlValue = vrow.UrlValue; return rec; }

        rec.status = 'ok';
        rec.newUrlValue = vrow.UrlValue;
        rec.newUrl = vrow.Url;
        rec.isShow = vrow.IsShow;
        return rec;
      } catch (e) {
        if (e.message === 'SESSION_EXPIRED') throw e;
        if (attempt === 2) { rec.status = 'error'; rec.error = String(e?.message || e).slice(0, 200); return rec; }
      }
    }
    return rec;
  };

  let ok = 0, fail = 0, done = 0;
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    let recs;
    try {
      recs = await Promise.all(batch.map(fixOne));
    } catch (e) {
      if (e.message === 'SESSION_EXPIRED') { console.log('\nSESSION EXPIRED, aborting'); break; }
      throw e;
    }
    for (const rec of recs) { results.push(rec); if (rec.status === 'ok') ok++; else fail++; }
    done += batch.length;
    if (done % 150 < CONCURRENCY || done >= todo.length) {
      process.stdout.write(`\r${done}/${todo.length} ok=${ok} fail=${fail}`);
      fs.writeFileSync(OUT, JSON.stringify({ summary: { ok, fail, done }, results }, null, 2));
    }
  }

  await browser.close();
  const summary = {
    framework: 'HKRR', targets: targets.length, ok, fail,
    generated: new Date().toISOString(),
  };
  fs.writeFileSync(OUT, JSON.stringify({ summary, results }, null, 2));
  console.log(`\nDone. ok=${ok} fail=${fail}`);
  console.log('summary:', JSON.stringify(summary));
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
