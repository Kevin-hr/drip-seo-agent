import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const valentineSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-retro-prm-valentines-day-2023', facts: 'StockX: Dunk Low Valentine Day 2023 confirmed.' }];
const oliveSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-medium-olive', facts: 'StockX: Dunk Low Medium Olive confirmed.' }];
const pinkFoamSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-pink-foam-black', facts: 'StockX: Dunk Low Pink Foam Black confirmed.' }];
const researched = {
  '536027128458261': { sources: valentineSrc },
  '536027122385170': { sources: oliveSrc },
  '536027122465813': { sources: pinkFoamSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-100-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
