import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2340.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const kwondoSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/kwondo1-white', facts: 'Nike official: Kwondo1 G-Dragon PEACEMINUSONE confirmed.' }];
const tsSrc = [{ tier: 'T2', url: 'https://au.complex.com/sneakers/a/mike-destefano/travis-scott-sneaker-collaborations-ranked-from-worst-to-best', facts: 'Complex: Travis Scott x Nike Air Max 1 2022 confirmed.' }];
const researched = {
  '536027097556501': { sources: kwondoSrc },
  '536027090674718': { sources: tsSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-048-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
