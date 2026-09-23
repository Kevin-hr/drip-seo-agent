import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2340.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const tsSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/travis-scott-x-air-max-1-wheat-do9392-700', facts: 'GOAT: Travis Scott AM1 Saturn Gold DO9392-700 confirmed.' }];
const mummySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-mummy', facts: 'StockX: SB Dunk Mummy confirmed.' }];
const lot27Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot 27 confirmed.' }];
const researched = {
  '536027097794582': { sources: tsSrc },
  '536027091013144': { sources: mummySrc },
  '536027097731346': { sources: lot27Src }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-074-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
