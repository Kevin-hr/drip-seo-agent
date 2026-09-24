import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B541577396799253%5D', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Click 编辑SEO
  await page.locator('text=编辑SEO').first().click();
  await page.waitForTimeout(2000);

  // Get all inputs after expansion
  const inputs = await page.locator('input:visible').evaluateAll(els => 
    els.map(el => ({
      ph: el.placeholder || '',
      val: el.value?.slice(0, 120) || '',
      parent: el.closest('.el-form-item')?.querySelector('label, .el-form-item__label')?.textContent?.trim() || ''
    }))
  );

  console.log('=== Visible inputs ===');
  for (const inp of inputs) {
    if (inp.val || inp.ph) {
      console.log(`label="${inp.parent}" ph="${inp.ph}" val="${inp.val}"`);
    }
  }

  // Get textareas
  const textareas = await page.locator('textarea:visible').evaluateAll(els =>
    els.map(el => ({
      ph: el.placeholder || '',
      val: el.value?.slice(0, 150) || '',
      parent: el.closest('.el-form-item')?.querySelector('label, .el-form-item__label')?.textContent?.trim() || ''
    }))
  );
  console.log('\n=== Visible textareas ===');
  for (const ta of textareas) {
    console.log(`label="${ta.parent}" ph="${ta.ph}" val="${ta.val}"`);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
