import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // Go to product list
  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('URL:', page.url());

  // Find search input and type product name
  const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="请输入"], input.el-input__inner').first();
  const count = await searchInput.count();
  console.log('Search input count:', count);

  // List all visible inputs
  const inputs = await page.locator('input:visible').all();
  for (let i = 0; i < inputs.length; i++) {
    const ph = await inputs[i].getAttribute('placeholder').catch(() => '');
    const val = await inputs[i].inputValue().catch(() => '');
    console.log(`Input ${i}: placeholder="${ph}" value="${val}"`);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
