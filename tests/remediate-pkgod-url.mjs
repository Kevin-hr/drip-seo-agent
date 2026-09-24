import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const BASE = 'data/runs/v45-batch-2026-09-23/minimal-run';

// ---- helpers
function decodeHtml(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/\u200b/g, '').trim();
}

function slugifyName(name) {
  let s = decodeHtml(name);
  // strip common noise prefixes exactly like the existing clean catalogue does
  s = s.replace(/^\[[^\]]*\]\s*/, '');            // [🔥Black Friday Offer🔥]
  s = s.replace(/^Top-Quality-?\s*/i, '');        // Top-Quality- prefix
  s = s.replace(/^OWF\s*/i, '');                  // OWF batch prefix
  s = s.replace(/^Special\s*Sale\s*&\s*/i, '');   // Special Sale & prefix
  s = s.replace(/^Batch\s+Sneaker\s*&\s*/i, '');
  // collapse spaces, keep letters/digits/hyphens, spaces -> '-'
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

function buildSeo(name) {
  const clean = decodeHtml(name).replace(/\s+/g, ' ').trim();
  const title = `${clean} | Drip Sneakers`;
  // conservative keywords: full name + brand-ish head terms
  const parts = clean.split(/\s+/);
  const head = parts.slice(0, 3).join(' ');
  const keywords = `${clean}, ${head}, ${parts[0] || ''} ${parts[1] || ''}, Drip Sneakers reps, ${clean} reps`;
  const desc = `${clean} - premium quality replica sneakers & apparel. QC photos available before shipping, 30-day returns. Buy at Drip Sneakers.`;
  return { seoTitle: title, seoKeyword: keywords, seoDesc: desc };
}

// ---- main
const [modeArg, outFileArg] = process.argv.slice(2); // mode: p0 | all | dry
const mode = modeArg || 'dry';
const outFile = outFileArg || `${BASE}/url-remediation-results.json`;

const scan = JSON.parse(await fs.readFile(`${BASE}/all-products-scan.json`, 'utf8'));
const cleanScan = scan.filter(x => !x.error);

// all current UrlValues for uniqueness
const used = new Set(cleanScan.map(p => (p.urlValue || '').trim()).filter(Boolean));

