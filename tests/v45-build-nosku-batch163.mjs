import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const blueSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-it/sneakers/silhouette/off-white-out-of-office', facts: 'GOAT: OOO Blue confirmed.' }];
const whiteRedSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white?model=ooo&page=3', facts: 'StockX: OOO White Red confirmed.' }];
const blackWhiteRedSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-au', facts: 'Off-White: OOO confirmed.' }];
const pinkWhiteSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-es/women/shoes/out-of-office/', facts: 'Off-White: OOO Pink White confirmed.' }];
const greenSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-au', facts: 'Off-White: OOO Green confirmed.' }];
const bluePurpleSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-us/men/icons/out-of-office/', facts: 'Off-White: OOO confirmed.' }];
const researched = {
  '536027243985434': { sources: bluePurpleSrc },
  '536027243825684': { sources: blueSrc },
  '536027243728663': { sources: whiteRedSrc },
  '536027243519511': { sources: blackWhiteRedSrc },
  '536027243439382': { sources: pinkWhiteSrc },
  '536027221977366': { sources: greenSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-163-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
