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
  console.log('loaded');

  const bodyText = await page.locator('body').innerText();
  console.log('body length:', bodyText.length);

  // Find SEO section
  const idx = bodyText.indexOf('编辑SEO');
  if (idx >= 0) {
    console.log('Context around 编辑SEO:');
    console.log(bodyText.slice(Math.max(0, idx-200), idx+500));
  }

  // Find 关键描述
  const idx2 = bodyText.indexOf('关键描述');
  if (idx2 >= 0) {
    console.log('\nContext around 关键描述:');
    console.log(bodyText.slice(Math.max(0, idx2-100), idx2+500));
  }

  await browser.close();
  console.log('done');
}

main().catch(e => console.error('Fatal:', e));
