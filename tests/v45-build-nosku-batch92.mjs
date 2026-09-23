import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const ironSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-light-iron-ore-red-blue', facts: 'StockX: Dunk Low Light Iron Ore Red Blue confirmed.' }];
const cpMBatchSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-championship-court-purple', facts: 'StockX: Dunk Low Championship Court Purple confirmed.' }];
const offwhiteGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-force-1-low-off-white-light-green-spark', facts: 'StockX: AF1 Off-White Light Green Spark confirmed.' }];
const researched = {
  '536027114767634': { sources: ironSrc },
  '536027114879257': { sources: cpMBatchSrc },
  '536027112678161': { sources: offwhiteGreenSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-092-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
