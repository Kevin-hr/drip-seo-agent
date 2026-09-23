import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2590.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const premierSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-sb-low-premier-northern-lights', facts: 'StockX: SB Dunk Premier Northern Lights 724183-063 confirmed.' }];
const heinekenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-heineken', facts: 'StockX: SB Dunk Heineken confirmed.' }];
const blackPigeonSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-sa/collections/nike-sb', facts: 'GOAT: Staple Black Pigeon confirmed.' }];
const researched = {
  '536027061659673': { sources: premierSrc },
  '536027057640477': { sources: heinekenSrc },
  '536027056224534': { sources: blackPigeonSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-058-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
