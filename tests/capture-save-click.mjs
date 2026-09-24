import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);

const calls = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('/biz/')) calls.push({ method: req.method(), url: u, postData: req.postData() || '' });
});

await page.goto('https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B536027542618399%5D', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);

// click the save button (bottom of form)
const btns = await page.locator('button:visible').allInnerTexts();
console.log('buttons:', btns.filter(t=>/保存|Save|提交/.test(t)).slice(0,8));
try {
  const saveBtn = page.locator('button:visible').filter({ hasText: /保存/ }).last();
  await saveBtn.click();
  await page.waitForTimeout(4000);
  console.log('\nrequests after save click:');
  for (const c of calls) {
    if (c.url.includes('saveModify') || c.url.includes('Seo') || c.url.includes('Redirect')) {
      console.log('---', c.method, c.url.replace('https://www.mrshopplus.com',''));
      console.log('   body:', c.postData.slice(0, 600));
    }
  }
  const toast = await page.locator('.el-message').innerText().catch(() => '');
  console.log('toast:', toast.slice(0,100));
} catch(e) { console.log('save click error:', e.message.slice(0,150)); }
await browser.close();
