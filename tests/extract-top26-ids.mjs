import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

// Reachable products that need fixing (from check results)
const fixUrls = [
  { name: 'Fear of God Essentials SS21 Hoodie Set Black', url: 'https://www.dripsneakers.org/Fear-of-God-Essentials-SS21-Hoodie-Sweatpants-Set-Black' },
  { name: 'adidas Ultra Boost Tech Ink Glow Blue', url: 'https://www.dripsneakers.org/adidas-Ultra-Boost-Tech-Ink-Glow-Blue' },
  { name: 'adidas Ultraboost All Terrain Black Red Grey', url: 'https://www.dripsneakers.org/adidas-Ultraboost-All-Terrain-Black-Red-Grey' },
  { name: 'adidas Ultra Boost All Terrain Shock Red Yellow', url: 'https://www.dripsneakers.org/adidas-adidas-Ultra-Boost-All-Terrain-Shock-Red-Yellow' },
  { name: 'Nike SB Dunk Low Pink Pig', url: 'https://www.dripsneakers.org/Nike-SB-Dunk-Low-Pink-Pig' },
  { name: 'Nike Dunk Low Community Garden', url: 'https://www.dripsneakers.org/Nike-Dunk-Low-Community-Garden' },
  { name: 'adidas Ultra Boost OG 2018', url: 'https://www.dripsneakers.org/adidas-Ultra-Boost-OG-2018' },
  { name: 'Nike SB Dunk Low Veneer', url: 'https://www.dripsneakers.org/Nike-SB-Dunk-Low-Veneer' },
  { name: 'Nike SB Dunk High Atlas Lost at Sea', url: 'https://www.dripsneakers.org/Nike-SB-Dunk-High-Atlas-Lost-at-Sea' },
  { name: 'Nike Air Force 1 Low Yin Yang', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Yin-Yang' },
  { name: 'Nike Air Force 1 07 MID White', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-07-MID-White' },
  { name: 'Nike Air Force 1 Mid Utility University Red', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Mid-Utility-University-Red' },
  { name: 'Nike Air Force 1 Mid LV8 Cool Grey', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Mid-LV8-Cool-Grey' },
  { name: 'Nike Air Force 1 Low Be True Rainbow', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Be-True-Rainbow-Multicolor' },
  { name: 'Nike Air Force 1 High Flax', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-High-Flax' },
  { name: 'Nike Air Force 1 Mid Flax', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Mid-Flax' },
  { name: 'Nike Air Force 1 Flyleather Ruohan Wang', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Flyleather-Ruohan-Wang' },
  { name: 'Nike Air Force 1 Low Good Game', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Good-Game' },
  { name: 'Nike Air Force 1 Low Flax 2019', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Flax-2019' },
  { name: 'Nike Air Force 1 Low Stussy Black', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Stussy-Black' },
  { name: 'Nike Air Force 1 Low Travis Scott Sail', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Travis-Scott-Sail' },
  { name: 'Nike Air Force 1 Low Travis Scott White', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Travis-Scott-white' },
  { name: 'Nike Air Force 1 Low Fragment Clot White', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Fragment-Clot-white' },
  { name: 'Nike Air Force 1 Low Fragment Clot Black', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Fragment-Clot-black' },
  { name: 'Nike Air Force 1 Low Clot Blue Silk', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Clot-Blue-Silk' },
  { name: 'Nike Air Force 1 Low Clot Rose Gold Silk', url: 'https://www.dripsneakers.org/Nike-Air-Force-1-Low-Clot-Rose-Gold-Silk' },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const ids = [];
  for (const p of fixUrls) {
    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(1500);
      const html = await page.content();
      // Find product ID - look for patterns in scripts or links
      const allIds = html.match(/\b5\d{14}\b/g) || [];
      // Filter out common non-product IDs
      const uniq = [...new Set(allIds)];
      console.log(`${p.name.slice(0,45)}: ${uniq.slice(0,3).join(', ')}`);
      ids.push({ ...p, candidateIds: uniq });
    } catch(e) {
      console.log(`${p.name.slice(0,45)}: ERR`);
      ids.push({ ...p, candidateIds: [] });
    }
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/fix-top26-ids.json', JSON.stringify(ids, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
