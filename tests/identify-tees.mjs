import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // CELINE/Prada T-shirts to identify via product images
  const products = [
    { name: 'CELINE Regular T-Shirt Black/Multicolor', url: 'https://www.dripsneakers.org/CELINE-Regular-T-Shirt-in-Cotton-Jersey-Black-Multicolor' },
    { name: 'Prada Cotton T-Shirt White', url: 'https://www.dripsneakers.org/Prada-Cotton-T-Shirt-White' },
    { name: 'Prada Milano Embroidered Logo T-Shirt Black', url: 'https://www.dripsneakers.org/Prada-Milano-Embroidered-Logo-T-Shirt-Black' },
    { name: 'Prada Milano Embroidered Logo T-Shirt White', url: 'https://www.dripsneakers.org/Prada-Milano-Embroidered-Logo-T-Shirt-White' },
  ];

  for (const p of products) {
    console.log(`\n=== ${p.name} ===`);
    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const title = await page.title();
      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => 'N/A');
      const h1 = await page.locator('h1').first().innerText().catch(() => 'N/A');
      const bodyText = await page.locator('body').innerText();

      console.log(`Title: ${title}`);
      console.log(`H1: ${h1}`);
      console.log(`Meta: ${metaDesc?.slice(0,120)}`);

      // Check for Product Details
      const hasDetails = bodyText.includes('Product Details');
      const liCount = (bodyText.match(/Brand:|Product Type:|Model:|Colorway:|SKU:|Material:|Fit:/g) || []).length;
      console.log(`Product Details block: ${hasDetails ? 'YES' : 'NO'}, fields: ${liCount}`);

      // Extract any SKU-like text
      const skuMatch = bodyText.match(/([A-Z0-9]{5,}[-][A-Z0-9]+[-][A-Z0-9]+)/);
      console.log(`SKU found on page: ${skuMatch?.[1] || 'none'}`);

      // Screenshot product area
      await page.screenshot({ path: `tests/img-${p.name.replace(/\s+/g,'-')}.png`, fullPage: false });
      console.log('Screenshot saved');

    } catch(e) {
      console.log(`ERROR: ${e.message.slice(0,80)}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
