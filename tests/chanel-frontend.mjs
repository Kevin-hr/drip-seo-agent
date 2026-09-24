import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // Visit Chanel category page on frontend
  await page.goto('https://www.dripsneakers.org/Chanel/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const products = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/Chanel-"]');
    const results = [];
    const seen = new Set();
    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim();
      if (href && text && !seen.has(href)) {
        seen.add(href);
        results.push({ href, text });
      }
    });
    return results;
  });

  console.log(`Found ${products.length} Chanel product links on frontend:`);
  products.forEach(p => console.log(`  ${p.href} -> ${p.text}`));

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
