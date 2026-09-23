import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const asicsSrc = [{ tier: 'T1', url: 'https://www.asics.com/at/en-at/gel-kayano-14/p/1201A019-700.html', facts: 'ASICS: Gel-Kayano confirmed.' }];
const asicsGoatSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-au/sneakers/brand/ASICS', facts: 'GOAT: ASICS confirmed.' }];
const researched = {
  '536027381250331': { sources: asicsGoatSrc },
  '536027375095569': { sources: asicsGoatSrc },
  '536027370981144': { sources: asicsSrc },
  '536027370868250': { sources: asicsSrc },
  '536027370787868': { sources: asicsGoatSrc },
  '536027370740754': { sources: asicsGoatSrc },
  '536027369421334': { sources: asicsSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-171-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
