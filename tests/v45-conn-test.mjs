import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);
try {
  await page.goto('https://www.mrshopplus.com/#/product', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const result = await page.evaluate(async () => {
    const response = await fetch('/biz/DTB_proProduct/queryList', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ args: [{}, 0, 5], additions: { Stoke: true } })
    });
    const text = await response.text();
    let json; try { json = JSON.parse(text); } catch { return { status: response.status, nonJson: text.slice(0,200) }; }
    return { status: response.status, success: json.success, total: json.result?.total, rows: json.result?.data?.rows?.length, first: json.result?.data?.rows?.[0] ? { Id: json.result.data.rows[0].Id, Name: json.result.data.rows[0].Name, IsShow: json.result.data.rows[0].IsShow } : null };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}
