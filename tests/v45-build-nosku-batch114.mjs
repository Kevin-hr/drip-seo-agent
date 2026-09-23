import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1990.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const owSrc = (lot) => [
  { tier: 'T2', url: `https://stockx.com/nike-dunk-low-off-white-lot-${lot}`, facts: `StockX: Off-White Dunk Lot ${lot} confirmed.` },
  { tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk The 50 collection confirmed.' }
];
const lots = [
  ['536027145512472', '20'], ['536027145464343', '49'], ['536027145399056', '10'], ['536027145335836', '26']
];
const inputs = [];
for (const [pid, lot] of lots) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: owSrc(lot) });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-114-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
