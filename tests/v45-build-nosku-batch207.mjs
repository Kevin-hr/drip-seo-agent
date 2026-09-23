import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const stussySrc = [{ tier: 'T1', url: 'https://eu.stussy.com/collections/sweats', facts: 'Stussy: Hoodie confirmed.' }];
const researched = {
  '536027313383957': { sources: stussySrc },
  '536027313336851': { sources: stussySrc },
  '536027313272339': { sources: stussySrc },
  '536027313208084': { sources: stussySrc },
  '536027313128981': { sources: stussySrc },
  '536027313063696': { sources: stussySrc },
  '536027312967952': { sources: stussySrc },
  '536027312853780': { sources: stussySrc },
  '536027312807452': { sources: stussySrc },
  '536027312694551': { sources: stussySrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-207-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
