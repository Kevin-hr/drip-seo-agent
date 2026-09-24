import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click on "New Balance 9060 Grey Lilac" link
  await page.locator('text=New Balance 9060 Grey Lilac').first().click();
  await page.waitForTimeout(3000);

  console.log('Edit page URL:', page.url());

  // Get all input fields on the edit page
  const inputs = await page.locator('input:visible, textarea:visible').all();
  for (let i = 0; i < inputs.length; i++) {
    const ph = await inputs[i].getAttribute('placeholder').catch(() => '');
    const val = await inputs[i].inputValue().catch(() => '');
    const name = await inputs[i].getAttribute('name').catch(() => '');
    console.log(`Input ${i}: name="${name}" placeholder="${ph}" value="${val.slice(0,80)}"`);
  }

  // Check for tinyMCE
  const tinyMCEcount = await page.evaluate(() => (typeof tinyMCE !== 'undefined') ? tinyMCE.editors.length : 0);
  console.log('TinyMCE editors:', tinyMCEcount);

  if (tinyMCEcount > 0) {
    for (let i = 0; i < tinyMCEcount; i++) {
      const content = await page.evaluate((idx) => tinyMCE.editors[idx].getContent(), i);
      console.log(`Editor ${i} content (first 200):`, content.slice(0, 200));
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
