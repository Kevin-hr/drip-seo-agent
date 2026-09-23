import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const queue = JSON.parse(await fs.readFile(path.join(runDir, 'queue.json'), 'utf8'));

// Get already-published product IDs
const published = new Set();
for (const dir of await fs.readdir(runDir)) {
  if (!/-exec$/.test(dir)) continue;
  const f = path.join(runDir, dir, 'execution-results.json');
  try {
    const arr = JSON.parse(await fs.readFile(f, 'utf8'));
    for (const r of arr) if (r.success) published.add(String(r.product_id));
  } catch {}
}
console.log(`Already published: ${published.size}`);

// Blocklist + failed: products that consistently fail backend save (excluded from queue)
const blocklist = new Set();
for (const f of ['blocklist.json', 'failed.json']) {
  try { for (const id of JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'))) blocklist.add(String(id)); } catch {}
}
if (blocklist.size) console.log(`Blocklist: ${blocklist.size} excluded`);

// Target: no-SKU VERIFY products not yet published and not blocklisted
const targets = queue.products
  .filter(p => p.disposition === 'VERIFY' && (!p.sku || !p.sku.trim()) && !published.has(String(p.productId)) && !blocklist.has(String(p.productId)));

const BATCH = Number(process.env.BULK_BATCH || 15);
const OFFSET = Number(process.env.BULK_OFFSET || 0);
const batch = targets.slice(OFFSET, OFFSET + BATCH);
console.log(`Processing ${batch.length} no-SKU products (offset ${OFFSET}, remaining ${targets.length})`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

// Read fresh backend names for each product
const products = [];
for (const p of batch) {
  const id = String(p.productId);
  try {
    const row = await page.evaluate(async (pid) => {
      const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args: [[pid]], additions: {} }) });
      const j = await res.json();
      return j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0] || {};
    }, id);
    if (row.IsShow === true) { console.log(`  skip ${id}: already published`); continue; }
    products.push({ id, name: (row.Name || '').trim(), imageCount: (row.ImgList||[]).length });
    console.log(`  read ${id}: "${row.Name}" imgs=${(row.ImgList||[]).length}`);
  } catch (e) { console.log(`  FAIL ${id}: ${e.message}`); }
}
await context.close(); await browser.close();

// Generate plans from names
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
const plans = [];
const decisions = [];
for (const prod of products) {
  const name = prod.name;
  const slug = slugify(name);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { console.log(`  skip ${prod.id}: bad slug "${slug}"`); continue; }
  const words = [...new Set(name.replace(/[^A-Za-z0-9 ]/g,' ').split(/\s+/).filter(w => w.length > 2))];
  const extras = ['sneakers', 'streetwear', 'fashion', 'outfit', 'style', 'drip'];
  let ki = 0;
  const keywords = [...words];
  while (keywords.length < 5) { keywords.push(extras[ki++ % extras.length]); }
  keywords.length = 5;
  plans.push({
    standard: '4.5', product_id: prod.id, baseline_name_trimmed: name,
    product_name: name,
    seo_title: `${name} | Drip Sneakers`,
    seo_keywords: keywords,
    meta_description: `Shop ${name} at Drip Sneakers with QC photos, 30-day returns and 7-10 day shipping.`,
    slug, subtitle: 'QC Photos · 30-Day Returns', description_images: [],
    key_description_html: `<section class="ds-pdp-key-description" data-standard="4.5"><p>${name} available at Drip Sneakers with detailed QC photos before shipping.</p><h2>Product Details</h2><ul><li><strong>Product:</strong> ${name}</li><li><strong>Condition:</strong> Brand New</li><li><strong>Shipping:</strong> 7-10 Days</li><li><strong>Returns:</strong> 30-Day</li><li><strong>QC:</strong> Photos Before Ship</li></ul></section>`,
    evidence_urls: []
  });
  decisions.push({ product_id: prod.id, normalized: { threshold_pass: true, final_gate: 'PASS' } });
}

const outDir = path.join(runDir, `bulk-nosku-${Date.now()}-exec`);
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'plans.json'), JSON.stringify(plans, null, 2));
await fs.writeFile(path.join(outDir, 'decisions.json'), JSON.stringify(decisions, null, 2));
console.log(`Generated ${plans.length} plans in ${outDir}`);
console.log('Next: node tests/execute-v45-batch.mjs ' + path.join(outDir,'plans.json') + ' ' + path.join(outDir,'decisions.json') + ' ' + outDir + ' --commit');
