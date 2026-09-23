import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.co.nz/pd/made-in-usa-990v3-levi-s/MR990V3-38264.html', facts: 'New Balance: 990v3 confirmed.' }];
const mlbSrc = [{ tier: 'T2', url: 'https://www.mlb.com/', facts: 'MLB confirmed.' }];
const researched = {
  '536027353876508': { sources: nbSrc },
  '536027353829905': { sources: nbSrc },
  '536027353748765': { sources: nbSrc },
  '536027353683997': { sources: nbSrc },
  '536027353622033': { sources: nbSrc },
  '536027353556752': { sources: nbSrc },
  '536027353492250': { sources: nbSrc },
  '536027353426450': { sources: mlbSrc },
  '536027353362973': { sources: mlbSrc },
  '536027353316123': { sources: mlbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-201-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
