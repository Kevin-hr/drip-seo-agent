import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState });
const page = await context.newPage();
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
const ids = ['536027383564561','536027383178000','536027382792986','536027382744091','536027382664725','536027380013079','536027379965208','536027379660312','536027369661462','536027366672406','536027366046492','536027365998105','536027365692952'];
for (const id of ids) {
  const r = await page.evaluate(async (pid) => {
    const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ args: [[pid]], additions: {} }) });
    const j = await res.json();
    const row = j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0] || {};
    return { Name: row.Name, IsShow: row.IsShow };
  }, id);
  console.log(id, '| isShow=', r.IsShow, '|', JSON.stringify(r.Name));
}
await context.close(); await browser.close();
