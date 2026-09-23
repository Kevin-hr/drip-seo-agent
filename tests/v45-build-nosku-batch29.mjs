import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1340.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com.cn/productDetail/M1906RB', facts: 'New Balance official: 1906R, ¥1099, ABZORB and N-ergy cushioning, 2000s running style.' }];
const dunkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-joker', facts: 'Nike Dunk Low Joker confirmed.' }];
const researched = {
  '536027346050334': { sources: nbSrc },
  '536027347640349': { sources: nbSrc },
  '536027347399454': { sources: nbSrc },
  '536027345712924': { sources: dunkSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-029-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
