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

const queue = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/queue.json', 'utf8'));
const products = queue.products;
const all = [];
for (let i = 0; i < products.length; i += 30) {
  const batch = products.slice(i, i + 30);
  const results = await page.evaluate(async (batch) => {
    const out = [];
    for (const p of batch) {
      try {
        const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: [[String(p.productId)]], additions: {} }) });
        const j = await r.json();
        const row = j.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
        out.push(row ? {
          id: String(p.productId),
          name: (row.Name || '').trim(),
          isShow: row.IsShow,
          urlValue: row.UrlValue || '',
          url: row.Url || '',
          oldUrlValue: row.OldUrlValue || '',
          seoTitle: row.SeoTitle || '',
          seoKeyword: row.SeoKeyword || '',
          seoDesc: row.SeoDesc || '',
          summary: (row.Summary || '').slice(0, 200)
        } : { id: String(p.productId), error: 'no-row' });
      } catch(e) { out.push({ id: String(p.productId), error: String(e).slice(0,50) }); }
    }
    return out;
  }, batch);
  all.push(...results);
  process.stdout.write(`\rScanned ${Math.min(i+30, products.length)}/${products.length}`);
}
console.log('\nTotal scanned:', all.length);
await fs.writeFile('data/runs/v45-batch-2026-09-23/minimal-run/all-products-scan.json', JSON.stringify(all, null, 2));
await browser.close();
