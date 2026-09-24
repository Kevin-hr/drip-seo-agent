import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Test a few IDs
  const testIds = ['536027409873434', '536027069472543', '536027047870230', '536027047869464'];
  for (const pid of testIds) {
    await page.goto('about:blank');
    await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${pid}%5D`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const pname = await page.locator('input[placeholder="请输入商品名称"]').inputValue().catch(() => 'EMPTY');
    console.log(`${pid}: "${pname}"`);
  }
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
