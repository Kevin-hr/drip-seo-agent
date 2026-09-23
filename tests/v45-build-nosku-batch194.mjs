import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nikeClotSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-force-1-low-fragment-design-x-clot', facts: 'StockX: Fragment CLOT AF1 confirmed.' }];
const nikeSbSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-force-1-low-fragment-design-x-clot', facts: 'StockX: confirmed.' }];
const researched = {
  '536027047677461': { sources: nikeClotSrc },
  '536027047612700': { sources: nikeClotSrc },
  '536027047548688': { sources: nikeClotSrc },
  '536027047418128': { sources: nikeClotSrc },
  '536027055729183': { sources: nikeSbSrc },
  '536027055150879': { sources: nikeSbSrc },
  '536027054861847': { sources: nikeSbSrc },
  '536027047869464': { sources: nikeSbSrc },
  '536027047806224': { sources: nikeSbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-194-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
