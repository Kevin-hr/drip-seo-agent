import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const topProducts = [
  'https://www.dripsneakers.org/Louis-Vuitton-LV-Skate-Sneaker-White-Brown',
  'https://www.dripsneakers.org/Fear-of-God-Essentials-SS21-Hoodie-Sweatpants-Set-Black',
  'https://www.dripsneakers.org/adidas-Ultra-Boost-4.0-Black-Blue-Real-Boost',
  'https://www.dripsneakers.org/Nike-SB-Dunk-Low-Pink-Pig',
  'https://www.dripsneakers.org/Nike-Dunk-Low-Community-Garden',
  'https://www.dripsneakers.org/Air-Jordan-4-Retro-Black-Cat',
  'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Off-White-MCA-University-Blue',
  'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Travis-Scott-Sail',
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);

  for (const url of topProducts) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      const title = await page.title();
      const meta = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '');
      const h1 = await page.locator('h1').first().innerText().catch(() => '');
      const body = await page.locator('body').innerText();
      const hasDetails = body.includes('Product Details');
      const liCount = (body.match(/Brand:|Product Type:|Model:|Colorway:|SKU:/g) || []).length;

      const issues = [];
      if (!title.includes('Drip Sneakers')) issues.push('title missing brand');
      if (meta.length < 50) issues.push('meta too short');
      if (!hasDetails) issues.push('no Product Details');
      if (liCount !== 5 && hasDetails) issues.push(`fields=${liCount} (need 5)`);

      console.log(`${issues.length === 0 ? '✓' : '⚠'} ${h1.slice(0,50)}`);
      if (issues.length > 0) console.log(`   Issues: ${issues.join(', ')}`);
    } catch(e) {
      console.log(`✗ ${url.split('/').pop()} -> ${e.message.slice(0,50)}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
