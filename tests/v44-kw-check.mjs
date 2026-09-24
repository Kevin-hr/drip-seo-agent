import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // Check P0-06 (the one with wrong keywords on frontend)
  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B541577396799253%5D', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  await page.locator('text=编辑SEO').first().click();
  await page.waitForTimeout(1500);

  // Get all textarea values with their labels
  const fields = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('textarea').forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // Find label
        let label = '';
        let parent = el.closest('.el-form-item');
        if (parent) {
          label = parent.querySelector('.el-form-item__label')?.textContent?.trim() || '';
        }
        result.push({ idx: i, label, value: el.value.slice(0, 100) });
      }
    });
    return result;
  });

  console.log('Visible textareas in SEO drawer:');
  for (const f of fields) {
    console.log(`  TA${f.idx} [label="${f.label}"]: "${f.value}"`);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