// target list
let targets;
if (mode === 'p0') {
  const excel = JSON.parse(await fs.readFile(`${BASE}/pkgod-excel-data.json`, 'utf8'));
  targets = excel.p0.map(r => {
    const s = cleanScan.find(p => p.id === r.id);
    return s || { id: r.id, name: r.name, urlValue: r.urlValue };
  });
} else {
  targets = cleanScan.filter(p => /pkgod/i.test(p.urlValue));
}
console.log(`Mode=${mode} targets=${targets.length}`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

const results = [];
let done = 0;
for (const p of targets) {
  const id = p.id;
  const name = decodeHtml(p.name || '').replace(/\s+/g, ' ').trim();
  const rec = { id, name, oldUrlValue: p.urlValue, status: 'pending' };
  results.push(rec);
  try {
    // 1. read full row
    const read = await page.evaluate(async (pid) => {
      const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args: [[pid]], additions: {} }) });
      return r.json();
    }, id);
    const row = read.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
    if (!row) { rec.status = 'no-row'; continue; }

    // 2. build new slug (only if old URL carries the pkgod token; otherwise keep URL, SEO-only)
    const hasPkgod = /pkgod/i.test((row.UrlValue || p.urlValue || ''));
    let candidate = row.UrlValue;
    if (hasPkgod) {
      let slug = slugifyName(name);
      if (!slug) slug = `product-${id}`;
      candidate = slug;
      // uniqueness against used set (skip own old value)
      while (used.has(candidate) && candidate !== p.urlValue.trim()) {
        candidate = `${slug}-${id.slice(-6)}`;
      }
      used.add(candidate);
    }

    // 3. build SEO (keep existing if already good)
    const seo = buildSeo(name);
    const newTitle = (row.SeoTitle || '').trim() && /reps\s*\|\s*Drip/i.test(row.SeoTitle) && !row.SeoTitle.includes(name.split(' ')[0])
      ? seo.seoTitle : (row.SeoTitle || seo.seoTitle);
    const newKeyword = (row.SeoKeyword || '').trim() || seo.seoKeyword;
    const newDesc = (row.SeoDesc || '').trim() || seo.seoDesc;

    const rowClone = {
      ...row,
      UrlValue: candidate,
      Url: `/${candidate}${row.UrlSuffix || '.html'}`,
      SeoTitle: newTitle,
      SeoKeyword: newKeyword,
      SeoDesc: newDesc,
      SeoUrlChangeTo301: true,   // keep old URL 301 redirect
      IsShow: true,
    };
    // keep OldUrlValue pointing at the old pkgod path so 301 fires
    if (!row.OldUrlValue || /pkgod/i.test(row.OldUrlValue)) {
      rowClone.OldUrlValue = row.UrlValue || p.urlValue;
    }

    // 4. save (retry once with id-suffix if Seo-path collision code=-3)
    const saveBody = { args: [[{ name: 'dtb_proProduct', defaults, rows: [rowClone] }]] };
    let resp = await page.evaluate(async (b) => {
      const r = await fetch('/biz/DTB_proProduct/saveModify', { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b) });
      return r.json();
    }, saveBody);

    if (resp.success !== true && JSON.stringify(resp).includes('code":-3') && hasPkgod) {
      // Seo path collision against legacy/hidden records -> append id suffix, retry once
      const suffixed = `${candidate}-${id.slice(-6)}`;
      used.add(suffixed);
      rowClone.UrlValue = suffixed;
      rowClone.Url = `/${suffixed}${row.UrlSuffix || '.html'}`;
      resp = await page.evaluate(async (b) => {
        const r = await fetch('/biz/DTB_proProduct/saveModify', { method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(b) });
        return r.json();
      }, saveBody);
      if (resp.success === true) candidate = suffixed;
    }

    if (resp.success !== true) {
      rec.status = 'save-fail';
      rec.error = JSON.stringify(resp).slice(0, 200);
      continue;
    }

    // 5. verify
    await page.waitForTimeout(600);
    const verify = await page.evaluate(async (pid) => {
      const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args: [[pid]], additions: {} }) });
      return r.json();
    }, id);
    const vrow = verify.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
    if (!vrow || vrow.IsShow !== true) {
      rec.status = 'verify-fail';
      rec.actualUrlValue = vrow?.UrlValue;
      rec.isShow = vrow?.IsShow;
      continue;
    }
    if (hasPkgod && vrow.UrlValue !== candidate) {
      rec.status = 'verify-fail';
      rec.actualUrlValue = vrow?.UrlValue;
      continue;
    }
    if (!(vrow.SeoKeyword || '').trim()) {
      rec.status = 'verify-seo-fail';
      rec.actualUrlValue = vrow?.UrlValue;
      continue;
    }
    rec.status = 'ok';
    rec.urlChanged = hasPkgod;
    rec.newUrlValue = vrow.UrlValue;
    rec.newUrl = vrow.Url;
    rec.seoTitle = vrow.SeoTitle;
    rec.seoKeyword = (vrow.SeoKeyword || '').slice(0, 60);
  } catch (e) {
    rec.status = 'error';
    rec.error = String(e?.message || e).slice(0, 200);
  }
  done++;
  if (done % 20 === 0 || done === targets.length) {
    process.stdout.write(`\r${done}/${targets.length} | ok=${results.filter(r=>r.status==='ok').length} fail=${results.filter(r=>r.status!=='ok').length}`);
    await fs.writeFile(outFile, JSON.stringify(results, null, 2));
  }
}
await browser.close();
console.log(`\nDone. ok=${results.filter(r=>r.status==='ok').length} fail=${results.filter(r=>r.status!=='ok').length}`);
await fs.writeFile(outFile, JSON.stringify(results, null, 2));
