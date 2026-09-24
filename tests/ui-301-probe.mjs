import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const TEST_ID = '536027557731352'; // 球衣测试
const TEST_SLUG = 'Test-Jersey-301-Probe-X9';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);

const calls = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('/biz/')) calls.push({ method: req.method(), url: u, postData: req.postData() || '' });
});
page.on('response', async res => {
  if (res.url().includes('/biz/')) {
    const body = await res.text().catch(()=>'');
    calls.push({ resp: true, url: res.url(), body: body.slice(0, 400) });
  }
});

await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${TEST_ID}%5D`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);

// open 编辑SEO dialog
await page.locator('text=编辑SEO').first().click();
await page.waitForTimeout(2000);

// fill URL slug textarea (last of the 4 in the drawer) with the probe slug
const tas = await page.locator('textarea:visible').all();
console.log('visible textareas:', tas.length);
for (let i=0;i<tas.length;i++) {
  const v = await tas[i].inputValue().catch(()=>'');
  console.log(`  TA${i}: ${v.slice(0,60)}`);
}
if (tas.length >= 4) {
  await tas[tas.length-1].fill(TEST_SLUG);
  console.log('filled TA', tas.length-1, 'with', TEST_SLUG);
}
// check the 301 checkbox if visible
const cb = page.locator('.el-drawer:visible .el-checkbox:visible');
console.log('checkbox count:', await cb.count());
if (await cb.count() > 0) {
  await cb.first().click();
  console.log('checked 301 checkbox');
}
// confirm drawer
await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
await page.waitForTimeout(2000);
// save main
await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
await page.waitForTimeout(4000);

console.log('\n=== ALL BIZ CALLS ===');
for (const c of calls) {
  const u = c.url.replace('https://www.mrshopplus.com','');
  if (c.resp) console.log(`RESP ${u} | ${c.body.slice(0,200)}`);
  else console.log(`REQ  ${u} | ${c.postData.slice(0,150)}`);
}
const toast = await page.locator('.el-message').innerText().catch(()=>'');
console.log('\ntoast:', toast.slice(0,120));
fs.writeFileSync('data/runs/v45-batch-2026-09-23/minimal-run/ui-301-probe-calls.json', JSON.stringify(calls, null, 2));
await browser.close();
