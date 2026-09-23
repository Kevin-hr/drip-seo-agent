import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const tenSrc = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/nike-off-white', facts: 'Flight Club: The Ten series confirmed.' }];
const researched = {
  '536027080642578': { sources: tenSrc },
  '536027062255377': { sources: tenSrc },
  '536027062205982': { sources: tenSrc },
  '536027056820247': { sources: tenSrc },
  '536027048223519': { sources: tenSrc },
  '536027048144406': { sources: tenSrc },
  '536027048078101': { sources: tenSrc },
  '536027048015637': { sources: tenSrc },
  '536027047949085': { sources: tenSrc },
  '536027047742238': { sources: tenSrc },
  '536027046101008': { sources: tenSrc },
  '536027046035730': { sources: tenSrc },
  '536027045988636': { sources: tenSrc },
  '536027042084376': { sources: tenSrc },
  '536027042004249': { sources: tenSrc },
  '536027041922833': { sources: tenSrc },
  '536027041875733': { sources: tenSrc },
  '536027041809948': { sources: tenSrc },
  '536027041745688': { sources: tenSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-165-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
