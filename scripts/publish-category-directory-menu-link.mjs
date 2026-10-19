#!/usr/bin/env node

import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'gsc-category-indexing-2026-10-19');
const BACKUP_PATH = path.join(REPORT_DIR, 'shop-menu-preupdate-backup.json');
const RECEIPT_PATH = path.join(REPORT_DIR, 'category-directory-menu-link-receipt.json');
const STORAGE_STATE = process.env.MRSHOPPLUS_STORAGE_STATE || 'C:/Users/Administrator/Documents/01_Projects/dripsneakers/mrshopplus-storage-state.json';
const EXECUTABLE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';
const COMMIT = process.argv.includes('--commit');
const MENU_ID = 537836567666708;
const MENU_NAME = 'SHOP';
const LINK_NAME = 'Shop by Category';
const RELATIVE_LINK = '/shop-by-category';
const PUBLIC_LINK = 'https://www.dripsneakers.org/shop-by-category';

const browser = await chromium.launch({ headless: true, executablePath: EXECUTABLE });
const context = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(45_000);
const receipt = {
  startedAt: new Date().toISOString(),
  mode: COMMIT ? 'commit' : 'dry-run',
  menuId: MENU_ID,
  menuName: MENU_NAME,
  linkName: LINK_NAME,
  relativeLink: RELATIVE_LINK,
  steps: [],
};

async function readMenu() {
  return page.evaluate(async (id) => {
    const response = await fetch('/biz/DTB_MenuNav/modify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ args: [[id]], additions: {} }),
    });
    const json = await response.json();
    if (!response.ok || !json?.success) throw new Error(`Menu read failed: HTTP ${response.status}`);
    return json;
  }, MENU_ID);
}

function rowsOf(json, tableName) {
  return (json.result ?? []).find((table) => String(table?.name ?? '').toLowerCase() === tableName.toLowerCase())?.rows ?? [];
}

