// v45-pdp-api-write.mjs — Direct-API PDP field writer for MrShopPlus (DTB_proProduct).
//
// Purpose: bypass the flaky UI save path (which triggers code=-3 slug conflicts when the
// tinyMCE editor / SEO URL is touched) by writing fields straight through the backend API.
// We READ the full multi-segment record, mutate ONLY the targeted fields (and keep
// UrlValue / SeoTitle / SeoDesc / SeoUrlChangeTo301 exactly as-is), then POST saveModify.
//
// Modes:
//   node tests/v45-pdp-api-write.mjs <id> --field summary --value-file <f.html> [--commit] [--dry]
//   node tests/v45-pdp-api-write.mjs <id> --publish                      [--commit]
//   node tests/v45-pdp-api-write.mjs --ids ids.json --publish            [--commit]   (bulk)
//
// Safety: DRY-RUN by default. --commit actually writes. Backs up the original row first.
// Verifies via read-back that the target field persisted and that invariant keys did not drift.
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const dry = args.includes('--dry') || !commit;
const fieldArg = args.find((a) => a.startsWith('--field='))?.split('=')[1];
const valueFile = args.find((a) => a.startsWith('--value-file='))?.split('=')[1];
const idsFile = args.find((a) => a.startsWith('--ids='))?.split('=')[1];
const singleId = args.find((a) => /^\d{5,}$/.test(a));
const publishOnly = args.includes('--publish') || !fieldArg;

const field = fieldArg || 'summary'; // summary (key-desc PDP details) or content (main desc)
const value = valueFile ? (await fs.readFile(valueFile, 'utf8')) : null;

const outDir = 'data/runs/v45-batch-2026-09-23/pdp-api-write';
await fs.mkdir(outDir, { recursive: true });
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const ids = idsFile
  ? (await fs.readFile(idsFile, 'utf8'))
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
  : singleId
    ? [singleId]
    : [];
if (ids.length === 0) throw new Error('No product id supplied. Pass <id>, --ids file, or --field/--value-file.');

const SEG = 'dtb_proProduct';
const rowOf = (json) => json.result.find((s) => s.name === SEG)?.rows?.[0];
const segNames = (json) => (json.result || []).map((s) => s.name);
// Invariants that must NOT drift. We deliberately EXCLUDE MultipleSku / SingleAttr /
// DefaultSku because the backend type-normalizes boolean<->int flags on save (e.g.
// true->1), which is a benign round-trip, not a real change. All slug/SEO/price/identity
// keys stay protected.
const INVAriANTS = [
  'Id', 'Name', 'BasePrice', 'MarketPrice', 'TradePrice', 'FirstImg', 'ImgList', 'Attrs',
  'DeliveryTemp', 'TplId', 'EnabledCoupon',
  'Weight', 'MeasureUnit', 'SeoTitle', 'SeoKeyword', 'SeoDesc', 'UrlValue', 'Url', 'SeoUrlChangeTo301', 'OldUrlValue'
];
const stable = (v) => JSON.stringify(v);
const FKEY = { summary: 'Summary', content: 'Content' };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/#/product/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);

const readFull = (id) =>
  page.evaluate(async (pid) => {
    const r = await fetch('/biz/DTB_proProduct/modify', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ args: [[pid]], additions: {} })
    });
    const j = await r.json();
    return j;
  }, String(id));

const savePayload = (id, fullJson) =>
  page.evaluate(async ({ id, fullJson }) => {
    const r = await fetch('/biz/DTB_proProduct/saveModify', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify(fullJson)
    });
    const text = await r.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: r.status, body, id };
  }, { id: String(id), fullJson });

const results = [];
for (const rawId of ids) {
  const id = String(rawId);
  const rec = { id, started_at: new Date().toISOString(), success: false };
  results.push(rec);
  try {
    const before = await readFull(id);
    const row = rowOf(before);
    if (!row || String(row.Id) !== id) throw new Error(`read returned wrong/absent row (seg: ${segNames(before).join(',')})`);
    rec.before_IsShow = row.IsShow;
    rec.before_target_len = String(row[FKEY[field]] || '').length;

    // Build the exact save payload: clone the full multi-segment record, mutate one field.
    const payload = JSON.parse(JSON.stringify(before.result ? { args: [before.result], additions: {} } : before));
    const seg = payload.args[0].find((s) => s.name === SEG);
    const proRow = seg.rows[0];
    if (publishOnly) proRow.IsShow = true;
    if (value !== null) proRow[FKEY[field]] = value;
    // Do NOT touch UrlValue / SeoUrlChangeTo301 / OldUrlValue -> avoids code=-3 301 slug conflict.

    if (dry) {
      rec.dry_run = true;
      rec.planned = {
        fields_changed: publishOnly ? ['IsShow=true'] : [`${FKEY[field]}=${value?.length ?? 0} chars`],
        urlValue_unchanged: seg.rows[0].UrlValue === row.UrlValue,
      };
      rec.success = true;
      continue;
    }

    // Backup original record before writing.
    await fs.writeFile(path.join(outDir, `backup-${id}.json`), JSON.stringify(before, null, 2));
    rec.backup = `backup-${id}.json`;

    const saved = await savePayload(id, payload);
    rec.save_status = saved.status;
    rec.save_receipt = saved.body;
    const successReceipt = saved.status === 200 && saved.body?.success === true &&
      Array.isArray(saved.body.result) && saved.body.result.map(String).includes(id);
    if (!successReceipt) throw new Error(`save rejected: ${JSON.stringify(saved.body).slice(0, 300)}`);

    // Read-back verification.
    await page.waitForTimeout(1200);
    const after = await readFull(id);
    const aRow = rowOf(after);
    rec.after_IsShow = aRow.IsShow;
    rec.after_target_len = String(aRow[FKEY[field]] || '').length;
    if (publishOnly && aRow.IsShow !== true) throw new Error('IsShow not true after save');
    if (value !== null && String(aRow[FKEY[field]] || '').length === 0) throw new Error('target field empty after save');

    // Invariant drift check (name/prices/sku/seo/url must be unchanged).
    const drift = INVAriANTS.filter((k) => stable(before.result.find((s) => s.name === SEG).rows[0][k]) !== stable(aRow[k]));
    // Exclude the fields we intentionally changed.
    const changed = new Set([...(publishOnly ? ['IsShow'] : []), ...(value !== null ? [FKEY[field]] : [])]);
    const unexpectedDrift = drift.filter((k) => !changed.has(k));
    rec.drift = unexpectedDrift;
    if (unexpectedDrift.length) throw new Error(`unexpected invariant drift: ${unexpectedDrift.join(', ')}`);

    rec.success = true;
  } catch (e) {
    rec.error = String(e?.message || e).slice(0, 300);
  } finally {
    await fs.writeFile(path.join(outDir, `results-${new Date().toISOString().replace(/[:.]/g, '')}.json`), JSON.stringify(results, null, 2));
  }
}

await context.close().catch(() => {});
await browser.close().catch(() => {});
const ok = results.filter((r) => r.success).length;
console.log(JSON.stringify({
  commit, total: results.length, ok,
  per_id: results.map((r) => ({ id: r.id, ok: r.success, isShow: r.after_IsShow, targetLen: r.after_target_len, drift: r.drift, err: r.error || null }))
}, null, 2));
if (results.some((r) => !r.success)) process.exitCode = 2;
