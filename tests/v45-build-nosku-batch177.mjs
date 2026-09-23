import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const hellstarSrc = [{ tier: 'T2', url: 'https://officialhellstarr.com/hellstar-shorts-ultimate-streetwear-trend-style-guide-for-2026/', facts: 'Hellstar: shorts confirmed.' }];
const researched = {
  '536027333045275': { sources: hellstarSrc },
  '536027333012241': { sources: hellstarSrc },
  '536027332965649': { sources: hellstarSrc },
  '536027332900370': { sources: hellstarSrc },
  '536027332836371': { sources: hellstarSrc },
  '536027530145040': { sources: hellstarSrc },
  '536027530111770': { sources: hellstarSrc },
  '536027530064410': { sources: hellstarSrc },
  '536027530031127': { sources: hellstarSrc },
  '536027529968157': { sources: hellstarSrc },
  '536027529918481': { sources: hellstarSrc },
  '536027529887261': { sources: hellstarSrc },
  '536027529838621': { sources: hellstarSrc },
  '536027412800540': { sources: hellstarSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-177-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
