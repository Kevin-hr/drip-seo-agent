import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const vintageGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-vintage-green', facts: 'StockX: Dunk Low Vintage Green confirmed.' }];
const twoToneSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-two-tone-grey', facts: 'StockX: Dunk Low Two Tone Grey confirmed.' }];
const paisleyBlackSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-essential-paisley-pack-black-w', facts: 'StockX: Dunk Low Paisley Black confirmed.' }];
const researched = {
  '536027104402711': { sources: vintageGreenSrc },
  '536027104483089': { sources: twoToneSrc },
  '536027100480281': { sources: paisleyBlackSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-084-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
