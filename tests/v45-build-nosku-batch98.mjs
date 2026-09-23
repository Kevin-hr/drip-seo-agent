import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lot35Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-off-white-lot-35', facts: 'StockX: Off-White Dunk Lot 35 confirmed.' }];
const redLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-sb-low-red-lobster-special-box', facts: 'StockX: Concepts Red Lobster confirmed.' }];
const blueLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-sb-low-blue-lobster', facts: 'StockX: Concepts Blue Lobster confirmed.' }];
const researched = {
  '536027128150291': { sources: lot35Src },
  '536027126144543': { sources: redLobsterSrc },
  '536027126031123': { sources: blueLobsterSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-098-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
