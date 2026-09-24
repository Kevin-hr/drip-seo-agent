import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const fixes = [
  { id: 'P0-03', pid: '541579345303579', keywords: 'Represent Luggage Tag Hoodie Antique White, Represent Luggage Tag Hoodie, MLM4686-242, Represent Hoodie Reps, Antique White Hoodie',
    keyDesc: `<p>This Represent Luggage Tag Hoodie comes in Antique White with luggage-tag graphics across the front and back in a heavyweight oversized hoodie construction.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Luggage Tag Hoodie</li><li><strong>Colorway:</strong> Antique White</li><li><strong>SKU:</strong> MLM4686-242</li></ul>` },
  { id: 'P0-06', pid: '541577396799253', keywords: 'Represent Owners Club Script Hoodie Pink, Represent Script Hoodie Pink, OCM41200-518, Represent Hoodie Reps, Owners Club Script Hoodie',
    keyDesc: `<p>This Represent Owners Club Script Hoodie uses a Pink colorway with the Owners Club script identity across the heavyweight cotton hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owners Club Script Hoodie</li><li><strong>Colorway:</strong> Pink</li><li><strong>SKU:</strong> OCM41200-518</li></ul>` },
  { id: 'P0-07', pid: '541577273184028', keywords: 'Represent Owners Club Script Hoodie Black, Represent Script Hoodie Black, OCM41200-001, Represent Hoodie Reps, Owners Club Script Hoodie',
    keyDesc: `<p>This Represent Owners Club Script Hoodie comes in Black with the Owners Club script identity across the heavyweight cotton hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owners Club Script Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>SKU:</strong> OCM41200-001</li></ul>` },
  { id: 'P0-08', pid: '541576660608030', keywords: 'Represent Owners Club Hoodie Ash Grey Black, Represent Owners Club Hoodie, M04153-302, Represent Hoodie Reps, Ash Grey Black Hoodie',
    keyDesc: `<p>This Represent Owners Club Hoodie uses an Ash Grey base with contrasting Black Owners Club branding in the oversized cotton hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owners Club Hoodie</li><li><strong>Colorway:</strong> Ash Grey/Black</li><li><strong>SKU:</strong> M04153-302</li></ul>` },
  { id: 'P0-09', pid: '541574614856220', keywords: "Represent Owners Club Hoodie Brown White, Represent Owner's Club Hoodie, M04153-04, Represent Hoodie Reps, Brown White Hoodie",
    keyDesc: `<p>This Represent Owner's Club Hoodie combines a Brown base with White Owners Club branding in the oversized hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owner's Club Hoodie</li><li><strong>Colorway:</strong> Brown/White</li><li><strong>SKU:</strong> M04153-04</li></ul>` },
  { id: 'P0-10', pid: '541574389001757', keywords: 'Represent Patron of The Club Hoodie Black, Represent Patron Hoodie, MLM4270-001, Represent Hoodie Reps, Patron of The Club Black',
    keyDesc: `<p>This Represent Patron of The Club Hoodie comes in Black with Patron of The Club graphic branding across the cotton hoodie construction.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Patron of The Club Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>SKU:</strong> MLM4270-001</li></ul>` },
  { id: 'P0-11', pid: '541573975406101', keywords: 'Represent Owners Club Hoodie Black, Represent Owners Club Hoodie, OCM41113-001, Represent Hoodie Reps, Represent Black Hoodie',
    keyDesc: `<p>This Represent Owners Club Hoodie comes in Black with the signature Owners Club branding in the brand's oversized hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Owners Club Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>SKU:</strong> OCM41113-001</li></ul>` },
  { id: 'P0-12', pid: '541572937470224', keywords: 'Vale Forever Classico Zip Up Hoodie Sapphire, Vale Forever Hoodie, Classico Zip Up Hoodie, Sapphire Zip Hoodie, Vale Forever Reps',
    keyDesc: `<p>This Vale Forever Classico hoodie uses a Sapphire colorway with a full-zip front in the Classico zip-up silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Vale Forever</strong></a></li><li><strong>Product Type:</strong> Zip-Up Hoodie</li><li><strong>Model:</strong> Classico Zip Up Hoodie</li><li><strong>Colorway:</strong> Sapphire</li><li><strong>Closure:</strong> Full Zip</li></ul>` },
  { id: 'P0-13', pid: '541572560539930', keywords: 'Vale Forever Classico Zip Up Hoodie White, Vale Forever Hoodie, Classico Zip Up Hoodie, White Zip Hoodie, Vale Forever Reps',
    keyDesc: `<p>This Vale Forever Classico hoodie uses a White colorway with a full-zip front in the Classico zip-up silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Vale Forever</strong></a></li><li><strong>Product Type:</strong> Zip-Up Hoodie</li><li><strong>Model:</strong> Classico Zip Up Hoodie</li><li><strong>Colorway:</strong> White</li><li><strong>Closure:</strong> Full Zip</li></ul>` },
  { id: 'P0-14', pid: '541572053325584', keywords: 'Vale Forever Classico Zip Up Hoodie Black, Vale Forever Hoodie, Classico Zip Up Hoodie, Black Zip Hoodie, Vale Forever Reps',
    keyDesc: `<p>This Vale Forever Classico hoodie uses a Black colorway with a full-zip front in the Classico zip-up silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Vale Forever</strong></a></li><li><strong>Product Type:</strong> Zip-Up Hoodie</li><li><strong>Model:</strong> Classico Zip Up Hoodie</li><li><strong>Colorway:</strong> Black</li><li><strong>Closure:</strong> Full Zip</li></ul>` },
  { id: 'P1-01', pid: '541648130634781', keywords: 'New Balance 9060 Bricks & Wood, Bricks & Wood 9060, U9060BW1, New Balance 9060 Reps, 9060 Sneaker Reps',
    keyDesc: `<p>This New Balance 9060 Bricks & Wood collaboration combines Beige, Grey and Green tones across the layered 9060 construction.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/SNEAKERS"><strong>New Balance</strong></a></li><li><strong>Product Type:</strong> Sneakers</li><li><strong>Model:</strong> 9060 Bricks & Wood</li><li><strong>Colorway:</strong> Beige/Grey/Green</li><li><strong>SKU:</strong> U9060BW1</li></ul>` },
  { id: 'P1-02', pid: '541646303557145', keywords: 'New Balance 9060 Ivory Cream Pink Sand, New Balance 9060 Reps, U9060WCG, Ivory Cream Pink Sand 9060, 9060 Sneaker Reps',
    keyDesc: `<p>This New Balance 9060 combines Ivory Cream, Pink Sand and Light Moonstone tones across the layered 9060 upper and sculpted sole.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/SNEAKERS"><strong>New Balance</strong></a></li><li><strong>Product Type:</strong> Sneakers</li><li><strong>Model:</strong> 9060</li><li><strong>Colorway:</strong> Ivory Cream/Pink Sand/Light Moonstone</li><li><strong>SKU:</strong> U9060WCG</li></ul>` },
  { id: 'P1-03', pid: '541579886672407', keywords: 'Represent Hermes Hoodie Purple, Represent Hermes Hoodie, MLM4230-057, Represent Hoodie Reps, Purple Represent Hoodie',
    keyDesc: `<p>This Represent Hermes Hoodie comes in Purple with high-density screen-print graphics on the front and back in an oversized heavyweight hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Hermes Hoodie</li><li><strong>Colorway:</strong> Purple</li><li><strong>SKU:</strong> MLM4230-057</li></ul>` },
  // Also fix the already-correct ones with keywords
  { id: 'P0-01', pid: '541665286797340', keywords: 'New Balance 9060 Grey Lilac, New Balance 9060 Reps, U9060GM, New Balance Grey 9060, 9060 Sneaker Reps',
    keyDesc: `<p>This New Balance 9060 features a tonal grey upper with the sculpted 9060 sole and layered performance-inspired construction.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/SNEAKERS"><strong>New Balance</strong></a></li><li><strong>Product Type:</strong> Sneakers</li><li><strong>Model:</strong> 9060</li><li><strong>Colorway:</strong> Grey/Grey</li><li><strong>SKU:</strong> U9060GM</li></ul>` },
  { id: 'P0-02', pid: '541580216648219', keywords: 'Represent Hermes Hoodie Jet Black, Represent Hermes Hoodie, MLM4230-001, Represent Hoodie Reps, Jet Black Hoodie',
    keyDesc: `<p>This Represent Hermes Hoodie comes in Jet Black with high-density screen-print graphics on the front and back in an oversized heavyweight hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Hermes Hoodie</li><li><strong>Colorway:</strong> Jet Black</li><li><strong>SKU:</strong> MLM4230-001</li></ul>` },
  { id: 'P0-04', pid: '541579123484953', keywords: 'Represent Luggage Tag Hoodie Jet Black, Represent Luggage Tag Hoodie, MLM4686-001, Represent Hoodie Reps, Jet Black Hoodie',
    keyDesc: `<p>This Represent Luggage Tag Hoodie comes in Jet Black with luggage-tag graphics across the front and back in a heavyweight oversized hoodie construction.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Luggage Tag Hoodie</li><li><strong>Colorway:</strong> Jet Black</li><li><strong>SKU:</strong> MLM4686-001</li></ul>` },
  { id: 'P0-05', pid: '541578922851864', keywords: 'Represent Keys To The Club Hood Black, Represent Keys To The Club Hoodie, MLM4240-001, Represent Hoodie Reps, Jet Black Represent Hoodie',
    keyDesc: `<p>This Represent Keys To The Club hoodie uses a Jet Black base with layered graphic treatments across the design while retaining the oversized Represent hoodie silhouette.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li><li><strong>Product Type:</strong> Hoodie</li><li><strong>Model:</strong> Keys To The Club Hoodie</li><li><strong>Colorway:</strong> Jet Black</li><li><strong>SKU:</strong> MLM4240-001</li></ul>` },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const results = [];

  for (const fix of fixes) {
    try {
      console.log(`\n=== ${fix.id} ===`);
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${fix.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);

      // Click 编辑SEO
      await page.locator('text=编辑SEO').first().click();
      await page.waitForTimeout(1500);

      // Fill all 4 textareas: TA0=keywords, TA1=SEO title, TA2=meta desc, TA3=URL slug
      const tas = await page.locator('textarea:visible').all();
      for (let i = 0; i < tas.length; i++) {
        const val = await tas[i].inputValue();
        if (i === 0) {
          // Keywords field - fill it
          await tas[i].fill(fix.keywords);
          console.log(`  TA0 (keywords) filled: ${fix.keywords.slice(0,40)}...`);
        }
      }

      // Update BOTH tinyMCE editors
      await page.evaluate((content) => {
        if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(content);
        if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent(content);
      }, fix.keyDesc);
      console.log('  Both editors updated');

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
      results.push({ id: fix.id, status: ok ? 'SUCCESS' : 'UNKNOWN' });
    } catch(e) {
      console.log(`  -> FATAL: ${e.message.slice(0,100)}`);
      results.push({ id: fix.id, status: 'FATAL' });
    }
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/v44-murphy-fix-results.json', JSON.stringify(results, null, 2));
  await browser.close();
  console.log('\n=== Summary ===');
  for (const r of results) console.log(`  ${r.id}: ${r.status}`);
}

main().catch(e => console.error('Fatal:', e));
