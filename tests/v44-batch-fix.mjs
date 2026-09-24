import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

// P1-REPAIR products: clear Editor 1 (Description) of duplicated text
// These already have correct Key Description in Editor 0
const clearDescription = [
  { pid: '536027559274011', name: 'Balenciaga Runner bundle' },
  { pid: '536027559207962', name: 'BAPE ABC Camo Tee Black/Green' },
  { pid: '536027558839583', name: 'Nike Kobe IX Elite Low EM Protro' },
  { pid: '536027558775060', name: 'Air Jordan 6 x Awake NY' },
  { pid: '536027558711071', name: 'Off-White Be Right Back' },
  { pid: '536027558662673', name: 'adidas XLG Runner Deluxe' },
  { pid: '536027558228508', name: 'Dior Aqua Sandal Black' },
  { pid: '536027558179857', name: 'Dior Aqua Mule Beige Black' },
  { pid: '536027558132503', name: 'Air Jordan 11 Animal Instinct' },
  { pid: '536027558069780', name: 'Air Jordan 11 Inner Beast' },
  { pid: '536027557987099', name: 'Air Jordan 11 H-Town' },
  { pid: '536027557923610', name: 'Air Jordan 11 285' },
  { pid: '536027557844250', name: 'Jordan 11 Low Mothers Day' },
  { pid: '536027557778961', name: 'Jordan 11 Mojave Canyon Purple' },
  { pid: '536027557586717', name: 'Nike Air Force 1 Triple Red' },
  { pid: '536027557521439', name: 'Louis Vuitton LV Trainer White' },
  { pid: '536027556587537', name: 'Air Jordan 5 Retro Medium Soft Pink' },
];

// P0-REMOVE: unpublish test product
const removeProduct = { pid: '536027557731352', name: '球衣测试' };

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const results = [];

  // Step 1: Clear Editor 1 for all duplicated Description products
  for (const p of clearDescription) {
    try {
      console.log(`Clearing Description: ${p.name}`);
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);

      // Clear Editor 1 (Description) - leave Editor 0 (Key Description) intact
      await page.evaluate(() => {
        if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent('');
      });

      // Click save directly (no SEO drawer needed)
      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(2500);

      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      const ok = toast.includes('成功');
      console.log(`  -> ${ok ? 'OK' : toast.slice(0,60)}`);
      results.push({ name: p.name, status: ok ? 'OK' : 'CHECK' });
    } catch(e) {
      console.log(`  -> FAIL: ${e.message.slice(0,80)}`);
      results.push({ name: p.name, status: 'FAIL' });
    }
  }

  // Step 2: Unpublish test product
  console.log(`\nUnpublishing: ${removeProduct.name}`);
  try {
    await page.goto('about:blank');
    await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${removeProduct.pid}%5D`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);

    // Find IsShow toggle and turn it off
    const isShowToggle = page.locator('.el-switch').first();
    const isOn = await isShowToggle.evaluate(el => el.classList.contains('is-checked'));
    if (isOn) {
      await isShowToggle.click();
      await page.waitForTimeout(1000);
      console.log('  IsShow toggled off');
    }

    await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
    await page.waitForTimeout(2500);
    console.log('  -> Saved (unpublished)');
    results.push({ name: removeProduct.name, status: 'UNPUBLISHED' });
  } catch(e) {
    console.log(`  -> FAIL: ${e.message.slice(0,80)}`);
    results.push({ name: removeProduct.name, status: 'FAIL' });
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/v44-batch-fix-results.json', JSON.stringify(results, null, 2));
  await browser.close();
  console.log('\n=== Summary ===');
  const ok = results.filter(r => r.status === 'OK' || r.status === 'UNPUBLISHED').length;
  console.log(`Success: ${ok}/${results.length}`);
}

main().catch(e => console.error('Fatal:', e));
