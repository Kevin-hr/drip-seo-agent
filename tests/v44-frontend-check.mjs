import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // Check 3 products on the live site
  const urls = [
    'https://www.dripsneakers.org/Represent-Owners-Club-Script-Hoodie-Pink',
    'https://www.dripsneakers.org/Vale-Forever-Classico-Zip-Up-Hoodie-Sapphire',
    'https://www.dripsneakers.org/New-Balance-9060-Grey-Lilac-U9060GM',
  ];

  for (const url of urls) {
    console.log(`\n=== ${url} ===`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      const title = await page.title();
      console.log(`Title: ${title}`);

      // Check meta description
      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => 'NOT FOUND');
      console.log(`Meta: ${metaDesc?.slice(0,120)}`);

      // Check meta keywords
      const metaKw = await page.locator('meta[name="keywords"]').getAttribute('content').catch(() => 'NOT FOUND');
      console.log(`Keywords: ${metaKw?.slice(0,120)}`);

      // Get H1
      const h1 = await page.locator('h1').first().innerText().catch(() => 'NO H1');
      console.log(`H1: ${h1}`);

      // Check for Product Details
      const bodyText = await page.locator('body').innerText();
      const hasProductDetails = bodyText.includes('Product Details');
      const liCount = (bodyText.match(/Brand:|Product Type:|Model:|Colorway:|SKU:|Closure:/g) || []).length;
      console.log(`Has "Product Details": ${hasProductDetails}, detail fields found: ${liCount}`);

      // Check for old wrong content
      if (url.includes('Pink')) {
        const hasBlack = bodyText.includes('Owners Club Hoodie Black');
        console.log(`Old "Black" content present: ${hasBlack}`);
      }
      if (url.includes('Sapphire')) {
        const hasOrange = bodyText.includes('Orange');
        console.log(`Old "Orange" content present: ${hasOrange}`);
      }
    } catch(e) {
      console.log(`ERROR: ${e.message.slice(0,100)}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
