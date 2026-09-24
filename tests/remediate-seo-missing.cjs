#!/usr/bin/env node
/**
 * =====================================================================
 * HKRR FRAMEWORK — Drip Sneakers SEO 补齐（Windows 本地 / 全站 0/3）
 * =====================================================================
 * H (Hypothesis) 假设与边界
 *   - 扫描产物中 SEO 三缺(0/3)产品可安全直写 SeoTitle/SeoKeyword/SeoDesc，
 *     不改 URL/IsShow/PDP Content；saveModify 已验证保留全字段。
 *   - 边界（用户硬约束，命中即 HOLD，不进批）：
 *       a) 排除类目：Lanvin / Mihara Yasuhiro / Ksubi Jeans（名称视为正确）
 *       b) "Send pictures to tell customer service..." 占位符 → HOLD
 *       c) Polo Ralph Lauren blocklist → 跳过
 *       d) 已 3/3 或 2/3、1/3 的产品 → 跳过（只处理 0/3）
 * K (Kernel)     核心执行核（每款独立闭环）
 *   read row → buildSeo(保守口径) → saveModify 直写 → 回读验证三字段
 * R (Resilience) 墨菲式抗性
 *   - 断点续跑：--resume 跳过已 ok id；进度每 20 款落盘
 *   - 幂等：已 ok 不重复写；saveModify 失败重试 1 次
 *   - 会话失效：响应含"未登录"即终止（防全批白跑）
 * R (Review)     复核门禁
 *   - 保存后独立回读三字段，任一空 → verify-fail
 *   - 结果统计 ok / verify-fail / save-fail / hold 写入结果文件
 * Usage: node tests/remediate-seo-missing.cjs [--resume]
 * =====================================================================
 */
const { chromium } = require('playwright-core');
const fs = require('fs');

const STORAGE = 'mrshopplus-storage-state.json';
const SCAN = 'data/runs/v45-batch-2026-09-25/minimal-run/all-products-scan.json';
const OUT = 'data/runs/v45-batch-2026-09-25/minimal-run/seo-missing-results.json';
const resume = process.argv.includes('--resume');

// ---------- H: exclusions ----------
const EXCLUDE_URL_TOKENS = [/Lanvin/i, /MIHARA-YASUHIRO/i, /Ksubi/i, /Mihara/i];
const SEND_PICS_RE = /send\s*pictures/i;
const POLO_RE = /^Polo\b/i;

function decodeHtml(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/\u200b/g, '').trim();
}

