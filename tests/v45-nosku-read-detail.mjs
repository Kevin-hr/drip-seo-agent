import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const queue = JSON.parse(await fs.readFile(path.join(runDir, 'queue.json'), 'utf8'));

// Target: VERIFY products WITHOUT a SKU (apparel/accessories)
const targets = queue.products
  .filter((p) => p.disposition === 'VERIFY' && (!p.sku || p.sku.trim() === ''));

const limit = Number(process.env.V45_BATCH_LIMIT || 30);
const offset = Number(process.env.V45_BATCH_OFFSET || 0);
const batch = targets.slice(offset, offset + limit);
console.log(`Selected ${batch.length} of ${targets.length} no-SKU VERIFY products (offset ${offset})`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

const details = [];
for (const p of batch) {
  const id = p.productId;
  for (let attempt = 1; attempt <= 3; attempt++) {
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
          imageList: imgList.map((x) => ({ s: x.s, a: x.a || '' })),
          categories: seg('dtb_proProductCates').map((x) => x.CategoryName),
          skuRows: seg('DTB_proSKU_ref').map((x) => ({ SkuCode: x.SkuCode, Size: x.SizeName || x.Size || '' })),
          seoTitle: row.SeoTitle || '',
          seoDesc: row.SeoDesc || '',
          seoKeyword: row.SeoKeyword || '',
          summary: row.Summary || '',
          content: row.Content || ''
        };
      }, id);
      if (detail.error) throw new Error(detail.error);
      details.push({ ...detail, brandBucket: p.brandBucket, sku: '', queueReason: p.reason });
      console.log(`  read ${id} | imgs=${detail.imageCount} | ${detail.name.slice(0, 70)}`);
      break;
    } catch (e) {
      if (attempt === 3) { details.push({ id, error: String(e), brandBucket: p.brandBucket }); console.log(`  FAIL ${id}: ${e}`); }
      await page.waitForTimeout(500 * attempt);
    }
  }
}
await context.close();
await browser.close();

await fs.writeFile(path.join(runDir, 'nosku-detail-read.json'), `${JSON.stringify(details, null, 2)}\n`);
console.log(`Wrote ${details.length} no-SKU details to nosku-detail-read.json`);
