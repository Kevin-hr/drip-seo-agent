import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

// Check 3 representative products in detail
const checks = [
  { id: 'P0-06', pid: '541577396799253', expectName: 'Represent Owners Club Script Hoodie Pink',
    expectSEO: 'OCM41200-518', expectURL: 'Represent-Owners-Club-Script-Hoodie-Pink' },
  { id: 'P0-12', pid: '541572937470224', expectName: 'Vale Forever Classico Zip Up Hoodie Sapphire',
    expectSEO: 'Sapphire Reps', expectURL: 'Vale-Forever' },
  { id: 'P1-01', pid: '541648130634781', expectName: 'New Balance 9060 Bricks & Wood',
    expectSEO: 'U9060BW1', expectURL: 'Bricks' },
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  for (const c of checks) {
    console.log(`\n========== ${c.id} ==========`);
    await page.goto('about:blank');
    await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${c.pid}%5D`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // 1. Product name
    const name = await page.locator('input[placeholder="请输入商品名称"]').inputValue();
    console.log(`1. Product Name: "${name}" ${name === c.expectName ? '✓' : '✗ EXPECTED: ' + c.expectName}`);

    // 2. Click 编辑SEO to see saved SEO fields
    await page.locator('text=编辑SEO').first().click();
    await page.waitForTimeout(1500);

    // Get all textarea values
    const tas = await page.locator('textarea:visible').evaluateAll(els => els.map(e => e.value));
    console.log(`2. Visible textareas after clicking 编辑SEO: ${tas.length}`);
    tas.forEach((t, i) => console.log(`   TA${i}: "${t.slice(0, 120)}"`));

    // Get URL slug input
    const urlInput = await page.locator('input[placeholder*="仅支持中文"]').inputValue().catch(() => 'NOT FOUND');
    console.log(`3. URL Slug: "${urlInput}"`);

    // 3. Check tinyMCE content in detail
    const editorData = await page.evaluate(() => {
      const result = { count: tinyMCE.editors.length, contents: [] };
      for (let i = 0; i < tinyMCE.editors.length; i++) {
        result.contents.push(tinyMCE.editors[i].getContent());
      }
      return result;
    });
    console.log(`4. TinyMCE editors: ${editorData.count}`);
    editorData.contents.forEach((c, i) => {
      const liCount = (c.match(/<li>/g) || []).length;
      const hasLink = c.includes('<a href=');
      const hasH2 = c.includes('<h2>');
      const hasP = c.includes('<p>');
      console.log(`   Editor ${i}: li=${liCount} link=${hasLink} h2=${hasH2} p=${hasP}`);
      console.log(`   Content: ${c.slice(0, 300)}`);
    });

    // Close drawer by clicking elsewhere or pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e));
