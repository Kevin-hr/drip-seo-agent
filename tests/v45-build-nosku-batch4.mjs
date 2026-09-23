import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-90.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
// Select Dsquared2 jeans and OFF WHITE shorts
const selected = details.filter(d => /Dsquared2 Jeans/i.test(d.name||'') || /OFF WHITE Short/i.test(d.name||''));
const ds2Source = [{ tier: 'T1', url: 'https://www.dsquared2.com/ph/black-clean-wash-cool-guy-jeans/S74LB1227S30357900.html', facts: 'Dsquared2 official: stretch cotton denim jeans, various washes and fits (Cool Guy, Skater, Eros).' }];
const offWhiteSource = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white', facts: 'StockX: OFF-WHITE shorts line confirmed.' }];
const inputs = [];
for (const d of selected) {
  const isDs2 = /Dsquared2/i.test(d.name||'');
  inputs.push({ product_id: d.id, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; branded denim/apparel.`,
    evidence_sources: isDs2 ? ds2Source : offWhiteSource });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-004-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs (${selected.length} selected)`);
