import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Get #09 product ID from page
  await page.goto('https://www.dripsneakers.org/Chanel-CC-Logo-Sneaker-Black-White', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Look for product ID in page source/network
  const pageData = await page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    // Look for productId pattern
    const idMatch = html.match(/productId["\s:=]+(\d{10,})/i) || html.match(/product_id["\s:=]+(\d{10,})/i) || html.match(/"id":(\d{10,})/);
    // Look for any long number that could be a product ID
    const allIds = html.match(/\b5\d{14}\b/g) || [];
    return { idMatch: idMatch?.[1], allIds: [...new Set(allIds)].slice(0, 10) };
  });

  console.log('Page data:', JSON.stringify(pageData, null, 2));

  // Also check network requests for API calls
  const requests = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(r => r.name.includes('api') || r.name.includes('product'))
    .map(r => r.name).slice(0, 10));
  console.log('\nAPI requests:', requests);

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
