import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const ids = ['536027522684447','536027522587408'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState });
const page = await context.newPage();
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
for (const id of ids) {
  try {
    const r = await page.evaluate(async (pid) => {
      const res = await fetch('/biz/DTB_proProduct/modify', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ args: [[pid]], additions: {} }) });
      const j = await res.json();
      const row = j.result.find(s => s.name === 'dtb_proProduct')?.rows?.[0] || {};
      return { Name: row.Name, IsShow: row.IsShow, found: !!row.Id };
    }, id);
    console.log(id, '|', JSON.stringify(r.Name), '| isShow=', r.IsShow, '| found=', r.found);
  } catch(e) { console.log(id, 'ERROR', e.message); }
}
await context.close(); await browser.close();
