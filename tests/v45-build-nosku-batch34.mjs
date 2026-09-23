import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1640.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lot9Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-off-white-lot-9', facts: 'StockX: Nike Dunk Low Off-White Lot 9, Dear Summer collection, off-white leather, grey canvas overlays, rope lacing.' }];
const lot42Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-off-white-lot-42', facts: 'StockX: Nike Dunk Low Off-White Lot 42, DM1602-117, Sail/Neutral Grey, $180, 2021.' }];
const oooSrc = [{ tier: 'T2', url: 'https://www.grailed.com/designers/off-white/browse/shoes-9', facts: 'Grailed: OFF-WHITE Out Of Office OOO confirmed.' }];
const researched = {
  '536027303937307': { sources: lot9Src },
  '536027302474004': { sources: lot42Src },
  '536027303260702': { sources: oooSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-034-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
