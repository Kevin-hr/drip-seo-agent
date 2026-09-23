import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState });
const page = await context.newPage();
await page.goto('https://www.mrshopplus.com/', { waitUntil: 'domcontentloaded' });
const ids = ['536027340809758','536027340743699','536027340696088','536027340646425','536027340598547','536027340518427','536027340375060','536027340310033','536027340245267','536027340199192','536027340086802','536027340021277','536027338975762','536027338880785','536027337529106','536027337432094','536027337208094','536027337143069','536027336532506','536027336485400','536027336436247','536027336372248','536027335231002','536027335151123','536027335103005','536027335054614','536027335007508','536027334940702','536027495745308','536027492000787'];
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
