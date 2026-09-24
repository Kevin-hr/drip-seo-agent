import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

const id = '536027371831825';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });
await page.waitForTimeout(2000);

// Find all form items with "上架" or "IsShow"
const info = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.el-form-item')];
  return items.filter(el => /上架|IsShow|显示|发布/i.test(el.textContent || '')).map(el => ({
    label: el.querySelector('.el-form-item__label')?.textContent?.trim(),
    html: el.innerHTML.slice(0, 500)
  }));
});
console.log(JSON.stringify(info, null, 2));

// Also check all switches
const switches = await page.evaluate(() => {
  return [...document.querySelectorAll('.el-switch, [role=switch]')].map(el => ({
    checked: el.classList.contains('is-checked') || el.getAttribute('aria-checked'),
    label: el.closest('.el-form-item')?.querySelector('.el-form-item__label')?.textContent?.trim()
  }));
});
console.log('Switches:', JSON.stringify(switches, null, 2));
await browser.close();
