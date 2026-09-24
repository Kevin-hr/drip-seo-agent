import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const fixes = [
  { id: 'P0-03', pid: '541579345303579', name: 'Represent Luggage Tag Hoodie Antique White',
    seoTitle: 'Represent Luggage Tag Hoodie Antique White MLM4686-242 Reps | Drip Sneakers',
    metaDesc: 'Shop Represent Luggage Tag Hoodie Antique White reps (MLM4686-242) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Represent Luggage Tag Hoodie comes in Antique White with luggage-tag graphics across the front and back in a heavyweight oversized hoodie construction.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Luggage Tag Hoodie</li><li><strong>Colorway:</strong> Antique White</li><li><strong>SKU:</strong> MLM4686-242</li></ul>` },
  { id: 'P0-07', pid: '541577273184028', name: 'Represent Owners Club Script Hoodie Black',
    seoTitle: 'Represent Owners Club Script Hoodie Black OCM41200-001 Reps | Drip Sneakers',
    metaDesc: 'Shop Represent Owners Club Script Hoodie Black reps (OCM41200-001) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Represent Owners Club Script Hoodie comes in Black with the Owners Club script identity across the heavyweight cotton hoodie silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owners Club Script Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>SKU:</strong> OCM41200-001</li></ul>` },
  { id: 'P0-08', pid: '541576660608030', name: 'Represent Owners Club Hoodie Ash Grey/Black',
    seoTitle: 'Represent Owners Club Hoodie Ash Grey Black M04153-302 Reps | Drip Sneakers',
    metaDesc: 'Shop Represent Owners Club Hoodie Ash Grey/Black reps (M04153-302) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Represent Owners Club Hoodie uses an Ash Grey base with contrasting Black Owners Club branding in the oversized cotton hoodie silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owners Club Hoodie</li><li><strong>Colorway:</strong> Ash Grey/Black</li><li><strong>SKU:</strong> M04153-302</li></ul>` },
  { id: 'P0-09', pid: '541574614856220', name: "Represent Owner's Club Hoodie Brown/White",
    seoTitle: "Represent Owner's Club Hoodie Brown White M04153-04 Reps | Drip Sneakers",
    metaDesc: "Shop Represent Owner's Club Hoodie Brown/White reps (M04153-04) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.",
    keyDesc: `<p>This Represent Owner's Club Hoodie combines a Brown base with White Owners Club branding in the oversized hoodie silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owner's Club Hoodie</li><li><strong>Colorway:</strong> Brown/White</li><li><strong>SKU:</strong> M04153-04</li></ul>` },
  { id: 'P0-10', pid: '541574389001757', name: 'Represent Patron of The Club Hoodie Black',
    seoTitle: 'Represent Patron of The Club Hoodie Black MLM4270-001 Reps | Drip Sneakers',
    metaDesc: 'Shop Represent Patron of The Club Hoodie Black reps (MLM4270-001) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Represent Patron of The Club Hoodie comes in Black with Patron of The Club graphic branding across the cotton hoodie construction.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Patron of The Club Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>SKU:</strong> MLM4270-001</li></ul>` },
  { id: 'P0-11', pid: '541573975406101', name: 'Represent Owners Club Hoodie Black',
    seoTitle: 'Represent Owners Club Hoodie Black OCM41113-001 Reps | Drip Sneakers',
    metaDesc: 'Shop Represent Owners Club Hoodie Black reps (OCM41113-001) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Represent Owners Club Hoodie comes in Black with the signature Owners Club branding in the brand's oversized hoodie silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owners Club Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>SKU:</strong> OCM41113-001</li></ul>` },
  { id: 'P0-12', pid: '541572937470224', name: 'Vale Forever Classico Zip Up Hoodie Sapphire',
    seoTitle: 'Vale Forever Classico Zip Up Hoodie Sapphire Reps | Drip Sneakers',
    metaDesc: 'Shop Vale Forever Classico Zip Up Hoodie Sapphire reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Vale Forever Classico hoodie uses a Sapphire colorway with a full-zip front in the Classico zip-up silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Vale Forever</strong></a></li><li><strong>Product Type:</strong> Zip-Up Hoodie</li><li><strong>Model:</strong> Classico Zip Up Hoodie</li><li><strong>Colorway:</strong> Sapphire</li><li><strong>Closure:</strong> Full Zip</li></ul>` },
  { id: 'P0-13', pid: '541572560539930', name: 'Vale Forever Classico Zip Up Hoodie White',
    seoTitle: 'Vale Forever Classico Zip Up Hoodie White Reps | Drip Sneakers',
    metaDesc: 'Shop Vale Forever Classico Zip Up Hoodie White reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Vale Forever Classico hoodie uses a White colorway with a full-zip front in the Classico zip-up silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Vale Forever</strong></a></li><li><strong>Product Type:</strong> Zip-Up Hoodie</li><li><strong>Model:</strong> Classico Zip Up Hoodie</li><li><strong>Colorway:</strong> White</li><li><strong>Closure:</strong> Full Zip</li></ul>` },
  { id: 'P0-14', pid: '541572053325584', name: 'Vale Forever Classico Zip Up Hoodie Black',
    seoTitle: 'Vale Forever Classico Zip Up Hoodie Black Reps | Drip Sneakers',
    metaDesc: 'Shop Vale Forever Classico Zip Up Hoodie Black reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Vale Forever Classico hoodie uses a Black colorway with a full-zip front in the Classico zip-up silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Vale Forever</strong></a></li><li><strong>Product Type:</strong> Zip-Up Hoodie</li><li><strong>Model:</strong> Classico Zip Up Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>Closure:</strong> Full Zip</li></ul>` },
  { id: 'P1-01', pid: '541648130634781', name: 'New Balance 9060 Bricks & Wood',
    seoTitle: 'New Balance 9060 Bricks & Wood U9060BW1 Reps | Drip Sneakers',
    metaDesc: 'Shop New Balance 9060 Bricks & Wood reps (U9060BW1) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This New Balance 9060 Bricks & Wood collaboration combines Beige, Grey and Green tones across the layered 9060 construction.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/SNEAKERS"><strong>New Balance</strong></a></li><li><strong>Product Type:</strong> Sneakers</li><li><strong>Model:</strong> 9060 Bricks & Wood</li><li><strong>Colorway:</strong> Beige/Grey/Green</li><li><strong>SKU:</strong> U9060BW1</li></ul>` },
  { id: 'P1-02', pid: '541646303557145', name: 'New Balance 9060 Ivory Cream Pink Sand',
    seoTitle: 'New Balance 9060 Ivory Cream Pink Sand U9060WCG Reps | Drip Sneakers',
    metaDesc: 'Shop New Balance 9060 Ivory Cream Pink Sand reps (U9060WCG) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This New Balance 9060 combines Ivory Cream, Pink Sand and Light Moonstone tones across the layered 9060 upper and sculpted sole.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/SNEAKERS"><strong>New Balance</strong></a></li><li><strong>Product Type:</strong> Sneakers</li><li><strong>Model:</strong> 9060</li><li><strong>Colorway:</strong> Ivory Cream/Pink Sand/Light Moonstone</li><li><strong>SKU:</strong> U9060WCG</li></ul>` },
  { id: 'P1-03', pid: '541579886672407', name: 'Represent Hermes Hoodie Purple',
    seoTitle: 'Represent Hermes Hoodie Purple MLM4230-057 Reps | Drip Sneakers',
    metaDesc: 'Shop Represent Hermes Hoodie Purple reps (MLM4230-057) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Represent Hermes Hoodie comes in Purple with high-density screen-print graphics on the front and back in an oversized heavyweight hoodie silhouette.</p>
<h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Hermes Hoodie</li><li><strong>Colorway:</strong> Purple</li><li><strong>SKU:</strong> MLM4230-057</li></ul>` },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const results = [];

  for (const fix of fixes) {
    try {
      console.log(`\n=== ${fix.id}: ${fix.name} ===`);
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${fix.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);

      // Update product name
      await page.locator('input[placeholder="请输入商品名称"]').fill(fix.name);

      // Click 编辑SEO
      await page.locator('text=编辑SEO').first().click();
      await page.waitForTimeout(1500);

      // Update SEO textareas
      const tas = await page.locator('textarea:visible').all();
      for (const ta of tas) {
        const val = await ta.inputValue();
        if (val.includes('Reps | Drip Sneakers')) await ta.fill(fix.seoTitle);
        else if (val.includes('QC photos') || val.includes('30-day') || val.includes('30-Day')) await ta.fill(fix.metaDesc);
      }

      // Update tinyMCE
      await page.evaluate((c) => { if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(c); }, fix.keyDesc);

      // Click drawer confirm (确定)
      await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
      await page.waitForTimeout(1500);

      // Click main save - use the working selector
      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(3000);

      // Check result
      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      const bodyText = await page.locator('body').innerText();
      const ok = toast.includes('成功') || bodyText.includes('保存成功');
      const err = toast.includes('错误') || bodyText.includes('-3') || bodyText.includes('不允许重复');
      
      if (ok) { console.log('  -> SUCCESS'); results.push({ id: fix.id, status: 'SUCCESS' }); }
      else if (err) { console.log('  -> ERROR:', toast.slice(0,100)); results.push({ id: fix.id, status: 'ERROR', msg: toast.slice(0,100) }); }
      else { console.log('  -> UNKNOWN:', toast.slice(0,100)); results.push({ id: fix.id, status: 'UNKNOWN', msg: toast.slice(0,100) }); }
    } catch(e) {
      console.log('  -> FATAL:', e.message.slice(0,150));
      results.push({ id: fix.id, status: 'FATAL', msg: e.message.slice(0,150) });
    }
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/v44-fix-results.json', JSON.stringify(results, null, 2));
  await browser.close();
  console.log('\n=== Summary ===');
  for (const r of results) console.log(`  ${r.id}: ${r.status}`);
}

main().catch(e => console.error('Fatal:', e));
