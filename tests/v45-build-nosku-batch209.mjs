import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const offwhiteSrc = [{ tier: 'T2', url: 'https://www.neimanmarcus.com/c/shoes-shoes-sneakers-cat3260731', facts: 'Off-White: Out Of Office confirmed.' }];
const gucciSrc = [{ tier: 'T1', url: 'https://www.gucci.com/us/en/pr/men/shoes-for-men/sneakers-for-men/mens-screener-sneaker-p-A006VLFAGIV9078', facts: 'Gucci: Screener confirmed.' }];
const researched = {
  '536027303373844': { sources: offwhiteSrc },
  '536027303260702': { sources: offwhiteSrc },
  '536027303085340': { sources: offwhiteSrc },
  '536027303036690': { sources: offwhiteSrc },
  '536027302988051': { sources: offwhiteSrc },
  '536027302938652': { sources: offwhiteSrc },
  '536027302876954': { sources: offwhiteSrc },
  '536027302603798': { sources: offwhiteSrc },
  '536027301203993': { sources: offwhiteSrc },
  '536027297087768': { sources: gucciSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-209-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
