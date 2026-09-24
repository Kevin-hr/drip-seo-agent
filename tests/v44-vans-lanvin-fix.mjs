import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

// Vans/Lanvin P1-REPAIR: rebuild Key Description with 5 fields + internal link + clear Description
const products = [
  // Vans - known SKUs
  { pid: '537857924775443', name: 'Vans Old Skool 36 LX Pearlized Black Navy',
    brand: 'Vans', brandUrl: '/Vans/', type: 'Sneakers', model: 'Old Skool 36 LX', color: 'Black Navy', sku: 'VN000E8VYA6',
    desc: 'This Vans Old Skool 36 LX features a Pearlized Black Navy colorway with the classic side stripe and padded collar.' },
  { pid: '537857924179476', name: 'Vans Classic Slip-On Checkerboard Black White',
    brand: 'Vans', brandUrl: '/Vans/', type: 'Sneakers', model: 'Classic Slip-On', color: 'Checkerboard Black White', sku: 'VN000EYEBWW',
    desc: 'This Vans Classic Slip-On features the iconic checkerboard print in Black and White with the signature vulcanized sole.' },
  { pid: '537857924065307', name: 'Vans Sk8-Hi Navy',
    brand: 'Vans', brandUrl: '/Vans/', type: 'Sneakers', model: 'Sk8-Hi', colorway: 'Navy', sku: 'VN000D5INVY',
    desc: 'This Vans Sk8-Hi comes in Navy suede and canvas with the iconic jazz stripe and padded ankle collar.' },
  { pid: '537857924002841', name: 'Vans Sk8-Hi Black White',
    brand: 'Vans', brandUrl: '/Vans/', type: 'Sneakers', model: 'Sk8-Hi', colorway: 'Black White', sku: 'VN000D5IB8C',
    desc: 'This Vans Sk8-Hi features a Black and White colorway with suede toe cap and the classic side stripe.' },
  { pid: '537857923921439', name: 'Vans Authentic Black White',
    brand: 'Vans', brandUrl: '/Vans/', type: 'Sneakers', model: 'Authentic', colorway: 'Black White', sku: 'VN000EE3BLK',
    desc: 'This Vans Authentic comes in a Black and White canvas upper with the signature rubber waffle outsole.' },
  { pid: '537857924370714', name: 'Vans Old Skool 36 LX Souvenir Warm Brown',
    brand: 'Vans', brandUrl: '/Vans/', type: 'Sneakers', model: 'Old Skool 36 LX Souvenir', colorway: 'Warm Brown', sku: '',
    desc: 'This Vans Old Skool 36 LX Souvenir features a Warm Brown colorway with heritage detailing on the side stripe.' },
  { pid: '537857924307218', name: 'Vans Old Skool 36 LX Souvenir Black',
    brand: 'Vans', brandUrl: '/Vans/', type: 'Sneakers', model: 'Old Skool 36 LX Souvenir', colorway: 'Black', sku: '',
    desc: 'This Vans Old Skool 36 LX Souvenir comes in Black with heritage embroidery and premium suede construction.' },
  // Lanvin Curb - known SKU for White
  { pid: '536804652923675', name: 'Lanvin Curb Sneakers White',
    brand: 'Lanvin', brandUrl: '/Lanvin/', type: 'Sneakers', model: 'Curb', colorway: 'White', sku: 'FM-SKRK11-DRAG-H220000',
    desc: 'This Lanvin Curb sneaker features a White leather and mesh upper with the chunky tongue and oversized lacing system.' },
  { pid: '536804618383129', name: 'Lanvin Curb Sneakers Speckled Effect Light Grey',
    brand: 'Lanvin', brandUrl: '/Lanvin/', type: 'Sneakers', model: 'Curb', colorway: 'Speckled Light Grey', sku: '',
    desc: 'This Lanvin Curb sneaker features a Speckled Light Grey colorway with the signature chunky silhouette.' },
  { pid: '536802388758558', name: 'Lanvin Curb Sneakers White Anthracite',
    brand: 'Lanvin', brandUrl: '/Lanvin/', type: 'Sneakers', model: 'Curb', colorway: 'White Anthracite', sku: '',
    desc: 'This Lanvin Curb sneaker combines White and Anthracite tones with the signature thick sole and oversized laces.' },
  { pid: '536797843031833', name: 'Lanvin Curb Sneakers Beige White Tan',
    brand: 'Lanvin', brandUrl: '/Lanvin/', type: 'Sneakers', model: 'Curb', colorway: 'Beige White Tan', sku: '',
    desc: 'This Lanvin Curb sneaker features a Beige, White and Tan colorway with mixed materials and the chunky Curb silhouette.' },
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
      await page.waitForTimeout(3500);

      // Build Key Description HTML with exactly 5 Product Details
      const skuLi = p.sku ? `<li><strong>SKU:</strong> ${p.sku}</li>` : '';
      const keyDesc = `<p>${p.desc}</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org${p.brandUrl}"><strong>${p.brand}</strong></a></li><li><strong>Product Type:</strong> ${p.type}</li><li><strong>Model:</strong> ${p.model}</li><li><strong>Colorway:</strong> ${p.colorway || p.color}</li>${skuLi}</ul>`;

      // Set Editor 0 = Key Description, Editor 1 = empty (image-only)
      await page.evaluate((kd) => {
        if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(kd);
        if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent('');
      }, keyDesc);
      console.log('  Editors set (5 fields, internal link, Description cleared)');

      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(2500);

      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      console.log(`  -> ${toast.includes('成功') ? 'OK' : toast.slice(0,60)}`);
    } catch(e) {
      console.log(`  -> FAIL: ${e.message.slice(0,80)}`);
    }
  }

  // Retry failed Jordan 11 285
  console.log('\n=== Retry: Air Jordan 11 Retro 285 ===');
  try {
    await page.goto('about:blank');
    await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B536027557923610%5D', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.evaluate(() => { if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent(''); });
    await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
    await page.waitForTimeout(3000);
    const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
    console.log(`  -> ${toast.includes('成功') ? 'OK' : toast.slice(0,60)}`);
  } catch(e) {
    console.log(`  -> FAIL: ${e.message.slice(0,80)}`);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
