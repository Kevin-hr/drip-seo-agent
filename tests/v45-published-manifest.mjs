// Collects the authoritative list of products published by the V4.5 batch pipeline.
// Source of truth = execution-results.json (success === true), enriched from *-plans.json.
// Usage: node tests/v45-published-manifest.mjs [--out <dir>]
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('.');
const RUNS = path.join(ROOT, 'data', 'runs');
const outArgIdx = process.argv.indexOf('--out');
const OUT = path.resolve(outArgIdx > -1 ? process.argv[outArgIdx + 1] : path.join(ROOT, 'reports'));

async function walk(dir, filter) {
  const found = [];
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return found; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full, filter));
    else if (filter(entry.name)) found.push(full);
  }
  return found;
}

// 1. Collect plan metadata (product_id -> { name, slug, batch file })
const planFiles = (await walk(RUNS, (n) => /plans\.json$/i.test(n))).sort();
const planById = new Map();
const planSource = new Map();
for (const file of planFiles) {
  let plans;
  try { plans = JSON.parse(await fs.readFile(file, 'utf8')); } catch { continue; }
  if (!Array.isArray(plans)) continue;
  for (const plan of plans) {
    const id = String(plan.product_id);
    if (!id || !plan.slug) continue;
    planById.set(id, plan);
    if (!planSource.has(id)) planSource.set(id, path.relative(ROOT, file).replace(/\\/g, '/'));
  }
}

// 2. Collect successful executions (product_id -> evidence)
const resultFiles = (await walk(RUNS, (n) => n === 'execution-results.json')).sort();
const published = new Map();
for (const file of resultFiles) {
  let results;
  try { results = JSON.parse(await fs.readFile(file, 'utf8')); } catch { continue; }
  if (!Array.isArray(results)) continue;
  for (const result of results) {
    if (result.success !== true) continue;
    const id = String(result.product_id);
    const steps = Object.fromEntries((result.steps || []).map((s) => [s.step, s]));
    const canonical = steps['frontend-readback']?.canonical || null;
    const receipt = steps['save-receipt']?.ids || [];
    const existing = published.get(id);
    const record = {
      product_id: id,
      product_name: planById.get(id)?.product_name || steps['frontend-readback']?.h1 || '(unknown)',
      target_url: canonical,
      slug: canonical ? canonical.replace('https://www.dripsneakers.org/', '') : planById.get(id)?.slug || null,
      seo_title: planById.get(id)?.seo_title || null,
      meta_description: planById.get(id)?.meta_description || null,
      seo_keywords: planById.get(id)?.seo_keywords || null,
      type: canonical ? 'canonical' : 'path',
      completed_at: result.completed_at || null,
      run: path.relative(ROOT, file).replace(/\\/g, '/'),
      save_receipt: receipt,
      plan_source: planSource.get(id) || null,
      has_backend_readback: Boolean(steps['backend-readback']),
    };
    if (!existing || (record.completed_at || '') > (existing.completed_at || '')) published.set(id, record);
  }
}

// 3. Categorise + report gaps
const rows = [...published.values()].sort((a, b) => (a.completed_at || '').localeCompare(b.completed_at || ''));
const missingUrl = rows.filter((r) => !r.target_url);
const missingPlan = rows.filter((r) => !r.plan_source);
const noBackendReadback = rows.filter((r) => !r.has_backend_readback);

console.log(`plan files scanned      : ${planFiles.length}`);
console.log(`result files scanned    : ${resultFiles.length}`);
console.log(`unique published (PASS) : ${rows.length}`);
console.log(`missing target url      : ${missingUrl.length}${missingUrl.length ? ` -> ${missingUrl.map((r) => r.product_id).join(', ')}` : ''}`);
console.log(`missing plan enrichment : ${missingPlan.length}${missingPlan.length ? ` -> ${missingPlan.map((r) => r.product_id).join(', ')}` : ''}`);
console.log(`missing backend readback: ${noBackendReadback.length}`);
console.log('');

const host = 'https://www.dripsneakers.org/';
await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, 'V4.5_PUBLISHED_MANIFEST.json'), `${JSON.stringify(rows, null, 2)}\n`);

const csv = ['n,product_id,product_name,url,seo_title,completed_at'];
rows.forEach((r, i) => {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  csv.push([i + 1, r.product_id, q(r.product_name), r.target_url || `${host}${r.slug}`, q(r.seo_title), r.completed_at].join(','));
});
await fs.writeFile(path.join(OUT, 'V4.5_PUBLISHED_MANIFEST.csv'), `${csv.join('\n')}\n`);

const md = ['# V4.5 Published Manifest', '', `**Generated:** ${new Date().toISOString()}`, `**Total published (verified PASS):** ${rows.length}`, '', '| # | Product | URL | PID |', '|---|---------|-----|-----|'];
rows.forEach((r, i) => md.push(`| ${i + 1} | ${r.product_name} | ${r.target_url || host + r.slug} | ${r.product_id} |`));
await fs.writeFile(path.join(OUT, 'V4.5_PUBLISHED_MANIFEST.md'), `${md.join('\n')}\n`);
console.log(`wrote: ${path.relative(ROOT, path.join(OUT, 'V4.5_PUBLISHED_MANIFEST.json'))}`);
console.log(`wrote: ${path.relative(ROOT, path.join(OUT, 'V4.5_PUBLISHED_MANIFEST.csv'))}`);
console.log(`wrote: ${path.relative(ROOT, path.join(OUT, 'V4.5_PUBLISHED_MANIFEST.md'))}`);
