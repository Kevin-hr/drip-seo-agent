import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Check page 2 of Chanel category
  await page.goto('https://www.dripsneakers.org/Chanel/?page=2', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

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

  console.log(`Page 2: Found ${products.length} products`);
  products.forEach(p => console.log(`  ${p.href} -> ${p.text}`));

  // Try direct URLs for scarves and #09
  const guessUrls = [
    'https://www.dripsneakers.org/Chanel-Two-Tone-Wool-Fringe-Scarf-White-Brown',
    'https://www.dripsneakers.org/Chanel-Two-Tone-Wool-Fringe-Scarf-White-Black',
    'https://www.dripsneakers.org/Chanel-Two-Tone-Wool-Fringe-Scarf-White-Pink',
    'https://www.dripsneakers.org/Chanel-Low-Trainer-Black-White',
    'https://www.dripsneakers.org/Chanel-CC-Logo-Sneaker-Black-White',
  ];

  for (const url of guessUrls) {
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const title = await page.title();
      const h1 = await page.locator('h1').first().innerText().catch(() => 'NO H1');
      console.log(`\n${url}`);
      console.log(`  Status: ${resp?.status()}, Title: ${title.slice(0,80)}`);
      console.log(`  H1: ${h1}`);
    } catch(e) {
      console.log(`\n${url} -> ERROR: ${e.message.slice(0,60)}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
