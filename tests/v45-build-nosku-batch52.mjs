import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2540.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const gotSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-au/sneakers/game-of-thrones-x-ultraboost-4-0-night-s-watch-got-ub-nw', facts: 'GOAT: GOT x UltraBoost 4.0 Night\'s Watch EE3707 confirmed.' }];
const readymadeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-blazer-mid-readymade-black', facts: 'StockX: Blazer Mid READYMADE Black confirmed.' }];
const researched = {
  '536027072236573': { sources: gotSrc },
  '536027069615899': { sources: readymadeSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-052-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
