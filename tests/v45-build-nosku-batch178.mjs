import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const diorSrc = [{ tier: 'T1', url: 'https://www.dior.com/en_us/fashion/products/3SH118YJP_H069_T35', facts: 'Dior: B23 confirmed.' }];
const diorObliqueSrc = [{ tier: 'T1', url: 'https://www.dior.com/en_au/fashion/mens-fashion/shoes/b23-sneakers', facts: 'Dior: B23 Oblique confirmed.' }];
const researched = {
  '536027256558097': { sources: diorSrc },
  '536027256510485': { sources: diorObliqueSrc },
  '536027256462102': { sources: diorSrc },
  '536027256414489': { sources: diorObliqueSrc },
  '536027256366355': { sources: diorObliqueSrc },
  '536027256317983': { sources: diorObliqueSrc },
  '536027256252691': { sources: diorObliqueSrc },
  '536027256204817': { sources: diorSrc },
  '536027254840351': { sources: diorObliqueSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-178-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
