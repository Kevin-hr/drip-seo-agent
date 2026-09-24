import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

const ids = ['536027239001368', '536027070486297', '536027070065427'];
for (const id of ids) {
  const j = await page.evaluate(async (pid) => {
    const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [[pid]], additions: {} }) });
    return r.json();
  }, id);
  const row = j.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
  if (!row) { console.log(`\n=== ${id}: NO ROW ===`); continue; }
  // Print SEO-related + key fields
  const keys = Object.keys(row).filter(k => /seo|path|url|slug|name|show|spu|code/i.test(k));
  console.log(`\n=== ${id} ${row.Name || ''} ===`);
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'object' && v !== null) continue;
    console.log(`  ${k}: ${String(v).slice(0, 120)}`);
  }
  // Also print SEO object if nested
  for (const k of Object.keys(row)) {
    if (row[k] && typeof row[k] === 'object' && /seo/i.test(k)) console.log(`  ${k}: ${JSON.stringify(row[k]).slice(0, 500)}`);
  }
}
await browser.close();
