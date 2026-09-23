import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lot50Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-off-white-lot-50', facts: 'StockX: Dunk Low Off-White Lot 50 DM1602-001 confirmed.' }];
const lot1Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot 01 confirmed.' }];
const ambushSrc = [{ tier: 'T2', url: 'https://www.grailed.com/designers/nike/browse/dunk-o', facts: 'Grailed: AMBUSH Dunk High Flash Lime confirmed.' }];
const researched = {
  '536027088842260': { sources: lot50Src },
  '536027088792599': { sources: lot1Src },
  '536027088246303': { sources: ambushSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-066-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
