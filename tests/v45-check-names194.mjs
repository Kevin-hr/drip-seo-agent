import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState });
const page = await context.newPage();
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
const ids = ['536027310924563','536027310845464','536027308499730','536027308417306','536027308016400','536027307745054','536027306539540','536027306490650','536027306121499','536027305718302','536027305590800','536027305542675','536027305413401','536027305349146','536027305237018','536027305107485','536027305044503','536027304900123','536027304835614','536027304755223','536027304675347','536027304611350','536027304546581','536027304466451','536027303984148','536027303840531','536027303791387','536027303712017','536027303647000','536027303421977'];
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
