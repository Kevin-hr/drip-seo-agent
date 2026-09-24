import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState });
const page = await context.newPage();
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
const ids = ['536027258696979','536027258664471','536027258616597','536027258472214','536027258423573','536027258085908','536027258054175','536027258007066','536027257957404','536027257860891','536027257780762','536027257443100','536027257397017','536027257346330','536027257300496','536027257217299','536027257170204','536027257121554','536027257058578','536027256992280','536027256849681','536027256799519','536027255595028','536027255547677','536027255386906','536027255355158','536027255305749','536027255258387','536027255210776','536027255160860'];
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
