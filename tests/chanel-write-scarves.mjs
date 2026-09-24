import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const scarves = [
  {
    id: '#10', pid: '536027446661151',
    name: 'Chanel Two-Tone Wool Fringe Scarf White Brown',
    seoTitle: 'Chanel Two-Tone Wool Fringe Scarf White Brown AAA255-B17089-NZ301 Reps | Drip Sneakers',
    keywords: 'Chanel Two-Tone Wool Fringe Scarf White Brown, Chanel white brown wool scarf, Brown Chanel wool scarf, AAA255-B17089-NZ301, Chanel scarf reps',
    metaDesc: 'Shop Chanel Two-Tone Wool Fringe Scarf White Brown reps (AAA255-B17089-NZ301) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Chanel wool scarf combines White and Brown tones with logo-print detailing and fringed edges.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Scarf</li><li><strong>Model:</strong> Two-Tone Wool Fringe Scarf</li><li><strong>Colorway:</strong> White / Brown</li><li><strong>SKU:</strong> AAA255-B17089-NZ301</li></ul>`
  },
  {
    id: '#11', pid: '536027446697756',
    name: 'Chanel Two-Tone Wool Fringe Scarf White Black',
    seoTitle: 'Chanel Two-Tone Wool Fringe Scarf White Black AAA255-B17089-NZ303 Reps | Drip Sneakers',
    keywords: 'Chanel Two-Tone Wool Fringe Scarf White Black, Chanel white black wool scarf, Black White Chanel scarf, AAA255-B17089-NZ303, Chanel scarf reps',
    metaDesc: 'Shop Chanel Two-Tone Wool Fringe Scarf White Black reps (AAA255-B17089-NZ303) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Chanel wool scarf combines White and Black tones with contrasting logo detailing and fringed edges.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Scarf</li><li><strong>Model:</strong> Two-Tone Wool Fringe Scarf</li><li><strong>Colorway:</strong> White / Black</li><li><strong>SKU:</strong> AAA255-B17089-NZ303</li></ul>`
  },
  {
    id: '#12', pid: '536027446744346',
    name: 'Chanel Two-Tone Wool Fringe Scarf White Pink',
    seoTitle: 'Chanel Two-Tone Wool Fringe Scarf White Pink AAA255-B17089-NZ302 Reps | Drip Sneakers',
    keywords: 'Chanel Two-Tone Wool Fringe Scarf White Pink, Chanel white pink wool scarf, Pink Chanel wool scarf, AAA255-B17089-NZ302, Chanel scarf reps',
    metaDesc: 'Shop Chanel Two-Tone Wool Fringe Scarf White Pink reps (AAA255-B17089-NZ302) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    keyDesc: `<p>This Chanel wool scarf combines White and Pink tones with two-tone logo detailing and fringed edges.</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Chanel/"><strong>Chanel</strong></a></li><li><strong>Product Type:</strong> Scarf</li><li><strong>Model:</strong> Two-Tone Wool Fringe Scarf</li><li><strong>Colorway:</strong> White / Pink</li><li><strong>SKU:</strong> AAA255-B17089-NZ302</li></ul>`
  }
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  for (const p of scarves) {
    try {
      console.log(`\n=== ${p.id}: ${p.name} ===`);
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);

      await page.locator('input[placeholder="请输入商品名称"]').fill(p.name);
      console.log('  Name updated');

      await page.locator('text=编辑SEO').first().click();
      await page.waitForTimeout(1500);

      const tas = await page.locator('textarea:visible').all();
      if (tas.length >= 4) {
        await tas[0].fill(p.keywords);
        await tas[1].fill(p.seoTitle);
        await tas[2].fill(p.metaDesc);
        console.log('  SEO fields filled');
      }

      await page.evaluate((keyDesc) => {
        if (tinyMCE?.editors?.[0]) tinyMCE.editors[0].setContent(keyDesc);
        if (tinyMCE?.editors?.[1]) tinyMCE.editors[1].setContent(keyDesc);
      }, p.keyDesc);
      console.log('  Editors set');

      await page.locator('.el-drawer:visible button:visible').filter({ hasText: '确定' }).click();
      await page.waitForTimeout(1500);

      await page.locator('button:visible').filter({ hasText: /保存/ }).last().click();
      await page.waitForTimeout(3000);

      const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => '');
      console.log(`  -> ${toast.includes('成功') ? 'SUCCESS' : 'CHECK: ' + toast.slice(0,80)}`);
    } catch(e) {
      console.log(`  -> FATAL: ${e.message.slice(0,100)}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
