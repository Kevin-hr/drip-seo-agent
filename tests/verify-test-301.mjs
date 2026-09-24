import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

// 1. read UI save body to see OldUrlValue on URL change
try {
  const body = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/ui-save-body.json','utf8'));
  const row = body.args[0][0].rows[0];
  console.log('UI same-value save: UrlValue=', row.UrlValue, '| OldUrlValue=', row.OldUrlValue);
} catch(e) { console.log('ui-save-body:', e.message); }
const probeCalls = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/ui-301-probe-calls.json','utf8'));
const sm = probeCalls.find(c => !c.resp && c.url.includes('saveModify'));
if (sm) {
  const row = JSON.parse(sm.postData).args[0][0].rows[0];
  console.log('UI URL-change save: UrlValue=', row.UrlValue, '| OldUrlValue=', JSON.stringify(row.OldUrlValue), '| SeoUrlChangeTo301=', row.SeoUrlChangeTo301);
} else console.log('no saveModify in probe calls');

// 2. check backend stored fields for the test product
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
const j = await page.evaluate(async (pid) => {
  const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [[pid]], additions: {} }) });
  return r.json();
}, '536027557731352');
const row = j.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
console.log('\nstored: UrlValue=', row?.UrlValue, '| OldUrlValue=', row?.OldUrlValue, '| SeoUrlChangeTo301=', row?.SeoUrlChangeTo301);

// 3. front-end 301 test
await page.goto('https://www.dripsneakers.org/', { waitUntil: 'domcontentloaded' });
const oldUrl = 'https://www.dripsneakers.org/球衣测试';
try {
  const resp = await page.goto(oldUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('OLD URL 球衣测试 -> status:', resp.status(), '| final:', page.url().slice(0,80));
} catch(e) { console.log('OLD URL error:', e.message.slice(0,80)); }
await browser.close();
