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
  page.setDefaultTimeout(25000);

  const results = [];

  for (const p of products) {
    try {
      // Navigate to about:blank first to force fresh load
      await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
      await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${p.pid}%5D`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);

      // Get product name
      const nameInput = page.locator('input[placeholder="请输入商品名称"]');
      const currentName = await nameInput.inputValue().catch(() => '?');

      // Get body text
      const bodyText = await page.locator('body').innerText();
      
      // Extract SEO section
      const seoIdx = bodyText.indexOf('编辑SEO');
      let seoLine = '';
      let urlLine = '';
      if (seoIdx >= 0) {
        const afterSeo = bodyText.slice(seoIdx, seoIdx + 400);
        const lines = afterSeo.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length >= 2) seoLine = lines[1];
        if (lines.length >= 3) urlLine = lines[2];
      }

      // Get tinyMCE content
      const editorCount = await page.evaluate(() => (typeof tinyMCE !== 'undefined') ? tinyMCE.editors.length : 0);
      let liCount = 0;
      let editorSnippet = '';
      if (editorCount > 0) {
        editorSnippet = await page.evaluate(() => tinyMCE.editors[0]?.getContent() || '');
        liCount = (editorSnippet.match(/<li>/g) || []).length;
      }

      results.push({ ...p, currentName, seoTitle: seoLine, url: urlLine, liCount, editorSnippet: editorSnippet.slice(0,200) });
      console.log(`${p.id}: name="${currentName}" | SEO="${seoLine.slice(0,60)}" | li=${liCount}`);
    } catch(e) {
      console.log(`${p.id}: ERROR - ${e.message}`);
      results.push({ ...p, error: e.message });
    }
  }

  await fs.writeFile('data/runs/v45-batch-2026-09-23/v44-audit.json', JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
