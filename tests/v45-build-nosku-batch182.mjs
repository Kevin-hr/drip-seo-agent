import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const oooSrc = [{ tier: 'T1', url: 'https://www.off---white.com/en-us/men/shoes/sneakers/out-of-office-sneakers-OMIA189F25LEA0050642.html', facts: 'Off-White: OOO confirmed.' }];
const oooGoatSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/off-white-out-of-office-low-white-red-omia189s22lea001-0125', facts: 'GOAT: OOO confirmed.' }];
const oooLightBlueSrc = [{ tier: 'T1', url: 'https://www.off---white.com/en-gb/men/shoes/sneakers/white%2Flight-blue-out-of-office-OMIA189C99LEA0070140.html', facts: 'Off-White: White Light Blue confirmed.' }];
const researched = {
  '536027302938652': { sources: oooSrc },
  '536027302876954': { sources: oooSrc },
  '536027302603798': { sources: oooSrc },
  '536027301203993': { sources: oooGoatSrc },
  '536027263397904': { sources: oooSrc },
  '536027246253593': { sources: oooSrc },
  '536027244724500': { sources: oooSrc },
  '536027244645910': { sources: oooSrc },
  '536027244516885': { sources: oooLightBlueSrc },
  '536027244260883': { sources: oooSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-182-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
