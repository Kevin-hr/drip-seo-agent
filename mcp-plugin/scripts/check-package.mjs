import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);

const CANONICAL = 'Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md';
const CANONICAL_COPIES = [
  `rules/${CANONICAL}`,
  `skills/drip-seo-executor/references/${CANONICAL}`,
];

const required = [
  'plugin.json',
  'mcp.json',
  'skills/drip-seo-executor/SKILL.md',
  ...CANONICAL_COPIES,
  'src/server.ts',
  'src/standard.ts',
  'src/validation.ts',
  'LOCAL_AGENT_CONTRACT.md',
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing ${rel}`);
}

// --- canonical standard must be byte-identical wherever it is bundled -------
const hashes = CANONICAL_COPIES.map((rel) =>
  crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex'),
);
const unique = new Set(hashes);
if (unique.size !== 1) {
  throw new Error(`Canonical standard copies differ: ${CANONICAL_COPIES.join(' vs ')}`);
}
const standardHash = hashes[0];

const document = fs.readFileSync(path.join(root, CANONICAL_COPIES[0]), 'utf8');
if (!/^Version:\s*`4\.4`/m.test(document)) throw new Error('Canonical standard does not declare Version 4.4');
if (!/^Status:\s*`FINAL — CONSOLIDATED 2026-09-17`/m.test(document)) {
  throw new Error('Canonical standard does not declare the CONSOLIDATED 2026-09-17 status');
}

// --- no historical 3.2 / superseded V4.4 standard may be active -------------
const activeStandardFiles = [
  ...fs.readdirSync(path.join(root, 'rules'), { withFileTypes: true }).filter((e) => e.isFile()).map((e) => `rules/${e.name}`),
  ...fs
    .readdirSync(path.join(root, 'skills/drip-seo-executor/references'), { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => `skills/drip-seo-executor/references/${e.name}`),
];
for (const rel of activeStandardFiles) {
  if (/SEO-PDP[-_ ]?3\.2|V4\.4_STANDARD_FINAL/i.test(rel)) {
    throw new Error(`Forbidden historical standard is active: ${rel}`);
  }
}

// --- plugin / mcp manifests -------------------------------------------------
const plugin = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'));
const mcp = JSON.parse(fs.readFileSync(path.join(root, 'mcp.json'), 'utf8'));
if (plugin.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') throw new Error('plugin schema mismatch');
if (mcp.$schema !== 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json') throw new Error('mcp schema mismatch');
if (!mcp.mcpServers?.['drip-seo']) throw new Error('missing drip-seo MCP server');

// --- MCP tool surface -------------------------------------------------------
const serverText = fs.readFileSync(path.join(root, 'src/server.ts'), 'utf8');
const TOOLS = [
  'search_products',
  'get_product_context',
  'get_product_images',
  'prepare_product_v44',
  'execute_product_v44',
  'verify_product_v44',
  'search_categories',
  'get_category_context',
  'prepare_category_seo',
  'execute_category_seo',
  'verify_category_seo',
  'get_run_status',
];
for (const tool of TOOLS) {
  if (!serverText.includes(`"${tool}"`)) throw new Error(`Missing MCP tool ${tool}`);
}
if (/delete_product|delete_category/.test(serverText)) throw new Error('unexpected delete tool');

// --- standard identity must travel with every tool result -------------------
for (const field of ['standard_version', 'standard_hash', 'standard_file']) {
  if (!serverText.includes(field)) throw new Error(`src/server.ts does not expose ${field}`);
}
const resultText = fs.readFileSync(path.join(root, 'src/result.ts'), 'utf8');
if (!resultText.includes('standardEnvelope')) throw new Error('src/result.ts does not attach the standard envelope');

console.log('PACKAGE CHECK PASS');
console.log(`MCP tools declared: ${TOOLS.length}`);
console.log(`Canonical standard: ${CANONICAL}`);
console.log(`Canonical standard sha256: ${standardHash}`);
