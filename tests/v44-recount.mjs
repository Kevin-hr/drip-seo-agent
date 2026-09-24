import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

async function main() {
  // Load queue
  const queue = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/queue.json', 'utf8'));
  const products = queue.products || [];
  console.log(`Total products in queue: ${products.length}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await page.goto('https://www.mrshopplus.com/#/product/list_DTB_proProduct', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Use the backend API to get product list with IsShow status
  // Try to intercept the list API response
  const result = await page.evaluate(async () => {
    // Try the product list API
    const r = await fetch('/biz/DTB_proProduct/list', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        args: [{ pageIndex: 1, pageSize: 1, keyword: '' }],
        additions: {}
      })
    });
    return await r.json();
  });

  console.log('API result:', JSON.stringify(result).slice(0, 500));

  // Alternative: count published from the execution results
  const execResults = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/minimal-run/execution-results.json', 'utf8').catch(() => '[]'));
  if (Array.isArray(execResults)) {
    const success = execResults.filter(r => r.success || r.published || r.isShow).length;
    console.log(`Execution results: ${success}/${execResults.length} marked success`);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
