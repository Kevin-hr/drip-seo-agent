#!/usr/bin/env node
/**
 * check-page2-v44-plans.mjs
 * Deterministic V4.4 gate checker for the page-2 20-FAIL repair plans.
 * Mirrors the fail-closed rules of V44Validator / core/pdp-template-v4.4.md.
 *
 * Usage: node tests/check-page2-v44-plans.mjs [path/to/plans.json]
 * Exit code: 0 = all gates PASS (WARN allowed), 1 = any FAIL.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPlans = path.resolve(__dirname, '..', 'data', 'runs', 'page2-20fail-2026-09-24', 'plans.json');
const plansPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultPlans;

const ORIGIN = 'https://www.dripsneakers.org';
const STD = '4.4';
const TITLE_SUFFIX = 'Reps | Drip Sneakers';
const META_ASSURANCES = ['QC photos', '30-day returns', '7\u201320 day shipping'];
const GLOBAL_BANNED = [
  "Women's", 'Top Quality', 'Best Quality', '1:1', 'PKGod', 'Pkgod',
  'luckdog', 'mrshopplus.com', 'Bitcoin creator', 'Bitcoin founder', 'Anonymous Bitcoin identity'
];
// standalone gender / sizing tokens (word-boundary, case-insensitive)
const GLOBAL_BANNED_WORD = ['GS', 'PS', 'TD', 'Kids', 'Unisex'];

let data;
try {
  data = JSON.parse(fs.readFileSync(plansPath, 'utf8'));
} catch (e) {
  console.error(`FAIL: cannot read/parse plans at ${plansPath}: ${e.message}`);
  process.exit(1);
}

const results = [];
let failCount = 0;
let warnCount = 0;

function record(id, ok, rule, detail) {
  results.push({ id, ok, rule, detail });
  if (!ok) failCount++;
}
function warn(id, rule, detail) {
  results.push({ id, ok: true, warn: true, rule, detail });
  warnCount++;
}

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const contains = (hay, needle) => String(hay).includes(needle);
const wordHit = (hay, word) => new RegExp(`\\b${esc(word)}\\b`, 'i').test(String(hay));
const countWord = (hay, word) => {
  const m = String(hay).match(new RegExp(`\\b${esc(word)}\\b`, 'g'));
  return m ? m.length : 0;
};

// ---- HOLD entries ---------------------------------------------------------
const holds = data.plans.filter((p) => p.status === 'HOLD');
for (const p of holds) {
  if (!p.product_name) record(p.id, false, 'HOLD-01', 'product_name required');
  if (!p.hold_reason || p.hold_reason.length < 20) record(p.id, false, 'HOLD-02', 'hold_reason required, >= 20 chars');
  if (!Array.isArray(p.forbidden_actions) || p.forbidden_actions.length === 0) record(p.id, false, 'HOLD-03', 'forbidden_actions required');
  if (!Array.isArray(p.next_verify) || p.next_verify.length === 0) record(p.id, false, 'HOLD-04', 'next_verify required');
  if (p.schema && typeof p.schema.sku !== 'undefined') record(p.id, false, 'HOLD-05', 'schema must omit sku on HOLD');
  if (typeof p.slug !== 'undefined' || typeof p.seo_title !== 'undefined') record(p.id, false, 'HOLD-06', 'HOLD must not carry publish fields');
}
if (holds.length !== 7) record('meta', false, 'HOLD-TOTAL', `expected 7 HOLD, got ${holds.length}`);

// ---- REPAIR entries -------------------------------------------------------
const repairs = data.plans.filter((p) => p.status === 'REPAIR');
if (repairs.length !== 13) record('meta', false, 'REPAIR-TOTAL', `expected 13 REPAIR, got ${repairs.length}`);

for (const p of repairs) {
  const id = p.id;
  const sku = p.entity?.verified_sku ?? null;
  const name = p.product_name;
  const allText = [
    name, p.h1, p.seo_title, p.meta_description, p.key_description_html,
    ...(p.seo_keywords ?? []), ...(p.image_alts ?? []), JSON.stringify(p.schema ?? {})
  ].join('\n');

  // gate: template output order fields present
  for (const f of ['product_name', 'h1', 'seo_title', 'seo_keywords', 'meta_description', 'slug', 'canonical', 'key_description_html', 'image_alts', 'schema']) {
    if (p[f] === undefined || p[f] === null || p[f] === '') record(id, false, `FIELD-${f}`, `${f} missing`);
  }

  // TPL-H1-01: H1 === Product Name
  if (p.h1 !== name) record(id, false, 'H1-01', `H1 != Product Name`);

  // TPL-TITLE-01/02: template + SKU exactly once
  const expectedTitle = sku ? `${name} ${sku} ${TITLE_SUFFIX}` : `${name} ${TITLE_SUFFIX}`;
  if (p.seo_title !== expectedTitle) record(id, false, 'SEO-01', `title does not match template: "${p.seo_title}"`);
  if (sku) {
    const n = countWord(p.seo_title, sku);
    if (n !== 1) record(id, false, 'SEO-02', `verified SKU must appear exactly once in title (got ${n})`);
  } else if (/\bSKU\b/i.test(p.seo_title) || /[A-Z]{3,}\d{2,}[A-Z0-9-]*/.test(p.seo_title.replace(`${name} `, ''))) {
    record(id, false, 'SEO-03', 'no verified SKU but title carries a code-like token');
  }

  // TPL-KW-01/02: exactly 5, no dup
  if (!Array.isArray(p.seo_keywords) || p.seo_keywords.length !== 5) record(id, false, 'KW-01', `keywords != 5 (${p.seo_keywords?.length})`);
  if (Array.isArray(p.seo_keywords)) {
    const lower = p.seo_keywords.map((k) => k.toLowerCase());
    if (new Set(lower).size !== lower.length) record(id, false, 'KW-02', 'duplicate keyword');
    if (p.seo_keywords.some((k) => !k || !k.trim())) record(id, false, 'KW-03', 'empty keyword');
  }

  // TPL-META-01/02/03
  const meta = p.meta_description || '';
  if (!meta.startsWith('Shop ')) record(id, false, 'META-01', 'meta must start "Shop "');
  if (!contains(meta, `${name} reps`)) record(id, false, 'META-01', `meta must contain "${name} reps"`);
  if (sku && !contains(meta, `(${sku})`)) record(id, false, 'META-01', `meta must contain verified SKU in parens`);
  if (!sku && /\([^)]*[A-Z0-9]{3,}[^)]*\)/.test(meta)) record(id, false, 'META-01', 'meta contains a code-looking paren but no verified SKU');
  for (const a of META_ASSURANCES) if (!contains(meta, a)) record(id, false, 'META-03', `meta missing assurance "${a}"`);

  // URL: TPL-URL-01/02/05
  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug || '');
  if (!slugOk) {
    if (p.url_policy === 'keep') warn(id, 'URL-01', `existing live slug not lowercase-ASCII (kept per TPL-URL-03 WARN): "${p.slug}"`);
    else record(id, false, 'URL-01', `new slug violates lowercase ASCII pattern: "${p.slug}"`);
  }
  if (p.canonical !== `${ORIGIN}/${p.slug}`) record(id, false, 'URL-03', `canonical != origin + slug`);
  if (p.url_policy === 'keep' && p.redirect_from) record(id, false, 'URL-04', 'url_policy=keep must not carry redirect_from');
  if (p.url_policy === 'migrate' && !p.redirect_from) record(id, false, 'URL-04', 'migration requires redirect_from');
  if (p.url_policy === 'migrate' && p.redirect_from && !p.redirect_from.startsWith('/')) record(id, false, 'URL-05', 'redirect_from must be a root-relative path');
  if (p.url_policy === 'migrate' && p.redirect_from && p.redirect_from.endsWith('-')) warn(id, 'URL-RESIDUE', `redirect_from ends with hyphen residue: "${p.redirect_from}" (intended migration)`);

  // KD: TPL-KD-01..08
  const kd = p.key_description_html || '';
  if (!contains(kd, `<section class="ds-pdp-key-description" data-standard="${STD}"`)) record(id, false, 'KD-01', `missing data-standard="${STD}" section wrapper`);
  if (!contains(kd, '<h2>Product Details</h2>')) record(id, false, 'KD-02', 'missing <h2>Product Details</h2>');
  const liCount = (kd.match(/<li>/g) || []).length;
  if (liCount !== 5) record(id, false, 'KD-03', `<li> count != 5 (${liCount})`);
  const pTag = kd.match(/<p>(.*?)<\/p>/);
  if (!pTag || pTag[1].trim().length < 20) record(id, false, 'KD-08', 'decision <p> missing or < 20 chars');
  const brandLi = kd.match(/<li><strong>Brand:<\/strong> <a href="([^"]+)"><strong>(.*?)<\/strong><\/a><\/li>/);
  if (!brandLi) record(id, false, 'KD-04', 'Brand row must be an internal <a> with <strong> anchor');
  else {
    if (!brandLi[1].startsWith(ORIGIN)) record(id, false, 'KD-05', `Brand href not on Drip origin: ${brandLi[1]}`);
    if (!brandLi[2].includes(p.entity?.brand ?? '')) record(id, false, 'KD-06', `Brand anchor "${brandLi[2]}" does not contain real brand "${p.entity?.brand}"`);
  }
  const h2Count = (kd.match(/<h2>/g) || []).length;
  if (h2Count !== 1) record(id, false, 'KD-09', `expected exactly one <h2>, got ${h2Count}`);
  if (contains(kd, `<h1`) || contains(kd, `<h3`)) record(id, false, 'KD-10', 'Key Description must not contain h1/h3');

  // fifth field: SKU present iff verified_sku, else a verified product fact
  const fifth = p.entity?.fifth;
  if (!fifth || !fifth.label || !fifth.value) record(id, false, 'KD-11', 'fifth field (label/value) required');
  if (sku) {
    if (fifth?.label !== 'SKU') record(id, false, 'KD-12', 'verified SKU must be the fifth field label');
    if (!contains(kd, `<strong>SKU:</strong> ${sku}`)) record(id, false, 'KD-13', 'SKU li missing or wrong value');
  }

  // DESC: images only
  if (p.description?.rule !== 'images_only') record(id, false, 'DESC-00', 'description rule must be images_only');
  if (p.description?.html && /<h1|<h2|<h3|<ul|<ol/.test(p.description.html)) record(id, false, 'DESC-01', 'Description contains forbidden heading/list markup');
  if (!Array.isArray(p.image_alts) || p.image_alts.length === 0) record(id, false, 'ALT-01', 'image_alts required');

  // Schema: TPL-SCH-01..04
  const s = p.schema;
  if (!s || typeof s !== 'object') record(id, false, 'SCH-00', 'schema must be an object');
  else {
    if (s['@context'] !== 'https://schema.org') record(id, false, 'SCH-01', 'schema @context wrong');
    if (s['@type'] !== 'Product') record(id, false, 'SCH-01', 'schema @type wrong');
    for (const k of ['name', 'brand', 'category', 'color']) if (!s[k]) record(id, false, 'SCH-02', `schema missing ${k}`);
    if (s.brand?.name !== p.entity?.brand) record(id, false, 'SCH-02', `schema brand.name != entity brand`);
    if (s.name !== name) record(id, false, 'SCH-02', `schema name != product_name`);
    if (s.url !== p.canonical) record(id, false, 'SCH-05', `schema url != canonical`);
    const hasSku = typeof s.sku !== 'undefined' && s.sku !== null && s.sku !== '';
    if (sku && !hasSku) record(id, false, 'SCH-04', 'verified SKU must appear in schema');
    if (!sku && hasSku) record(id, false, 'SCH-03', 'unverified SKU must be omitted from schema');
    if (!sku && s.sku === null) record(id, false, 'SCH-06', 'schema sku must be omitted entirely, not null');
  }

  // global banned words across all output fields
  for (const w of GLOBAL_BANNED) {
    if (contains(allText.toLowerCase(), w.toLowerCase())) record(id, false, `BAN-${w}`, `banned phrase "${w}" in output`);
  }
  for (const w of GLOBAL_BANNED_WORD) {
    if (wordHit(allText, w)) record(id, false, `BAN-${w}`, `banned gender/sizing token "${w}" in output`);
  }

  // per-plan forbidden terms (scoped)
  for (const f of p.forbidden ?? []) {
    const term = f.term;
    let hay = allText;
    if (f.scope === 'brand') hay = p.entity?.brand ?? '';
    if (f.scope === 'model') hay = p.entity?.model ?? '';
    if (contains(hay, term)) record(id, false, 'BAN-PLAN', `forbidden "${term}" (scope ${f.scope}) present`);
  }

  // entity facts consistency: slug/canonical lowercase path must not collide with old-entity terms
  if (p.url_policy === 'migrate') {
    if (!p.redirect_from || p.redirect_from === p.slug) record(id, false, 'URL-06', 'migrate requires old != new path');
  }
}

// summary
console.log(`Plans: ${plansPath}`);
console.log(`REPAIR=${repairs.length} HOLD=${holds.length}`);
let failed = 0;
for (const r of results.filter((x) => !x.ok)) {
  console.log(`FAIL  ${r.id}  ${r.rule}  ${r.detail}`);
  failed++;
}
for (const r of results.filter((x) => x.warn)) {
  console.log(`WARN  ${r.id}  ${r.rule}  ${r.detail}`);
}
console.log(`Gates: ${results.length - failed} PASS, ${failed} FAIL, ${warnCount} WARN`);
if (failed > 0) {
  console.error(`EXIT 1: ${failed} gate failure(s)`);
  process.exit(1);
}
console.log('EXIT 0: all V4.4 gates PASS');