try {
  await page.goto('https://www.mrshopplus.com/#/shop/list_DTB_MenuNav', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(900);
  const before = await readMenu();
  const menuRows = rowsOf(before, 'DTB_MenuNav');
  const itemRows = rowsOf(before, 'DTB_MenuNavItem');
  if (menuRows.length !== 1 || String(menuRows[0].Id) !== String(MENU_ID) || menuRows[0].Name !== MENU_NAME) throw new Error('SHOP menu identity mismatch');
  const existing = itemRows.filter((item) =>
    String(item.Name ?? '').trim().toLowerCase() === LINK_NAME.toLowerCase() ||
    String(item.Link ?? item.RelUrl ?? '').trim().toLowerCase().replace(/\/$/, '') === RELATIVE_LINK.toLowerCase());
  if (existing.length) throw new Error(`Directory menu link already exists: ${JSON.stringify(existing)}`);
  await fs.writeFile(BACKUP_PATH, JSON.stringify({ capturedAt: new Date().toISOString(), detail: before }, null, 2) + '\n', 'utf8');
  receipt.steps.push({ step: 'menu-backup', itemCount: itemRows.length, path: BACKUP_PATH });

  const formUrl = `https://www.mrshopplus.com/#/shop/form_DTB_MenuNav?action=3&pkValues=%5B${MENU_ID}%5D`;
  await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(900);
  const menuName = page.locator('input[placeholder="请输入菜单名称"]');
  if (await menuName.count() !== 1 || await menuName.inputValue() !== MENU_NAME) throw new Error('SHOP menu form did not load');

  const addButton = page.getByRole('button', { name: '新增导航', exact: true });
  if (await addButton.count() !== 1) throw new Error('Expected one Add Navigation button');
  await addButton.click();
  const dialog = page.locator('.el-dialog').filter({ visible: true });
  if (await dialog.count() !== 1) throw new Error('Expected one visible navigation dialog');

  const linkTypeItem = dialog.locator('.el-form-item').filter({ hasText: '链接属性' });
  if (await linkTypeItem.count() !== 1) throw new Error('Expected link type field');
  const linkTypeInput = linkTypeItem.locator('input[readonly]');
  if (await linkTypeInput.count() !== 1) throw new Error('Expected one link type selector');
  await linkTypeInput.click();
  const selectedType = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll('.el-select-dropdown__item')].filter((item) =>
      (item.innerText || '').trim() === '自定义链接' &&
      getComputedStyle(item.closest('.el-select-dropdown')).display !== 'none');
    if (candidates.length !== 1) return { ok: false, count: candidates.length };
    candidates[0].click();
    return { ok: true, count: 1 };
  });
  if (!selectedType.ok) throw new Error(`Custom link type selection failed: ${JSON.stringify(selectedType)}`);

  const formItems = dialog.locator('.el-form-item');
  const formItemCount = await formItems.count();
  if (formItemCount !== 6) throw new Error(`Expected six navigation form items, found ${formItemCount}`);
  const formShape = await dialog.evaluate((element) => [...element.querySelectorAll('.el-form-item')].map((item) => (item.innerText || '').replace(/\s+/g, ' ').trim()));
  if (formShape[2] !== '导航名称' || formShape[3] !== '自定义链接') throw new Error(`Unexpected form shape: ${JSON.stringify(formShape)}`);
  const nameInput = formItems.nth(2).locator('input[type="text"]');
  const linkInput = formItems.nth(3).locator('input[type="text"]');
  if (await nameInput.count() !== 1 || await linkInput.count() !== 1) throw new Error('Navigation name/link inputs missing');
  await nameInput.fill(LINK_NAME);
  await linkInput.fill(RELATIVE_LINK);
  const preparedValues = { name: await nameInput.inputValue(), link: await linkInput.inputValue() };
  if (preparedValues.name !== LINK_NAME || preparedValues.link !== RELATIVE_LINK) {
    throw new Error(`Prepared navigation values mismatch: ${JSON.stringify(preparedValues)}`);
  }

  receipt.steps.push({ step: 'menu-item-prepared', linkName: LINK_NAME, link: RELATIVE_LINK, preparedValues, formShape });

  if (!COMMIT) {
    receipt.completedAt = new Date().toISOString();
    await fs.writeFile(RECEIPT_PATH, JSON.stringify(receipt, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    const dialogSave = dialog.getByRole('button', { name: '保 存', exact: true });
    if (await dialogSave.count() !== 1) throw new Error('Expected one dialog Save button');
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes('/biz/DTB_MenuNavItem/') &&
      response.request().method() === 'POST' &&
      !/\/modify$/i.test(response.url()), { timeout: 60_000 });
    await dialogSave.click();
    const response = await responsePromise;
    const responseText = await response.text();
    let responseJson;
    try { responseJson = JSON.parse(responseText); } catch { responseJson = { raw: responseText.slice(0, 500) }; }
    receipt.steps.push({ step: 'menu-item-saved-immediately', endpoint: response.url(), status: response.status(), response: responseJson });
    if (response.status() !== 200 || responseJson?.success !== true) throw new Error(`Menu save failed: ${response.status()} ${responseText.slice(0, 300)}`);

    await page.goto('https://www.mrshopplus.com/#/shop/list_DTB_MenuNav', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(700);
    const after = await readMenu();
    const afterItems = rowsOf(after, 'DTB_MenuNavItem');
    const created = afterItems.filter((item) =>
      String(item.Name ?? '').trim() === LINK_NAME &&
      String(item.Link ?? item.RelUrl ?? '').trim().toLowerCase().replace(/\/$/, '') === RELATIVE_LINK.toLowerCase());
    if (created.length !== 1) throw new Error(`Backend menu verification failed: ${JSON.stringify(created)}`);
    receipt.created = created[0];
    receipt.steps.push({ step: 'backend-verified', itemId: created[0].Id, sort: created[0].Sort });

    const homeResponse = await page.goto('https://www.dripsneakers.org/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(700);
    const frontend = await page.evaluate((target) => {
      const matches = [...document.querySelectorAll('a[href]')].filter((anchor) => {
        try {
          const url = new URL(anchor.getAttribute('href'), location.href);
          return url.origin === location.origin && url.pathname.replace(/\/$/, '') === target;
        } catch {
          return false;
        }
      });
      return matches.map((anchor) => ({ text: (anchor.innerText || '').trim(), href: anchor.href }));
    }, RELATIVE_LINK);
    receipt.frontend = { httpStatus: homeResponse?.status() ?? null, matches: frontend };
    if (receipt.frontend.httpStatus !== 200 || frontend.length < 1 || !frontend.some((item) => item.text === LINK_NAME)) {
      throw new Error(`Frontend menu verification failed: ${JSON.stringify(receipt.frontend)}`);
    }
    receipt.steps.push({ step: 'frontend-verified', matches: frontend.length });
    receipt.completedAt = new Date().toISOString();
    await fs.writeFile(RECEIPT_PATH, JSON.stringify(receipt, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify(receipt, null, 2));
  }
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}
