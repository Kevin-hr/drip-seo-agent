import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // Open P0-06 (Owners Club Script Hoodie Pink)
  await page.goto('about:blank');
  await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B541577396799253%5D', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Click 编辑SEO
  await page.locator('text=编辑SEO').first().click();
  await page.waitForTimeout(2000);

  // Get all visible inputs and textareas
  const fields = await page.evaluate(() => {
    const result = [];
    // Get all visible inputs
    document.querySelectorAll('input:visible, textarea:visible').forEach(el => {
      const label = el.closest('.el-form-item')?.querySelector('.el-form-item__label')?.textContent?.trim() || '';
      result.push({
        tag: el.tagName,
        label,
        placeholder: el.placeholder || '',
        value: el.value?.slice(0, 100) || '',
        className: el.className.slice(0, 80)
      });
    });
    return result;
  });

  for (const f of fields) {
    console.log(`[${f.tag}] label="${f.label}" ph="${f.placeholder}" val="${f.value}"`);
  }

  // Also get dialog text
  const dialogText = await page.locator('.el-dialog:visible, .el-drawer:visible').innerText().catch(() => 'no dialog');
  console.log('\nDialog text:\n', dialogText.slice(0, 500));

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
