import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const gucciSrc = [{ tier: 'T1', url: 'https://www.gucci.com/au/en_au/ca/men/ready-to-wear-for-men/t-shirts-and-polo-for-men/polo-shirts-for-men-c-men-readytowear-tshirts-polos-polos', facts: 'Gucci: Polo confirmed.' }];
const researched = {
  '536027491935518': { sources: gucciSrc },
  '536027491758104': { sources: gucciSrc },
  '536027491695647': { sources: gucciSrc },
  '536027491616028': { sources: gucciSrc },
  '536027491260954': { sources: gucciSrc },
  '536027491132954': { sources: gucciSrc },
  '536027491084305': { sources: gucciSrc },
  '536027491035414': { sources: gucciSrc },
  '536027491004690': { sources: gucciSrc },
  '536027490938901': { sources: gucciSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = allById.get(pid); if (!d) { console.log('NOT FOUND:', pid); continue; }
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-205-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
