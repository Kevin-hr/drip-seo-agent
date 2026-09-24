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

  await page.locator('text=编辑SEO').first().click();
  await page.waitForTimeout(2000);
  console.log('clicked SEO edit');

  // Get all visible input values
  const inputs = await page.locator('input:visible').evaluateAll(els => els.map(el => ({
    ph: el.placeholder,
    val: el.value
  })));
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].val || inputs[i].ph) {
      console.log(`In${i}: ph="${inputs[i].ph}" val="${inputs[i].val.slice(0,100)}"`);
    }
  }

  await browser.close();
  console.log('done');
}

main().catch(e => console.error('Fatal:', e));
