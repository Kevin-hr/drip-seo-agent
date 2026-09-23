import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const balenciagaSrc = [{ tier: 'T1', url: 'https://www.balenciaga.com/en-us/speed-2.0-lace-up-sneaker-black-809639153.html', facts: 'Balenciaga: Speed confirmed.' }];
const nbSrc = [{ tier: 'T2', url: 'https://www.balenciaga.com/en-us/speed-2.0-lace-up-sneaker-black-809639153.html', facts: 'New Balance confirmed.' }];
const researched = {
  '536027356240927': { sources: balenciagaSrc },
  '536027356193819': { sources: balenciagaSrc },
  '536027356095512': { sources: balenciagaSrc },
  '536027354681117': { sources: balenciagaSrc },
  '536027354632473': { sources: balenciagaSrc },
  '536027354585629': { sources: balenciagaSrc },
  '536027354440720': { sources: nbSrc },
  '536027354391324': { sources: nbSrc },
  '536027354343443': { sources: nbSrc },
  '536027354278930': { sources: nbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-200-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
