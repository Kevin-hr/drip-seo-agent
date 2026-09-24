import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const products = [
  {
    pid: '536027553308699',
    name: 'CELINE Regular T-Shirt Black Multicolor',
    seoTitle: 'CELINE Regular T-Shirt Black Multicolor | Drip Sneakers',
    keywords: 'CELINE Regular T-Shirt, CELINE cotton jersey tee, Black Multicolor CELINE tee, CELINE t-shirt reps, CELINE shirt',
    metaDesc: 'Shop CELINE Regular T-Shirt in Black Multicolor cotton jersey at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'CELINE-Regular-T-Shirt-Black-Multicolor',
    brand: 'CELINE', brandUrl: '/Celine/',
    type: 'T-Shirt', model: 'Regular T-Shirt', color: 'Black/Multicolor', sku: ''
  },
  {
    pid: '536027553279506',
    name: 'Prada Cotton T-Shirt White',
    seoTitle: 'Prada Cotton T-Shirt White UJN861 | Drip Sneakers',
    keywords: 'Prada Cotton T-Shirt White, Prada UJN861 tee, White Prada t-shirt, UJN861_240_F0009, Prada tee reps',
    metaDesc: 'Shop Prada Cotton T-Shirt White (UJN861) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'Prada-Cotton-T-Shirt-White-UJN861',
    brand: 'Prada', brandUrl: '/Prada/',
    type: 'T-Shirt', model: 'Cotton T-Shirt', colorway: 'White', sku: 'UJN861_240_F0009_S_232'
  },
  {
    pid: '536027553230614',
    name: 'Prada Milano Embroidered Logo T-Shirt Black',
    seoTitle: 'Prada Milano Embroidered Logo T-Shirt Black | Drip Sneakers',
    keywords: 'Prada Milano Embroidered Logo T-Shirt Black, Prada embroidered tee, Black Prada logo t-shirt, Prada Milano tee reps',
    metaDesc: 'Shop Prada Milano Embroidered Logo T-Shirt Black at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'prada-milano-embroidered-logo-tshirt-black',
    brand: 'Prada', brandUrl: '/Prada/',
    type: 'T-Shirt', model: 'Milano Embroidered Logo', colorway: 'Black', sku: ''
  },
  {
    pid: '536027553199636',
    name: 'Prada Milano Embroidered Logo T-Shirt White',
    seoTitle: 'Prada Milano Embroidered Logo T-Shirt White | Drip Sneakers',
    keywords: 'Prada Milano Embroidered Logo T-Shirt White, Prada embroidered tee, White Prada logo t-shirt, Prada Milano tee reps',
    metaDesc: 'Shop Prada Milano Embroidered Logo T-Shirt White at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'prada-milano-embroidered-logo-tshirt-white',
    brand: 'Prada', brandUrl: '/Prada/',
    type: 'T-Shirt', model: 'Milano Embroidered Logo', colorway: 'White', sku: ''
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

      // Update product name
      await page.locator('input[placeholder="请输入商品名称"]').fill(p.name);

      // Open SEO drawer
      await page.locator('text=编辑SEO').first().click();
      await page.waitForTimeout(1500);

      // Fill textareas
      const tas = await page.locator('textarea:visible').all();
      if (tas.length >= 4) {
        await tas[0].fill(p.keywords);
        await tas[1].fill(p.seoTitle);
        await tas[2].fill(p.metaDesc);
        // Fix slug - replace / with -
        await tas[3].fill(p.slug);
        console.log('  SEO fields + slug fixed');
      }

      // Set editors
      const skuLi = p.sku ? `<li><strong>SKU:</strong> ${p.sku}</li>` : '';
      const keyDesc = `<p>This ${p.brand} ${p.model.toLowerCase()} comes in ${p.colorway} with embroidered logo detailing on premium cotton jersey.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org${p.brandUrl}"><strong>${p.brand}</strong></a></li><li><strong>Product Type:</strong> ${p.type}</li><li><strong>Model:</strong> ${p.model}</li><li><strong>Colorway:</strong> ${p.colorway}</li>${skuLi}</ul>`;

      await page.evaluate((kd) => {
        if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(kd);
        if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent('');
      }, keyDesc);
      console.log('  Editors set');

      // Drawer confirm
      await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
      await page.waitForTimeout(1500);

      // Save
      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(3000);

      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      console.log(`  -> ${toast.includes('成功') ? 'OK' : toast.slice(0,80)}`);
    } catch(e) {
      console.log(`  -> FAIL: ${e.message.slice(0,100)}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
