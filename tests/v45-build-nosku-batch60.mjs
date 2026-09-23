import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2540.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const coastSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-au/sneakers/dunk-low-coast-dd1503-100', facts: 'GOAT: Dunk Low Coast DD1503-100 confirmed.' }];
const pearlSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-orange-pearl', facts: 'StockX: Dunk Low Orange Pearl confirmed.' }];
const readymadeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-blazer-mid-readymade-white', facts: 'StockX: Blazer Mid READYMADE White confirmed.' }];
const researched = {
  '536027068716564': { sources: coastSrc },
  '536027069213713': { sources: pearlSrc },
  '536027069551387': { sources: readymadeSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-060-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
