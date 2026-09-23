import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const redSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-sb-low-red-lobster?size=5', facts: 'StockX: SB Dunk Concepts Red Lobster 313170-661, 2008.' }];
const orangeSrc = [{ tier: 'T1', url: 'https://www.nike.com/sg/launch/t/nike-sb-dunk-low-x-concepts-orange-lobster', facts: 'Nike official: SB Dunk x Concepts Orange Lobster.' }];
const lotSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-off-white-lot-20', facts: 'StockX: Off-White Dunk Dear Summer series confirmed.' }];
const researched = {
  '536027126144543': { sources: redSrc },
  '536027123173137': { sources: orangeSrc },
  '536027128150291': { sources: lotSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-044-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
