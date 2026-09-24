import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';

const target = {
  pid: '541577396799253',
  seoTitle: 'Represent Owners Club Script Hoodie Pink OCM41200-518 Reps | Drip Sneakers',
  metaDesc: 'Shop Represent Owners Club Script Hoodie Pink reps (OCM41200-518) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
  keyDesc: `<p>This Represent Owners Club Script Hoodie uses a Pink colorway with the Owners Club script identity across the heavyweight cotton hoodie silhouette.</p>
<h2>Product Details</h2>
<ul>
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hoodies/"><strong>Represent</strong></a></li>
<li><strong>Product Type:</strong> Hoodie</li>
<li><strong>Model:</strong> Owners Club Script Hoodie</li>
<li><strong>Colorway:</strong> Pink</li>
<li><strong>SKU:</strong> OCM41200-518</li>
</ul>`,
};

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await page.goto('about:blank');
  await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${target.pid}%5D`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Click 编辑SEO
  await page.locator('text=编辑SEO').first().click();
  await page.waitForTimeout(1500);

  // Update SEO fields in the drawer
  const allTextareas = await page.locator('textarea:visible').all();
  for (const ta of allTextareas) {
    const val = await ta.inputValue();
    if (val.includes('Reps | Drip Sneakers')) {
      await ta.fill(target.seoTitle);
      console.log('Updated SEO title');
    } else if (val.includes('QC photos') || val.includes('30-day')) {
      await ta.fill(target.metaDesc);
      console.log('Updated meta description');
    }
  }

  // Update tinyMCE
  await page.evaluate((content) => {
    if (typeof tinyMCE !== 'undefined' && tinyMCE.editors.length > 0) {
      tinyMCE.editors[0].setContent(content);
    }
  }, target.keyDesc);
  console.log('Updated tinyMCE');

  // Find and click the drawer's confirm/save button
  const drawerButtons = await page.locator('.el-drawer:visible button:visible, .el-drawer__footer button:visible').all();
  console.log('Drawer buttons:', drawerButtons.length);
  for (let i = 0; i < drawerButtons.length; i++) {
    const txt = await drawerButtons[i].innerText();
    console.log(`  Drawer btn ${i}: "${txt}"`);
  }

  // Click confirm in drawer
  if (drawerButtons.length > 0) {
    // Find the primary/confirm button
    for (const btn of drawerButtons) {
      const txt = await btn.innerText();
      if (txt.includes('确定') || txt.includes('保存') || txt.includes('确认') || txt.includes('完成')) {
        await btn.click();
        console.log('Clicked drawer confirm:', txt);
        break;
      }
    }
  }
  await page.waitForTimeout(2000);

  // Now click the main form save button
  const mainSave = page.locator('button:visible').filter({ hasText: /保存|提交/i }).last();
  await mainSave.click();
  await page.waitForTimeout(3000);
  console.log('Main save clicked');

  // Check result
  const bodyText = await page.locator('body').innerText();
  if (bodyText.includes('-3') || bodyText.includes('不允许重复')) {
    console.log('RESULT: code=-3 ERROR!');
  } else {
    const toast = await page.locator('.el-message, .el-notification').innerText().catch(() => 'no toast');
    console.log('RESULT:', toast);
  }

  await browser.close();
}

main().catch(e => console.error('Fatal:', e.message));
