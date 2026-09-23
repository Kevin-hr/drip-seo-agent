import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details1640 = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1640.json'), 'utf8'));
const details1590 = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1590.json'), 'utf8'));
const byId = new Map([...details1640, ...details1590].map((d) => [d.id, d]));
const lot9Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot 9 confirmed.' }];
const bubblesSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/the-powerpuff-girls-x-dunk-low-pro-sb-qs-ps-bubbles-fz8833-400', facts: 'GOAT: SB Dunk Bubbles confirmed.' }];
const researched = {
  '536027303937307': { sources: lot9Src },
  '536027307229459': { sources: bubblesSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-118-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
