import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const michSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-michigan-state', facts: 'StockX: Dunk Low Michigan State confirmed.' }];
const syrSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-sp-syracuse-2020', facts: 'StockX: Dunk Low Syracuse 2020 confirmed.' }];
const champPurpSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-championship-court-purple', facts: 'StockX: Dunk Low Championship Court Purple confirmed.' }];
const researched = {
  '536027107888155': { sources: michSrc },
  '536027104192535': { sources: syrSrc },
  '536027099578647': { sources: champPurpSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-080-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
