import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const res = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/url-remediation-all.json','utf8'));
const sample = res.filter(r=>/Pkgod/i.test(r.oldUrlValue)).slice(0,5);
console.log('Testing 301 for', sample.length, 'old pkgod URLs\n');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

for (const r of sample) {
  const oldUrl = 'https://www.dripsneakers.org/' + r.oldUrlValue.replace(/^\//,'');
  try {
    const resp = await page.goto(oldUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = resp.status();
    const finalUrl = page.url();
    console.log(`old=${r.oldUrlValue.slice(0,55)}`);
    console.log(`   status=${status} -> ${finalUrl.slice(0,70)}`);
  } catch(e) {
    console.log(`old=${r.oldUrlValue.slice(0,55)} ERROR ${String(e).slice(0,80)}`);
  }
}
await browser.close();
