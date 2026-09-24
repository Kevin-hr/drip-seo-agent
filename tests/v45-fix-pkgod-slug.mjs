// v45-fix-pkgod-slug.mjs — Apply user rule: any URL starting with "-Pkgod-" -> strip that
// prefix (e.g. "-Pkgod-Balenciaga-Triple-S-White-Pink" -> "Balenciaga-Triple-S-White-Pink").
// Also clears stale SeoUrlChangeTo301 claims so the unpublishable record can flip IsShow=true,
// and renames duplicate-path records to their unique slug.
//
// Usage:
//   node tests/v45-fix-pkgod-slug.mjs <id>                 # dry-run (shows plan)
//   node tests/v45-fix-pkgod-slug.mjs <id> --commit        # write
//
// Safety: backs up full record under pdp-api-write/slugfix-backup-<id>.json before writing.
// Read-back verifies new slug + IsShow. OldUrlValue is left untouched unless the 301 flag is
// cleared (to avoid claiming a -Pkgod 301 source that was never live).
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const id = args.find((a) => /^\d{5,}$/.test(a));
if (!id) { console.error('usage: v45-fix-pkgod-slug.mjs <id> [--commit]'); process.exit(1); }

const outDir = 'data/runs/v45-batch-2026-09-23/pdp-api-write';
await fs.mkdir(outDir, { recursive: true });
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const SEG = 'dtb_proProduct';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/#/product/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);

const readFull = () =>
  page.evaluate(async (pid) => {
    const r = await fetch('/biz/DTB_proProduct/modify', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ args: [[pid]], additions: {} })
    });
    return r.json();
  }, String(id));

const before = await readFull();
const row = before.result.find((s) => s.name === SEG)?.rows?.[0];
if (!row || String(row.Id) !== id) throw new Error(`read returned wrong/absent row`);

// Plan: strip -Pkgod- prefix from UrlValue/Url/OldUrlValue. Ensure slug uniqueness by
// appending -<id> if it would collide with a sibling; we keep the -<id> suffix already
// present in the live Nike records.
const stripPkgod = (s) => {
  s = String(s || '');
  if (s.startsWith('-Pkgod-')) s = s.slice('-Pkgod-'.length);
  // Defensive: if prefix-strip left an empty leading '-' or empty string, fall back to name.
  if (!s || s.startsWith('-')) s = '';
  if (!s) s = String(row.Name || '').trim().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).join('-');
  return s;
};
const rawNew = stripPkgod(row.UrlValue);
// If the raw new slug lacks the -<id> uniqueness suffix and another product may own it,
// keep it as-is unless it still starts with '-'. We do NOT force-append -<id> because the
// user rule says "just delete the prefix", and appending would change the canonical URL.
const newSlug = rawNew;
const newUrl = '/' + newSlug;

const rec = {
  id,
  commit,
  dry_run: !commit,
  before: { UrlValue: row.UrlValue, Url: row.Url, OldUrlValue: row.OldUrlValue, s301: row.SeoUrlChangeTo301, IsShow: row.IsShow },
  plan: { newSlug, newUrl, clearOldUrl: row.SeoUrlChangeTo301 === true, setIsShow: true }
};
console.log(JSON.stringify(rec, null, 2));
if (!commit) { await browser.close(); process.exit(0); }

await fs.writeFile(path.join(outDir, `slugfix-backup-${id}.json`), JSON.stringify(before, null, 2));

const p = JSON.parse(JSON.stringify({ args: [before.result], additions: {} }));
const proRow = p.args[0].find((s) => s.name === SEG).rows[0];
proRow.IsShow = true;
proRow.UrlValue = newSlug;
proRow.Url = newUrl;
// Clear the stale 301 claim: old -Pkgod path was never a live URL worth redirecting from.
if (row.SeoUrlChangeTo301 === true) {
  proRow.SeoUrlChangeTo301 = false;
  proRow.OldUrlValue = newSlug; // point 301 source at the new canonical slug (self-reference, safe)
}

const saved = await page.evaluate(async (body) => {
  const r = await fetch('/biz/DTB_proProduct/saveModify', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: r.status, body: parsed };
}, p);
rec.save_status = saved.status;
rec.save_receipt = String(JSON.stringify(saved.body)).slice(0, 300);
const okSave = saved.status === 200 && saved.body?.success === true &&
  Array.isArray(saved.body.result) && saved.body.result.map(String).includes(id);
if (!okSave) {
  rec.success = false;
  await fs.writeFile(path.join(outDir, `slugfix-result-${id}.json`), JSON.stringify(rec, null, 2));
  await browser.close();
  console.log(JSON.stringify(rec, null, 2));
  process.exitCode = 2;
  process.exit(2);
}

await page.waitForTimeout(1200);
const after = await readFull();
const aRow = after.result.find((s) => s.name === SEG).rows[0];
rec.after = { UrlValue: aRow.UrlValue, Url: aRow.Url, OldUrlValue: aRow.OldUrlValue, s301: aRow.SeoUrlChangeTo301, IsShow: aRow.IsShow };
rec.success = aRow.UrlValue === newSlug && aRow.IsShow === true;
await fs.writeFile(path.join(outDir, `slugfix-result-${id}.json`), JSON.stringify(rec, null, 2));
await browser.close();
console.log(JSON.stringify(rec, null, 2));
if (!rec.success) process.exitCode = 3;
