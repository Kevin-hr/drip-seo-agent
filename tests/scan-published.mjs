import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });

// Load all product IDs from queue
const queue = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/queue.json', 'utf8'));
const products = queue.products || queue;
const ids = products.map(x => String(x.productId || x.product_id || x.Id || x.id || x));
console.log('Total in queue:', ids.length);

// Batch check 50 at a time
let published = 0, unpublished = 0, errors = 0;
for (let i = 0; i < ids.length; i += 50) {
  const batch = ids.slice(i, i + 50);
  const results = await page.evaluate(async (batch) => {
    const out = [];
    for (const pid of batch) {
      try {
        const r = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: [[pid]], additions: {} }) });
        const j = await r.json();
        const row = j.result?.find(s => s.name === 'dtb_proProduct')?.rows?.[0];
        out.push({ id: pid, isShow: row?.IsShow, name: row?.Name?.slice(0,30) });
      } catch(e) { out.push({ id: pid, error: String(e).slice(0,50) }); }
    }
    return out;
  }, batch);
  for (const r of results) {
    if (r.error) errors++;
    else if (r.isShow === true) published++;
    else unpublished++;
  }
  process.stdout.write(`\rChecked ${Math.min(i+50, ids.length)}/${ids.length} | Published: ${published} | Unpublished: ${unpublished} | Errors: ${errors}`);
}
console.log(`\n\nFINAL: Published=${published}, Unpublished=${unpublished}, Errors=${errors}`);
await browser.close();
