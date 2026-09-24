import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  console.log('start');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B541665286797340%5D', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('page loaded');

  // Get all text content from the page
  const bodyText = await page.locator('body').innerText();
  // Find SEO-related sections
  const lines = bodyText.split('\n').filter(l => l.trim());
  for (const line of lines) {
    if (/seo|优化|标题|关键字|描述|meta|slug|url|链接/i.test(line)) {
      console.log('SEO LINE:', line.trim());
    }
  }

  await browser.close();
  console.log('done');
}

main().catch(e => console.error('Fatal:', e));
