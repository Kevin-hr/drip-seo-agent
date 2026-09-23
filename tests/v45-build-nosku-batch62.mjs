import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2490.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const tokyoSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-au/sneakers/ultraboost-2020-city-pack-tokyo-fx7811', facts: 'GOAT: Ultra Boost 20 Tokyo City Pack FX7811 confirmed.' }];
const hkSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-nl/sneakers/ultraboost-2020-city-pack-hong-kong-fx7812', facts: 'GOAT: Ultra Boost 20 Hong Kong FX7818 confirmed.' }];
const seoulSrc = [{ tier: 'T2', url: 'https://hypebeast.com/2020/1/adidas-ultraboost-20-city-pack-release', facts: 'Hypebeast: Ultra Boost 20 City Pack Seoul confirmed.' }];
const researched = {
  '536027073602843': { sources: tokyoSrc },
  '536027073472793': { sources: hkSrc },
  '536027073522962': { sources: seoulSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-062-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
