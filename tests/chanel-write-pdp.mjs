import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

// 6 PASS products with known product IDs
const products = [
  {
    id: '#01', pid: '536027437550618',
    name: 'Chanel Sneaker Light Pink',
    seoTitle: 'Chanel Sneaker Light Pink G45077 B16748 NY270 Reps | Drip Sneakers',
    keywords: 'Chanel Sneaker Light Pink, Chanel light pink sneaker, Light Pink Chanel sneaker, G45077 B16748 NY270, Chanel sneaker reps',
    metaDesc: 'Shop Chanel Sneaker Light Pink reps (G45077 B16748 NY270) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'chanel-sneaker-light-pink-g45077-b16748-ny270',
    keyDesc: `<p>This Chanel sneaker features a Light Pink suede upper with tonal Interlocking CC branding and a chunky runner-style sole.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Sneaker</li><li><strong>Model:</strong> Sneaker</li><li><strong>Colorway:</strong> Light Pink</li><li><strong>SKU:</strong> G45077 B16748 NY270</li></ul>`,
    cleanDescription: false
  },
  {
    id: '#02', pid: '536027437600016',
    name: 'Chanel Interlocking CC Logo Sneakers Black',
    seoTitle: 'Chanel Interlocking CC Logo Sneakers Black G39792 Reps | Drip Sneakers',
    keywords: 'Chanel Interlocking CC Logo Sneakers Black, Chanel G39792 sneakers, Black Chanel CC sneakers, G39792, Chanel sneaker reps',
    metaDesc: 'Shop Chanel Interlocking CC Logo Sneakers Black reps (G39792) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'chanel-interlocking-cc-logo-sneakers-black-g39792',
    keyDesc: `<p>This Chanel sneaker features a Black colorway with Interlocking CC branding and rubber and suede trim.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Sneaker</li><li><strong>Model:</strong> Interlocking CC Logo Athletic Sneakers</li><li><strong>Colorway:</strong> Black</li><li><strong>SKU:</strong> G39792</li></ul>`,
    cleanDescription: false
  },
  {
    id: '#03', pid: '536027425560603',
    name: 'Chanel CC Logo Sneaker White Silver',
    seoTitle: 'Chanel CC Logo Sneaker White Silver G39792-Y56368-K5451 Reps | Drip Sneakers',
    keywords: 'Chanel CC Logo Sneaker White Silver, Chanel G39792 White Silver sneaker, White Silver Chanel sneaker, G39792-Y56368-K5451, Chanel sneaker reps',
    metaDesc: 'Shop Chanel CC Logo Sneaker White Silver reps (G39792-Y56368-K5451) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'chanel-cc-logo-sneaker-white-silver-g39792-y56368-k5451',
    keyDesc: `<p>This Chanel sneaker combines a White and Silver colorway with fabric and laminated detailing and contrasting CC branding.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Sneaker</li><li><strong>Model:</strong> CC Logo Sneaker</li><li><strong>Colorway:</strong> White / Silver</li><li><strong>SKU:</strong> G39792-Y56368-K5451</li></ul>`,
    cleanDescription: false
  },
  {
    id: '#18', pid: '536027558325278',
    name: 'Chanel Interlocking CC Logo Sneaker Light Grey',
    seoTitle: 'Chanel Interlocking CC Logo Sneaker Light Grey G40184-Y56630-0T627 Reps | Drip Sneakers',
    keywords: 'Chanel Interlocking CC Logo Sneaker Light Grey, Chanel G40184 Light Grey sneaker, Light Grey Chanel CC sneaker, G40184-Y56630-0T627, Chanel sneaker reps',
    metaDesc: 'Shop Chanel Interlocking CC Logo Sneaker Light Grey reps (G40184-Y56630-0T627) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'chanel-interlocking-cc-logo-sneaker-light-grey-g40184-y56630-0t627',
    keyDesc: `<p>This Chanel sneaker features a Light Grey fabric and suede calfskin construction with contrasting Interlocking CC branding.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Sneaker</li><li><strong>Model:</strong> Interlocking CC Logo Sneaker</li><li><strong>Colorway:</strong> Light Grey</li><li><strong>SKU:</strong> G40184-Y56630-0T627</li></ul>`,
    cleanDescription: true
  },
  {
    id: '#19', pid: '536027558374673',
    name: 'Chanel Low Top Trainer CC Grey',
    seoTitle: 'Chanel Low Top Trainer CC Grey G34360 X52117 94305 Reps | Drip Sneakers',
    keywords: 'Chanel Low Top Trainer CC Grey, Chanel G34360 trainer, Grey Black Chanel trainer, G34360 X52117 94305, Chanel trainer reps',
    metaDesc: 'Shop Chanel Low Top Trainer CC Grey reps (G34360 X52117 94305) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'chanel-low-top-trainer-cc-grey-g34360-x52117-94305',
    keyDesc: `<p>This Chanel low-top trainer features a Grey and Black colorway with contrasting CC branding across its athletic silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Sneaker</li><li><strong>Model:</strong> Low Top Trainer CC</li><li><strong>Colorway:</strong> Grey / Black</li><li><strong>SKU:</strong> G34360 X52117 94305</li></ul>`,
    cleanDescription: true
  },
  {
    id: '#20', pid: '536027558420754',
    name: 'Chanel Low Top Trainer Suede White Black',
    seoTitle: 'Chanel Low Top Trainer Suede White Black G38299-Y55720-K3846 Reps | Drip Sneakers',
    keywords: 'Chanel Low Top Trainer Suede White Black, Chanel G38299 White Black trainer, White Black Chanel CC sneaker, G38299-Y55720-K3846, Chanel trainer reps',
    metaDesc: 'Shop Chanel Low Top Trainer Suede White Black reps (G38299-Y55720-K3846) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    slug: 'chanel-low-top-trainer-suede-white-black-g38299-y55720-k3846',
    keyDesc: `<p>This Chanel low-top trainer combines White and Black mesh, suede calfskin and grained calfskin with an oversized contrasting Interlocking CC logo.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Sneaker</li><li><strong>Model:</strong> Low Top Trainer Suede</li><li><strong>Colorway:</strong> White / Black</li><li><strong>SKU:</strong> G38299-Y55720-K3846</li></ul>`,
    cleanDescription: true
  },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const results = [];

  for (const p of products) {
    try {
      console.log(`\n=== ${p.id}: ${p.name} ===`);
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);

      // Update product name
      const nameInput = page.locator('input[placeholder="请输入商品名称"]');
      await nameInput.fill(p.name);
      console.log('  Name updated');

      // Click SEO drawer
      await page.locator('text=编辑SEO').first().click();
      await page.waitForTimeout(1500);

      // Fill textareas: TA0=keywords, TA1=SEO title, TA2=meta desc, TA3=slug
      const tas = await page.locator('textarea:visible').all();
      if (tas.length >= 4) {
        await tas[0].fill(p.keywords);
        await tas[1].fill(p.seoTitle);
        await tas[2].fill(p.metaDesc);
        // Don't change URL slug - it might trigger code=-3
        console.log('  SEO fields filled');
      }

      // Set tinyMCE editors
      // Editor 0 = Key Description (structured content)
      // Editor 1 = Product Description (for #18/#19/#20, clean it to just images/no duplicated text)
      await page.evaluate(({ keyDesc, cleanDesc }) => {
        if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(keyDesc);
        if (tinyMCE?.editors?.[1]) {
          if (cleanDesc) {
            // Remove duplicated Key Description text - leave empty (images only)
            tinyMCE.editors[1].setContent('');
          } else {
            tinyMCE.editors[1].setContent(keyDesc);
          }
        }
      }, { keyDesc: p.keyDesc, cleanDesc: p.cleanDescription });
      console.log('  Editors set' + (p.cleanDescription ? ' (Editor 1 cleaned)' : ''));

      // Click drawer confirm
      await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
      await page.waitForTimeout(1500);

      // Click main save
      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(3000);

      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      const bodyText = await page.locator('body').innerText();
      const ok = toast.includes('成功') || bodyText.includes('保存成功');
      console.log(`  -> ${ok ? 'SUCCESS' : 'CHECK: ' + toast.slice(0,80)}`);
      results.push({ id: p.id, status: ok ? 'SUCCESS' : 'UNKNOWN' });
    } catch(e) {
      console.log(`  -> FATAL: ${e.message.slice(0,100)}`);
      results.push({ id: p.id, status: 'FATAL' });
    }
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/chanel-pdp-results.json', JSON.stringify(results, null, 2));
  await browser.close();
  console.log('\n=== Summary ===');
  for (const r of results) console.log(`  ${r.id}: ${r.status}`);
}

main().catch(e => console.error('Fatal:', e));
