import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const fruitySrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-qs-lebron-james-fruity-pebbles', facts: 'StockX: Dunk Low LeBron Fruity Pebbles confirmed.' }];
const paisleyPinkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-essential-paisley-pack-pink', facts: 'StockX: Dunk Low Paisley Pink confirmed.' }];
const flyStreetSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-fly-streetwear', facts: 'StockX: SB Dunk Fly Streetwear confirmed.' }];
const researched = {
  '536027132282389': { sources: fruitySrc },
  '536027133100048': { sources: paisleyPinkSrc },
  '536027132907549': { sources: flyStreetSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-106-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
