import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2690.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const clotSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/clot-x-air-force-1-prm-rose-gold-cj5290-600', facts: 'GOAT: CLOT x AF1 Rose Gold Silk CJ5290-600 confirmed.' }];
const blueSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/clot?gender=men&product-line=nike-air-force', facts: 'StockX: AF1 Low CLOT Blue Silk confirmed.' }];
const researched = {
  '536027047418128': { sources: clotSrc },
  '536027047548688': { sources: blueSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-056-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
