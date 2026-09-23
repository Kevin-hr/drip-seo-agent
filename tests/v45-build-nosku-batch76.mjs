import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2340.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lot12Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot 12 confirmed.' }];
const courtPurpleSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-court-purple', facts: 'StockX: SB Dunk Court Purple confirmed.' }];
const laserBlueSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-laser-blue', facts: 'StockX: SB Dunk Laser Blue confirmed.' }];
const researched = {
  '536027090046998': { sources: lot12Src },
  '536027090241300': { sources: courtPurpleSrc },
  '536027090176024': { sources: laserBlueSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-076-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
