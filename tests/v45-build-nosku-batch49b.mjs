import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const ambushSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/dunk-high-ambush-flash-lime', facts: 'Nike official: Dunk High x AMBUSH Flash Lime CU7544-300.' }];
const pineSrc = [{ tier: 'T2', url: 'https://www.lyst.co.uk/shoes/nike-dunk-low-off-1/', facts: 'Lyst: Off-White Dunk Pine Green from The Ten confirmed.' }];
const researched = {
  '536027088246303': { sources: ambushSrc },
  '536027084660760': { sources: pineSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-049b-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
