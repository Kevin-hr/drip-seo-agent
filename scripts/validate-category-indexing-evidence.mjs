#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'reports', 'gsc-category-indexing-2026-10-19');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') {
      row.push(field);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows;
  return data.map((values) => Object.fromEntries(header.map((name, index) => [name.replace(/^\uFEFF/, ''), values[index] ?? ''])));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [gscText, evidenceText, pageAuditText, backendText, inlinkText, pageReceiptText, menuReceiptText] = await Promise.all([
  fs.readFile(path.join(DIR, '188-category-ledger.csv'), 'utf8'),
  fs.readFile(path.join(DIR, '188-category-evidence-ledger.csv'), 'utf8'),
  fs.readFile(path.join(DIR, '188-category-page-audit.json'), 'utf8'),
  fs.readFile(path.join(DIR, '188-category-backend-audit.json'), 'utf8'),
  fs.readFile(path.join(DIR, '188-category-inlink-audit.json'), 'utf8'),
  fs.readFile(path.join(DIR, 'category-directory-canary-receipt.json'), 'utf8'),
  fs.readFile(path.join(DIR, 'category-directory-menu-link-receipt.json'), 'utf8'),
]);
const gsc = parseCsv(gscText);
const evidence = parseCsv(evidenceText);
const pageAudit = JSON.parse(pageAuditText);
const backend = JSON.parse(backendText);
const inlinks = JSON.parse(inlinkText);
const pageReceipt = JSON.parse(pageReceiptText);
const menuReceipt = JSON.parse(menuReceiptText);

assert(gsc.length === 188, `GSC ledger rows: ${gsc.length}`);
assert(evidence.length === 188, `Evidence ledger rows: ${evidence.length}`);
assert(new Set(gsc.map((row) => row.original_url)).size === 188, 'GSC URLs are not unique');
for (let i = 0; i < 188; i += 1) {
  assert(Number(gsc[i].sitemap_order) === i + 1, `GSC order mismatch at ${i + 1}`);
  assert(Number(evidence[i].sitemap_order) === i + 1, `Evidence order mismatch at ${i + 1}`);
  assert(gsc[i].original_url === evidence[i].original_url, `URL mismatch at ${i + 1}`);
  assert(Boolean(gsc[i].inspection_result_link), `Missing inspection link at ${i + 1}`);
}
assert(gsc.filter((row) => row.verdict === 'PASS' && row.coverage_state === 'Submitted and indexed').length === 8, 'Indexed baseline must be 8');
assert(evidence.filter((row) => row.final_outcome === 'RESOLVED').length === 8, 'Resolved evidence count must be 8');
assert(evidence.filter((row) => row.final_outcome === 'UNRESOLVED').length === 180, 'Unresolved evidence count must be 180');

assert(pageAudit.summary.total === 188, 'Page audit total');
assert(pageAudit.summary.http200 === 188, 'Page audit HTTP 200');
assert(pageAudit.summary.canonicalMatch === 188, 'Page audit canonical match');
assert(pageAudit.summary.canonicalMismatch === 0 && pageAudit.summary.canonicalMissing === 0, 'Page audit canonical failures');
assert(pageAudit.summary.noindex === 0 && pageAudit.summary.errors === 0, 'Page audit indexing blockers');
assert(pageAudit.summary.nonzero === 147 && pageAudit.summary.zero === 41 && pageAudit.summary.resultUnknown === 0, 'Page audit result partition');

assert(backend.summary.matched === 188 && backend.summary.matchedPublished === 188, 'Backend published match');
assert(backend.summary.missing === 0 && backend.summary.matchedHidden === 0, 'Backend mismatch');
assert(backend.summary.memberQueryErrors === 0 && backend.summary.detailQueryErrors === 0, 'Backend read failures');
assert(backend.summary.writeRequests === 0, 'Backend audit was not read-only');

assert(inlinks.summary.categoryTargets === 188, 'Inlink target total');
assert(inlinks.summary.targetsWithAnyInlink === 188 && inlinks.summary.targetsWithNoInlink === 0, 'Post-fix inlink coverage');
assert(inlinks.summary.targetsLinkedFromDirectory === 188, 'Directory inlink coverage');
assert(inlinks.summary.sourcesFailed === 0, 'Inlink source failures');

assert(pageReceipt.mode === 'commit-update', 'Directory page final receipt mode');
assert(pageReceipt.publicCheck?.httpStatus === 200, 'Directory page HTTP');
assert(pageReceipt.publicCheck?.canonical === 'https://www.dripsneakers.org/shop-by-category', 'Directory canonical');
assert(Array.isArray(pageReceipt.publicCheck?.h1) && pageReceipt.publicCheck.h1.length === 1, 'Directory H1 count');
assert(pageReceipt.categoryLinks === 188 && pageReceipt.uniqueCategoryLinks === 188, 'Directory target links');

assert(menuReceipt.item?.id === 543939228200733, 'Menu item ID');
assert(menuReceipt.frontend?.matchingLinks >= 1, 'Homepage menu link');
assert(menuReceipt.postChangeInlinkAudit?.targetsLinkedFromDirectory === 188, 'Menu receipt inlink coverage');

console.log(JSON.stringify({
  status: 'PASS',
  sitemapUrls: 188,
  currentIndexed: 8,
  currentUnresolved: 180,
  http200: 188,
  canonicalMatch: 188,
  backendPublishedMatch: 188,
  nonEmptyCategories: 147,
  emptyCategories: 41,
  postFixLinkedCategories: 188,
  postFixOrphans: 0,
}, null, 2));

