import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const products = [
  { pid: '536027409873434', brand: 'Fear of God', brandUrl: '/Fear-of-God/', type: 'Hoodie Set', model: 'Essentials SS21 Hoodie & Sweatpants Set', color: 'Black', sku: '', desc: 'Fear of God Essentials SS21 fleece hoodie and sweatpants set in black with signature boxy fit and rubber logo patch.' },
  { pid: '536027071047455', brand: 'adidas', brandUrl: '/adidas/', type: 'Sneakers', model: 'Ultra Boost Tech Ink Glow Blue', color: 'Tech Ink / Glow Blue', sku: 'GX7315', desc: 'adidas Ultra Boost in Tech Ink with Glow Blue Boost midsole, featuring Primeknit upper and Continental rubber outsole.' },
  { pid: '536027070918425', brand: 'adidas', brandUrl: '/adidas/', type: 'Sneakers', model: 'Ultra Boost All Terrain Black Red Grey', color: 'Black / Red / Grey', sku: 'FV6034', desc: 'adidas Ultra Boost All Terrain in Black Red Grey with rugged outsole for wet weather and Continental grip.' },
  { pid: '536027070790684', brand: 'adidas', brandUrl: '/adidas/', type: 'Sneakers', model: 'Ultra Boost All Terrain Shock Red Yellow', color: 'Shock Red / Yellow', sku: 'EG8089', desc: 'adidas Ultra Boost All Terrain in Shock Red Yellow with Primeknit upper and BOOST cushioning.' },
  { pid: '536027069472543', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'SB Dunk Low Pink Pig', color: 'Pink / Black', sku: 'CV1628-600', desc: 'Nike SB Dunk Low Pink Pig featuring a pink suede upper with black overlays and white midsole.' },
  { pid: '536027068090142', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Dunk Low Community Garden', color: 'Multi-Color', sku: 'CZ2239-600', desc: 'Nike Dunk Low Community Garden with vibrant multi-color overlays representing community unity.' },
  { pid: '536027066913045', brand: 'adidas', brandUrl: '/adidas/', type: 'Sneakers', model: 'Ultra Boost OG 2018', color: 'Core Black', sku: 'BB6220', desc: 'adidas Ultra Boost OG 2018 reissue with Primeknit upper, BOOST midsole and Continental rubber outsole.' },
  { pid: '536027061869595', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'SB Dunk Low Veneer', color: 'Veneer / Green', sku: 'BQ6817-300', desc: 'Nike SB Dunk Low Veneer in green and brown suede with iconic panda-style color blocking.' },
  { pid: '536027061820952', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'SB Dunk High Atlas Lost at Sea', color: 'Multi-Color', sku: 'DH6688-600', desc: 'Nike SB Dunk High Atlas Lost at Sea collaboration with wave-inspired print and nautical colorway.' },
  { pid: '536027061612060', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Yin Yang', color: 'Black / White', sku: 'CZ3243-001', desc: 'Nike Air Force 1 Low Yin Yang split in black and white leather with contrasting Swoosh.' },
  { pid: '536027061226000', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 07 MID White', color: 'White', sku: 'CW2289-111', desc: 'Nike Air Force 1 07 Mid in all-white leather with perforated toe box and Nike Air heel unit.' },
  { pid: '536027061176604', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Mid Utility University Red', color: 'White / University Red', sku: 'DJ9158-600', desc: 'Nike Air Force 1 Mid Utility in white leather with University Red accents and strap detail.' },
  { pid: '536027061131037', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Mid LV8 Cool Grey', color: 'Cool Grey', sku: 'DC1429-003', desc: 'Nike Air Force 1 Mid LV8 in Cool Grey suede and leather with tonal Swoosh and tongue label.' },
  { pid: '536027061064987', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Be True Rainbow', color: 'Rainbow Multicolor', sku: 'DD3028-600', desc: 'Nike Air Force 1 Low Be True with rainbow gradient design celebrating LGBTQ+ pride.' },
  { pid: '536027060792857', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 High Flax', color: 'Flax / Wheat', sku: 'CJ9178-200', desc: 'Nike Air Force 1 High Flax in wheat-colored suede gum rubber outsole and metal lace locks.' },
  { pid: '536027060743189', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Mid Flax', color: 'Flax / Wheat', sku: 'CJ9178-200', desc: 'Nike Air Force 1 Mid Flax in wheat suede with gum rubber outsole and padded ankle collar.' },
  { pid: '536027060647446', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Flyleather Ruohan Wang', color: 'Multi-Color', sku: 'CZ3970-900', desc: 'Nike Air Force 1 Flyleather Ruohan Wang collaboration with eco-friendly leather and bold graphic print.' },
  { pid: '536027060486165', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Good Game', color: 'White / Red', sku: 'DC0808-100', desc: 'Nike Air Force 1 Low Good Game in white leather with red heel tab and gaming-inspired details.' },
  { pid: '536027060420882', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Flax 2019', color: 'Flax / Wheat', sku: 'CJ9178-200', desc: 'Nike Air Force 1 Low Flax 2019 wheat suede with gum outsole and tonal stitching.' },
  { pid: '536027060229657', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Stussy Black', color: 'Black', sku: 'CT2279-001', desc: 'Nike Air Force 1 Low Stussy Black collaboration with fuzzy Swoosh and Stussy tongue branding.' },
  { pid: '536027047820052', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Travis Scott White', color: 'White', sku: 'CN2405-100', desc: 'Nike Air Force 1 Low Travis Scott White with reversed Swoosh and Cactus Jack heel embroidery.' },
  { pid: '536027047692828', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Fragment Clot White', color: 'White', sku: 'CZ0790-100', desc: 'Nike Air Force 1 Low Fragment Clot White collaboration with silk-inspired details and double branding.' },
  { pid: '536027047613718', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Fragment Clot Black', color: 'Black', sku: 'CZ0790-001', desc: 'Nike Air Force 1 Low Fragment Clot Black collaboration with black silk and Fragment design branding.' },
  { pid: '536027047548438', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Clot Blue Silk', color: 'Blue', sku: 'AO9389-800', desc: 'Nike Air Force 1 Low Clot Blue Silk collaboration with silk brocade upper and translucent Swoosh.' },
  { pid: '536027047435798', brand: 'Nike', brandUrl: '/Nike/', type: 'Sneakers', model: 'Air Force 1 Low Clot Rose Gold Silk', color: 'Rose Gold', sku: 'AO9389-600', desc: 'Nike Air Force 1 Low Clot Rose Gold Silk collaboration with rose gold silk upper and jade Swoosh detail.' },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  let ok = 0, fail = 0;
  for (const p of products) {
    try {
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);

      const pname = await page.locator('input[placeholder="请输入商品名称"]').inputValue().catch(() => '');
      console.log(`Processing: ${pname.slice(0,45)}`);

      // Open SEO drawer
      await page.locator('text=编辑SEO').first().click();
      await page.waitForTimeout(1200);

      const tas = await page.locator('textarea:visible').all();
      if (tas.length >= 4) {
        const fullName = pname || p.model;
        await tas[0].fill(`${fullName}, ${p.brand} ${p.model.toLowerCase()}, ${p.color} ${p.type.toLowerCase()}s, ${p.sku}, ${p.brand.toLowerCase()} reps`);
        await tas[1].fill(`${fullName} Reps | Drip Sneakers`);
        await tas[2].fill(`Shop ${fullName} reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.`);
      }

      const skuLi = p.sku ? `<li><strong>SKU:</strong> ${p.sku}</li>` : '';
      const keyDesc = `<p>${p.desc}</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org${p.brandUrl}"><strong>${p.brand}</strong></a></li><li><strong>Product Type:</strong> ${p.type}</li><li><strong>Model:</strong> ${p.model}</li><li><strong>Colorway:</strong> ${p.color}</li>${skuLi}</ul>`;

      await page.evaluate((kd) => {
        if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(kd);
        if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent('');
      }, keyDesc);

      await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
      await page.waitForTimeout(1200);
      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(2500);

      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      if (toast.includes('成功') || toast.includes('Success')) { ok++; console.log('  OK'); }
      else { fail++; console.log(`  -> ${toast.slice(0,60)}`); }
    } catch(e) {
      fail++;
      console.log(`  FAIL: ${e.message.slice(0,60)}`);
    }
  }

  console.log(`\n=== Done: ${ok} OK, ${fail} FAIL ===`);
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
