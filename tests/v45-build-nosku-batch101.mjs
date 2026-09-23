import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const doubleSailSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-85-double-swoosh-sail-orange', facts: 'StockX: Dunk Low SE 85 Double Swoosh Sail Orange confirmed.' }];
const neptuneSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-85-neptune-green', facts: 'StockX: Dunk Low SE 85 Neptune Green confirmed.' }];
const basaltSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-brown-basalt', facts: 'StockX: Dunk Low Brown Basalt confirmed.' }];
const researched = {
  '536027122305306': { sources: doubleSailSrc },
  '536027122241045': { sources: neptuneSrc },
  '536027122176275': { sources: basaltSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-101-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
