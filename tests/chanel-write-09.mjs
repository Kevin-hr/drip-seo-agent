import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const product = {
  id: '#09', pid: '536027442758422',
  name: 'Chanel Low Top Trainer Black White',
  seoTitle: 'Chanel Low Top Trainer Black White G38299-Y55720-K3845 Reps | Drip Sneakers',
  keywords: 'Chanel Low Top Trainer Black White, Chanel G38299 trainer, Black White Chanel trainer, G38299-Y55720-K3845, Chanel trainer reps',
  metaDesc: 'Shop Chanel Low Top Trainer Black White reps (G38299-Y55720-K3845) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
  keyDesc: `<p>This Chanel low-top trainer combines Black and White mesh, suede calfskin and grained calfskin with contrasting Interlocking CC branding.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Sneaker</li><li><strong>Model:</strong> Low Top Trainer</li><li><strong>Colorway:</strong> Black / White</li><li><strong>SKU:</strong> G38299-Y55720-K3845</li></ul>`,
  cleanDescription: false
};

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  console.log(`=== ${product.id}: ${product.name} ===`);
  await page.goto('about:blank');
  await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${product.pid}%5D`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Update product name
  await page.locator('input[placeholder="请输入商品名称"]').fill(product.name);
  console.log('  Name updated');

  // Click SEO drawer
  await page.locator('text=编辑SEO').first().click();
  await page.waitForTimeout(1500);

  // Fill textareas
  const tas = await page.locator('textarea:visible').all();
  if (tas.length >= 4) {
    await tas[0].fill(product.keywords);
    await tas[1].fill(product.seoTitle);
    await tas[2].fill(product.metaDesc);
    console.log('  SEO fields filled');
  }

  // Set editors
  await page.evaluate(({ keyDesc, cleanDesc }) => {
    if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(keyDesc);
    if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent(cleanDesc ? '' : keyDesc);
  }, { keyDesc: product.keyDesc, cleanDesc: product.cleanDescription });
  console.log('  Editors set');

  // Click drawer confirm
  await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
  await page.waitForTimeout(1500);

  // Click main save
  await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
  await page.waitForTimeout(3000);

  const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
  console.log(`  -> ${toast.includes('成功') ? 'SUCCESS' : 'CHECK: ' + toast.slice(0,80)}`);

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
