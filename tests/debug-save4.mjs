import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');
const storageState = 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ storageState, viewport: { width: 1700, height: 1100 } });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

const id = '536027437550618';
await page.goto(`https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B${id}%5D`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[placeholder="请输入商品名称"]').first().waitFor({ state: 'visible' });

// Fill name + subtitle
await page.locator('input[placeholder="请输入商品名称"]').first().fill('Test Name Debug');
await page.locator('input[placeholder="请输入商品副标题"]').first().fill('QC Photos · 30-Day Returns');
console.log('Name/subtitle filled');

// Set editors
const setEditor = (index, html) => page.evaluate(({ index, html }) => {
  const main = document.querySelector('main');
  const editors = (window.tinymce?.editors || []).filter((e) => main?.contains(e.getElement()));
  const editor = editors[index];
  if (!editor) return { ok: false, count: editors.length };
  editor.setContent(html); editor.fire('change'); editor.save();
  editor.getElement().dispatchEvent(new Event('input', { bubbles: true }));
  return { ok: true, content: editor.getContent() };
}, { index, html });

const d = await setEditor(0, '');
console.log('Description cleared:', d.ok);
const s = await setEditor(1, '<section><h2>Product Details</h2><ul><li>A</li><li>B</li><li>C</li><li>D</li><li>E</li></ul></section>');
console.log('Summary filled:', s.ok, 'li count:', (s.content.match(/<li/gi)||[]).length);

// Open SEO dialog
await page.getByRole('button', { name: /编辑SEO/ }).click();
await page.waitForTimeout(500);
const dialog = page.locator('.el-dialog:visible, .el-drawer:visible').last();
const textareas = dialog.locator('textarea');
console.log('SEO textareas:', await textareas.count());
await textareas.nth(0).fill('Test SEO Title');
await textareas.nth(1).fill('Test meta desc');
await textareas.nth(2).fill('test-seo-slug');
// Clear tags
const closeTags = dialog.locator('.el-select__tags .el-tag__close, .el-select__tags .el-tag .el-icon-close');
let guard = 0;
while (await closeTags.count() && guard++ < 20) { await closeTags.first().click({ force: true }).catch(()=>{}); await page.waitForTimeout(120); }
// Add keywords
const kwInput = dialog.locator('input.el-select__input').first();
for (const kw of ['sneakers','streetwear','fashion','style','drip']) { await kwInput.fill(kw); await kwInput.press('Enter'); await page.waitForTimeout(150); }
console.log('SEO tags:', await dialog.locator('.el-select__tags .el-tag').count());
await dialog.getByRole('button', { name: /确定|保存/ }).last().click();
console.log('SEO dialog closed');
await page.waitForTimeout(500);

// Click publish switch
const sw = page.locator('main .el-form-item').filter({ hasText: '商品上架' }).locator('[role=switch], .el-switch').first();
console.log('Switch before:', await sw.getAttribute('aria-checked'));
await sw.click();
console.log('Switch clicked');

// Save
try {
  const respPromise = page.waitForResponse(r => /saveModify/i.test(r.url()) && r.request().method() !== 'GET', { timeout: 15000 });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const resp = await respPromise;
  console.log('Save result:', resp.status(), JSON.stringify(await resp.json()).slice(0,500));
} catch (e) {
  console.log('Save error:', e.message);
  const msgs = await page.locator('.el-message--error, .el-notification__content').allTextContents();
  console.log('Error messages:', msgs);
}

await browser.close();
