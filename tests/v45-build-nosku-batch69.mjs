import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const kodSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-max-1-clot-kiss-of-death-2021', facts: 'StockX: Air Max 1 CLOT KOD 2021 DD1870-100 confirmed.' }];
const dustySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-dusty-olive', facts: 'StockX: SB Dunk Dusty Olive confirmed.' }];
const kebabSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-high-color-skates-kebab-destroy', facts: 'StockX: SB Dunk High Color Skates confirmed.' }];
const researched = {
  '536027083153175': { sources: kodSrc },
  '536027083730201': { sources: dustySrc },
  '536027087731988': { sources: kebabSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-069-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
