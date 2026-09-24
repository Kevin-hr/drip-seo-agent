import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

// Read ranking file
const ranking = await fs.readFile('D:/下单排行榜.txt', 'utf-8');
const lines = ranking.split('\n').slice(0, 50); // top 50

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const results = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (!match) continue;
    const name = match[1].trim();
    // Try to construct URL
    const slug = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    const url = `https://www.dripsneakers.org/${slug}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(1000);
      const title = await page.title();
      if (title === '404' || title.includes('404')) {
        results.push({ name, status: '404' });
        continue;
      }
      const body = await page.locator('body').innerText();
      const hasDetails = body.includes('Product Details');
      const liCount = (body.match(/Brand:|Product Type:|Model:|Colorway:|SKU:/g) || []).length;
      const meta = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '');
      const needsFix = !hasDetails || liCount !== 5 || meta.length < 50;
      results.push({ name, status: needsFix ? 'FIX' : 'OK', details: liCount, meta: meta.length });
    } catch(e) {
      results.push({ name, status: 'ERR', err: e.message.slice(0,40) });
    }
  }

  console.log('=== Top 50 SEO Status ===');
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : r.status === 'FIX' ? '⚠' : '✗';
    console.log(`${icon} ${r.name.slice(0,55)} [${r.status}] fields=${r.details||0}`);
  }

  const needsFix = results.filter(r => r.status === 'FIX');
  console.log(`\nNeeds fix: ${needsFix.length}/${results.length}`);
  await fs.writeFile('data/runs/v45-batch-2026-09-23/top50-seo-status.json', JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
