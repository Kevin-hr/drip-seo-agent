import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const checks = [
  { id: 'P0-06', pid: '541577396799253', mustNotContain: 'Black' },
  { id: 'P0-12', pid: '541572937470224', mustNotContain: 'Orange' },
  { id: 'P0-10', pid: '541574389001757', mustNotContain: "Owner's Club" },
  { id: 'P1-01', pid: '541648130634781', mustNotContain: '' },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  for (const c of checks) {
    console.log(`\n=== ${c.id} ===`);
    await page.goto('about:blank');
    await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${c.pid}%5D`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    await page.locator('text=编辑SEO').first().click();
    await page.waitForTimeout(1500);

    // Check textareas
    const tas = await page.locator('textarea:visible').evaluateAll(els => els.map(e => e.value));
    console.log(`  Keywords (TA0): "${tas[0]?.slice(0,80)}"`);
    console.log(`  SEO Title (TA1): "${tas[1]?.slice(0,80)}"`);
    console.log(`  Meta Desc (TA2): "${tas[2]?.slice(0,80)}"`);
    console.log(`  URL Slug (TA3): "${tas[3]?.slice(0,80)}"`);

    // Check both editors
    const editors = await page.evaluate(() => {
      const result = [];
      for (let i = 0; i < tinyMCE.editors.length; i++) {
        const c = tinyMCE.editors[i].getContent();
        result.push({ li: (c.match(/<li>/g)||[]).length, preview: c.slice(0,200) });
      }
      return result;
    });
    editors.forEach((e, i) => {
      console.log(`  Editor ${i}: li=${e.li} | ${e.preview.slice(0,150)}`);
    });

    // Check for old wrong content
    if (c.mustNotContain) {
      const allText = editors.map(e => e.preview).join(' ');
      const badContent = allText.includes(c.mustNotContain);
      console.log(`  Must NOT contain "${c.mustNotContain}": ${badContent ? '✗ FAIL - still has old content!' : '✓ PASS'}`);
    }
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
