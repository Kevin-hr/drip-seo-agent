import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

// Verify which IDs are correct by checking backend
const candidates = {
  'AJ4 Black Cat': ['541217785801492', '541217782556189', '541217777969947'],
  'AF1 OW MCA': ['536027048029457', '536027048015637'],
  'AF1 Travis Sail': ['536027047870230', '536027047869464'],
};

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  for (const [name, ids] of Object.entries(candidates)) {
    for (const pid of ids) {
      try {
        await page.goto('about:blank');
        await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${pid}%5D`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2500);
        const pname = await page.locator('input[placeholder="请输入商品名称"]').inputValue().catch(() => '');
        console.log(`${name} -> ${pid}: "${pname}"`);
      } catch(e) {
        console.log(`${name} -> ${pid}: ERROR`);
      }
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
