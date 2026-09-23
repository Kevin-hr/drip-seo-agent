import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const queue = JSON.parse(await fs.readFile(path.join(runDir, 'queue.json'), 'utf8'));

const targets = queue.products
  .filter((p) => p.disposition === 'VERIFY' && (!p.sku || p.sku.trim() === ''));

const limit = Number(process.env.V45_BATCH_LIMIT || 50);
const offset = Number(process.env.V45_BATCH_OFFSET || 0);
const batch = targets.slice(offset, offset + limit);
console.log(`Reading ${batch.length} no-SKU products (offset ${offset} of ${targets.length})`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

const details = [];
for (const p of batch) {
  const id = p.productId;
  try {
    const detail = await page.evaluate(async (pid) => {
      const response = await fetch('/biz/DTB_proProduct/modify', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
        body: JSON.stringify({ args: [[pid]], additions: {} })
      });
      const json = await response.json();
      if (!response.ok || !json.success) return { error: `http_${response.status}` };
      const seg = (n) => json.result.find((s) => s.name === n)?.rows || [];
      const row = seg('dtb_proProduct')[0] || {};
      const imgList = row.ImgList || [];
      return {
        id: String(row.Id || pid),
        name: row.Name || '',
        isShow: row.IsShow,
        urlValue: row.UrlValue || '',
        brandName: row.BrandName || '',
        imageCount: imgList.length,
        firstImage: imgList[0] ? `https://images.mrshopplus.com/${imgList[0].s}` : '',
        categories: seg('dtb_proProductCates').map((x) => x.CategoryName),
        existingSeo: { title: row.SeoTitle || '', desc: row.SeoDesc || '', keyword: row.SeoKeyword || '' }
      };
    }, id);
    if (detail.error) throw new Error(detail.error);
    details.push({ ...detail, brandBucket: p.brandBucket });
  } catch (e) {
    details.push({ id, error: String(e), brandBucket: p.brandBucket });
  }
}
await context.close();
await browser.close();

const outFile = path.join(runDir, `nosku-detail-offset-${offset}.json`);
await fs.writeFile(outFile, `${JSON.stringify(details, null, 2)}\n`);
console.log(`Wrote ${details.length} details to ${outFile}`);
details.forEach(d => console.log(`  ${d.id} | imgs=${d.imageCount||0} | ${(d.name||d.error||'').trim().substring(0,70)}`));
