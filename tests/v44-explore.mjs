import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  console.log('Starting...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  console.log('Browser launched');
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  try {
    console.log('Navigating...');
    await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('Loaded URL:', page.url());
    console.log('Title:', await page.title());
    await page.waitForTimeout(2000);
    const txt = await page.locator('body').innerText().catch(() => 'ERR');
    console.log('Body:', txt.slice(0, 300));
  } catch(e) {
    console.log('Error:', e.message);
  }

  await browser.close();
  console.log('Done');
}

main().catch(e => console.error('Fatal:', e));
