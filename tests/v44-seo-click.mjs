import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  console.log('start');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B541577396799253%5D', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  console.log('page loaded, URL:', page.url());

  // Click 编辑SEO
  const seoBtn = page.locator('text=编辑SEO').first();
  await seoBtn.click();
  await page.waitForTimeout(2000);
  console.log('after click, URL:', page.url());

  // Get page text
  const bodyText = await page.locator('body').innerText();
  // Find SEO-related section
  const idx = bodyText.indexOf('SEO');
  if (idx >= 0) {
    console.log('SEO section:', bodyText.slice(Math.max(0,idx-50), idx+500));
  }

  await browser.close();
  console.log('done');
}

main().catch(e => console.error('Fatal:', e));
