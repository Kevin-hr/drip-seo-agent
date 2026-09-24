import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const products = [
  {
    pid: '536027048015637',
    name: 'Nike Air Force 1 Low Off-White MCA University Blue',
    seoTitle: 'Nike Air Force 1 Low Off-White MCA University Blue AO4606-100 Reps | Drip Sneakers',
    keywords: 'Nike Air Force 1 Off-White MCA, Air Force 1 University Blue, AO4606-100, Off-White AF1, Air Force 1 reps',
    metaDesc: 'Shop Nike Air Force 1 Low Off-White MCA University Blue reps (AO4606-100) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Off-White MCA', color: 'University Blue', sku: 'AO4606-100',
    desc: 'This Nike Air Force 1 Low Off-White MCA features a University Blue canvas upper with Off-White branding and the signature zip tie.'
  },
  {
    pid: '536027047869464',
    name: 'Nike Air Force 1 Low Travis Scott Sail',
    seoTitle: 'Nike Air Force 1 Low Travis Scott Sail DM7866-200 Reps | Drip Sneakers',
    keywords: 'Nike Air Force 1 Travis Scott Sail, Travis Scott AF1, DM7866-200, Cactus Jack Air Force 1, AF1 reps',
    metaDesc: 'Shop Nike Air Force 1 Low Travis Scott Sail reps (DM7866-200) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Travis Scott', color: 'Sail', sku: 'DM7866-200',
    desc: 'This Nike Air Force 1 Low Travis Scott features a Sail suede upper with reversed Swoosh and Cactus Jack branding.'
  },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  for (const p of products) {
    try {
      console.log(`\n=== ${p.name} ===`);
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);

      await page.locator('input[placeholder="请输入商品名称"]').fill(p.name);
      await page.locator('text=编辑SEO').first().click();
      await page.waitForTimeout(1500);

      const tas = await page.locator('textarea:visible').all();
      if (tas.length >= 4) {
        await tas[0].fill(p.keywords);
        await tas[1].fill(p.seoTitle);
        await tas[2].fill(p.metaDesc);
      }

      const keyDesc = `<p>${p.desc}</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org${p.brandUrl}"><strong>${p.brand}</strong></a></li><li><strong>Product Type:</strong> ${p.type}</li><li><strong>Model:</strong> ${p.model}</li><li><strong>Colorway:</strong> ${p.color}</li><li><strong>SKU:</strong> ${p.sku}</li></ul>`;

      await page.evaluate((kd) => {
        if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(kd);
        if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent('');
      }, keyDesc);

      await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
      await page.waitForTimeout(1500);
      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(3000);

      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      console.log(`  -> ${toast.includes('成功') ? 'OK' : toast.slice(0,60)}`);
    } catch(e) {
      console.log(`  -> FAIL: ${e.message.slice(0,80)}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
