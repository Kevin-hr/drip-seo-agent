// v45-verify-final.mjs — Read current IsShow for a list of IDs in one browser session.
// Usage: node tests/v45-verify-final.mjs <ids.json>  (JSON array of id strings)
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const idsFile = process.argv[2];
const ids = JSON.parse(await fs.readFile(idsFile, 'utf8'));
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/#/product/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);

const stateOf = (pid) =>
  page.evaluate(async (id) => {
    const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ args: [[id]], additions: {} }) });
    const j = await r.json();
    const row = j.result.find((s) => s.name === 'dtb_proProduct')?.rows?.[0];
    return { id, IsShow: row?.IsShow, name: (row?.Name || '').trim().slice(0, 40), slug: row?.UrlValue };
  }, String(pid));

const out = [];
for (const id of ids) { try { out.push(await stateOf(id)); } catch (e) { out.push({ id, error: String(e).slice(0, 120) }); } }
await browser.close();

const live = out.filter((x) => x.IsShow === true);
const dead = out.filter((x) => x.IsShow !== true);
console.log(JSON.stringify({ total: out.length, live: live.length, stillUnpublished: dead.length, live_ids: live.map((x) => x.id), stillUnpublished: dead.map((x) => ({ id: x.id, name: x.name, slug: x.slug, err: x.error || null })) }, null, 2));