function buildSeo(name) {
  const clean = decodeHtml(name).replace(/\s+/g, ' ').trim();
  const title = `${clean} | Drip Sneakers`;
  const parts = clean.split(/\s+/);
  const head = parts.slice(0, 3).join(' ');
  const keywords = `${clean}, ${head}, ${parts[0] || ''} ${parts[1] || ''}, Drip Sneakers reps, ${clean} reps`;
  const desc = `${clean} - premium quality replica sneakers & apparel. QC photos available before shipping, 30-day returns. Buy at Drip Sneakers.`;
  return { seoTitle: title, seoKeyword: keywords, seoDesc: desc };
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

  const isExcluded = (p) => {
    const name = decodeHtml(p.name || '');
    const url = p.urlValue || '';
    if (EXCLUDE_URL_TOKENS.some(re => re.test(url))) return 'excluded-category';
    if (SEND_PICS_RE.test(name)) return 'send-pictures-HOLD';
    if (POLO_RE.test(name)) return 'polo-blocklist';
    return null;
  };

  const targets = cleanScan.filter(p => {
    const has = (p.seoTitle || '').trim() && (p.seoKeyword || '').trim() && (p.seoDesc || '').trim();
    if (has) return false;
    if ((p.seoTitle || '').trim() || (p.seoKeyword || '').trim() || (p.seoDesc || '').trim()) return false;
    return true;
  });

  const holds = targets.map(p => ({ id: p.id, name: p.name, reason: isExcluded(p) })).filter(h => h.reason);
  const work = targets.filter(p => !isExcluded(p));
  console.log(`scan=${cleanScan.length} seo0/3=${targets.length} HOLD=${holds.length} WORK=${work.length}`);
  for (const h of holds) console.log(`  HOLD ${h.reason}: ${h.id} ${(h.name || '').slice(0, 50)}`);

  // ---------- R: resilience — resume ----------
  let results = [];
  if (resume && fs.existsSync(OUT)) {
    results = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    console.log(`resume: ${results.length} existing`);
  }
  const doneIds = new Set(results.filter(r => r.status === 'ok').map(r => r.id));
  const todo = work.filter(p => !doneIds.has(p.id));
  console.log(`todo=${todo.length} (skip ${doneIds.size} ok)`);

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

  // ---------- K: kernel ----------
  let ok = 0, fail = 0;
  for (let i = 0; i < todo.length; i++) {
    const p = todo[i];
    const id = p.id;
    const name = decodeHtml(p.name || '').replace(/\s+/g, ' ').trim();
    const rec = { id, name, status: 'pending' };
    try {
      const read = await api('/biz/DTB_proProduct/modify', { args: [[id]], additions: {} });
      if (read.success !== true) { rec.status = 'no-read'; rec.error = JSON.stringify(read).slice(0, 120); fail++; continue; }
      const row = read.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
      if (!row) { rec.status = 'no-row'; fail++; continue; }

      const seo = buildSeo(name);
      const rowClone = { ...row, SeoTitle: seo.seoTitle, SeoKeyword: seo.seoKeyword, SeoDesc: seo.seoDesc };

      let resp = await api('/biz/DTB_proProduct/saveModify', { args: [[{ name: 'dtb_proProduct', defaults, rows: [rowClone] }]] });
      if (resp.success !== true) {
        await page.waitForTimeout(800);
        resp = await api('/biz/DTB_proProduct/saveModify', { args: [[{ name: 'dtb_proProduct', defaults, rows: [rowClone] }]] });
      }
      if (resp.success !== true) {
        const msg = JSON.stringify(resp);
        if (msg.includes('未登录')) throw new Error('SESSION_EXPIRED');
        rec.status = 'save-fail'; rec.error = msg.slice(0, 200); fail++;
        continue;
      }

      // R: independent re-read gate
      await page.waitForTimeout(500);
      const verify = await api('/biz/DTB_proProduct/modify', { args: [[id]], additions: {} });
      const vrow = verify.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
      const ok3 = vrow && (vrow.SeoTitle || '').trim() && (vrow.SeoKeyword || '').trim() && (vrow.SeoDesc || '').trim();
      if (!ok3) { rec.status = 'verify-fail'; rec.actual = { t: vrow?.SeoTitle, k: vrow?.SeoKeyword, d: vrow?.SeoDesc }; fail++; continue; }

      rec.status = 'ok';
      rec.seoTitle = (vrow.SeoTitle || '').slice(0, 80);
      rec.seoKeyword = (vrow.SeoKeyword || '').slice(0, 60);
      rec.seoDesc = (vrow.SeoDesc || '').slice(0, 60);
      ok++;
    } catch (e) {
      if (e.message === 'SESSION_EXPIRED') { console.log('\nSESSION EXPIRED, aborting'); break; }
      rec.status = 'error'; rec.error = String(e?.message || e).slice(0, 200); fail++;
    }
    results.push(rec);
    if ((i + 1) % 20 === 0 || i === todo.length - 1) {
      process.stdout.write(`\r${i + 1}/${todo.length} ok=${ok} fail=${fail}`);
      fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    }
  }
  await browser.close();
  const summary = {
    framework: 'HKRR', scan: cleanScan.length, seo0_3: targets.length,
    hold: holds.length, work: work.length, ok, fail,
    excludes: [...new Set(holds.map(h => h.reason))],
    generated: new Date().toISOString(),
  };
  fs.writeFileSync(OUT, JSON.stringify({ summary, results }, null, 2));
  console.log(`\nDone. ok=${ok} fail=${fail}`);
  console.log('summary:', JSON.stringify(summary));
})().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
