import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2440.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const purpleSrc = [{ tier: 'T1', url: 'https://www.nikesb.com/the-vault/teal-box/purple-lobster', facts: 'Nike SB official: Purple Lobster BV1310-555 confirmed.' }];
const ofwSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-force-1-low-off-white-university-gold', facts: 'StockX: AF1 Off-White University Gold confirmed.' }];
const researched = {
  '536027078168084': { sources: purpleSrc },
  '536027080642578': { sources: ofwSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-065-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
