// Read full Content + Summary + Seo fields for the ID, save raw text to a file.
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const id = process.argv[2] || '536027239001368';
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/#/product/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);
const j = await page.evaluate(async (pid) => {
  const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ args: [[pid]], additions: {} }) });
  return r.json();
}, String(id));
const row = j.result.find((s) => s.name === 'dtb_proProduct').rows[0];
await fs.writeFile(`_dump_${id}.json`, JSON.stringify({
  id, IsShow: row.IsShow,
  Name: row.Name,
  UrlValue: row.UrlValue, OldUrlValue: row.OldUrlValue, SeoUrlChangeTo301: row.SeoUrlChangeTo301,
  SeoTitle: row.SeoTitle, SeoKeyword: row.SeoKeyword, SeoDesc: row.SeoDesc,
  SummaryLen: String(row.Summary || '').length,
  ContentLen: String(row.Content || '').length,
  ContentHead: String(row.Content || '').slice(0, 600),
  ContentTail: String(row.Content || '').slice(-400),
  ContentHasPkgod: /pkgod/i.test(String(row.Content || '')),
  SummaryHasPkgod: /pkgod/i.test(String(row.Summary || '')),
}, null, 2));
// Also save raw Content (huge but useful for grep).
await fs.writeFile(`_dump_${id}_content.html`, String(row.Content || ''));
await fs.writeFile(`_dump_${id}_summary.html`, String(row.Summary || ''));
await browser.close();
console.log('written _dump_' + id + '.json + content + summary');
