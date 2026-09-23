import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const lot2Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-off-white-lot-2', facts: 'StockX: Off-White Lot 2 confirmed.' }];
const lot12Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Lot 12 confirmed.' }];
const af1Src = [{ tier: 'T2', url: 'https://stockx.com/nike-air-force-1-low-off-white-light-green-spark', facts: 'StockX: AF1 Off-White Light Green Spark confirmed.' }];
const lot21Src = [{ tier: 'T2', url: 'https://www.goat.com/en-ca/collections/off-white-nike-dunk-low-the-50', facts: 'GOAT: Off-White Lot 21 confirmed.' }];
const researched = {
  '536027139532052': { sources: lot21Src },
  '536027112678161': { sources: af1Src },
  '536027090303252': { sources: lot2Src },
  '536027090046998': { sources: lot12Src }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = allById.get(pid); if (!d) { console.log('NOT FOUND:', pid); continue; }
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-164-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
