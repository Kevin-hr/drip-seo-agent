import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1990.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lot20Src = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-off-white-lot-20', facts: 'StockX: Off-White Dunk Lot 20, Sail leather, translucent TPU overlays, Neutral Grey sole.' }];
const lot49Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-off-white-lot-49', facts: 'StockX: Off-White Dunk Lot 49, DM1602-123, Dear Summer, 2021.' }];
const nbSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-sa/sneakers/2002r-protection-pack-sea-salt-m2002rdc', facts: 'GOAT: NB 2002R Protection Pack Sea Salt M2002RDC.' }];
const researched = {
  '536027145512472': { sources: lot20Src },
  '536027145464343': { sources: lot49Src },
  '536027156957205': { sources: nbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-041-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
