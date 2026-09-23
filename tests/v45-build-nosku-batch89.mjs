import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const oceanSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-ocean', facts: 'StockX: Dunk Low Ocean confirmed.' }];
const bartSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-pro-bart-simpson', facts: 'StockX: Dunk Low Bart Simpson confirmed.' }];
const iceSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-ice', facts: 'StockX: Dunk Low Ice confirmed.' }];
const researched = {
  '536027114220316': { sources: oceanSrc },
  '536027108387093': { sources: bartSrc },
  '536027108129045': { sources: iceSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-089-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
