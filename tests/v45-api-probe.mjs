// Probe: validate MrShopPlus backend session via direct API, and capture the exact
// saveModify request/response shape so we can later write PDP Content directly (no UI).
// Safe: opens one ALREADY-PUBLISHED product, makes NO changes, clicks save once (no-op),
// and dumps the captured request body to a JSON file.
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const targetId = process.argv[2] || '536027542763285'; // known published canary
const outDir = process.argv[3] || 'data/runs/v45-batch-2026-09-23/api-probe';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(45000);

const readApi = async (id) => page.evaluate(async (pid) => {
  const r = await fetch('/biz/DTB_proProduct/modify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
    body: JSON.stringify({ args: [[pid]], additions: {} })
  });
  return r.json();
}, String(id));

// 1) Session + read validation
await page.goto('https://www.mrshopplus.com/#/product/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
const row = (await readApi(targetId)).result.find((s) => s.name === 'dtb_proProduct')?.rows?.[0];
console.log('READ OK:', row ? `Id=${row.Id} IsShow=${row.IsShow} Name=${String(row.Name).slice(0, 40)} ContentLen=${String(row.Content || '').length}` : 'NO ROW (session may be expired)');
await fs.writeFile(path.join(outDir, 'probe-read.json'), JSON.stringify(row, null, 2));
if (!row) { await browser.close(); process.exit(2); }

// 2) Capture saveModify request/response without changing anything
const captured = [];
page.on('request', (req) => {
  if (/saveModify/i.test(req.url()) && req.method() !== 'GET') {
    captured.push({ url: req.url(), method: req.method(), headers: { 'Content-Type': req.headers()['content-type'] || null }, body: req.postData() || null });
  }
});
page.on('response', async (res) => {
  if (/saveModify/i.test(res.url()) && res.request().method() !== 'GET') {
    const text = await res.text().catch(() => '');
    captured.push({ url: res.url(), status: res.status(), body: text.slice(0, 4000) });
  }
});

await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${targetId}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });
await page.waitForTimeout(2000);

const respPromise = page.waitForResponse((r) => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 60000 });
await page.getByRole('button', { name: '保存', exact: true }).click();
const resp = await respPromise;
console.log('SAVE no-op:', resp.status(), (await resp.text()).slice(0, 200));
await fs.writeFile(path.join(outDir, 'probe-savemodify-capture.json'), JSON.stringify(captured, null, 2));
console.log('Captured', captured.length, 'entries ->', path.join(outDir, 'probe-savemodify-capture.json'));

await browser.close();
