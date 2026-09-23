import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState });
const page = await context.newPage();
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
const ids = ['536027265110047','536027265030940','536027264919068','536027264868377','536027264821021','536027264773400','536027264726810','536027264630033','536027264516884','536027264467731','536027264421400','536027264354836','536027264259090','536027264209947','536027264146709','536027264083486','536027264018975','536027263971102','536027263920410','536027263873053','536027263810587','536027263762195','536027263712531','536027263664156','536027263616535','536027263569168','536027263536668','536027263397904','536027258986268','536027258826513'];
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
