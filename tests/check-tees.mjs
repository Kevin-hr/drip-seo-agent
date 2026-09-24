import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const products = [
    { pid: '536027553308699', name: 'CELINE Regular T-Shirt' },
    { pid: '536027553279506', name: 'Prada Cotton T-Shirt White' },
    { pid: '536027553230614', name: 'Prada Milano Embroidered Black' },
    { pid: '536027553199636', name: 'Prada Milano Embroidered White' },
  ];

  for (const p of products) {
    await page.goto('about:blank');
    await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const name = await page.locator('input[placeholder="请输入商品名称"]').inputValue().catch(() => 'N/A');
    const slug = await page.locator('input[placeholder*="URL"], input[placeholder*="url"]').inputValue().catch(() => 'N/A');

    // Check IsShow toggle
    const isShow = await page.evaluate(() => {
      const sw = document.querySelector('.el-switch.is-checked');
      return sw ? 'ON' : 'OFF';
    });

    // Get SEO slug from drawer
    await page.locator('text=编辑SEO').first().click();
    await page.waitForTimeout(1000);
    const tas = await page.locator('textarea:visible').all();
    const slugVal = tas.length >= 4 ? await tas[3].inputValue() : 'N/A';
    console.log(`${p.name}:`);
    console.log(`  Name: ${name}`);
    console.log(`  IsShow: ${isShow}`);
    console.log(`  URL Slug: ${slugVal}`);

    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
