import { createRequire } from 'node:module';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const products = [
  { id: 'P0-01', pid: '541665286797340' },
  { id: 'P0-02', pid: '541580216648219' },
  { id: 'P0-03', pid: '541579345303579' },
  { id: 'P0-04', pid: '541579123484953' },
  { id: 'P0-05', pid: '541578922851864' },
  { id: 'P0-06', pid: '541577396799253' },
  { id: 'P0-07', pid: '541577273184028' },
  { id: 'P0-08', pid: '541576660608030' },
  { id: 'P0-09', pid: '541574614856220' },
  { id: 'P0-10', pid: '541574389001757' },
  { id: 'P0-11', pid: '541573975406101' },
  { id: 'P0-12', pid: '541572937470224' },
  { id: 'P0-13', pid: '541572560539930' },
  { id: 'P0-14', pid: '541572053325584' },
  { id: 'P1-01', pid: '541648130634781' },
  { id: 'P1-02', pid: '541646303557145' },
  { id: 'P1-03', pid: '541579886672407' },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const results = [];

  for (const p of products) {
    try {
      await page.goto('about:blank');
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);

      const name = await page.locator('input[placeholder="请输入商品名称"]').inputValue();
      const bodyText = await page.locator('body').innerText();
      
      // Get SEO title and URL from body text
      const seoIdx = bodyText.indexOf('编辑SEO');
      let seoTitle = '', url = '';
      if (seoIdx >= 0) {
        const lines = bodyText.slice(seoIdx, seoIdx+400).split('\n').map(l=>l.trim()).filter(l=>l);
        if (lines.length >= 2) seoTitle = lines[1];
        if (lines.length >= 3) url = lines[2];
      }

      // Get tinyMCE li count
      const liCount = await page.evaluate(() => {
        if (typeof tinyMCE === 'undefined' || !tinyMCE.editors[0]) return 0;
        const c = tinyMCE.editors[0].getContent();
        return (c.match(/<li>/g) || []).length;
      });

      const pass = liCount === 5;
      results.push({ id: p.id, name, seoTitle: seoTitle.slice(0,70), li: liCount, pass });
      console.log(`${p.id}: li=${liCount} ${pass?'✓':'✗'} | ${name.slice(0,40)}`);
    } catch(e) {
      console.log(`${p.id}: ERROR - ${e.message.slice(0,80)}`);
      results.push({ id: p.id, error: e.message.slice(0,80) });
    }
  }

  const passCount = results.filter(r => r.pass).length;
  console.log(`\n=== VERIFICATION: ${passCount}/17 products have exactly 5 Product Details fields ===`);
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
