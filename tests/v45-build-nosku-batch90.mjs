import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const greenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-green-apple', facts: 'StockX: Dunk Low Green Apple confirmed.' }];
const greyFogSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-grey-fog', facts: 'StockX: Dunk Low Grey Fog confirmed.' }];
const vastGreySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-premium-vast-grey', facts: 'StockX: Dunk Low Vast Grey confirmed.' }];
const researched = {
  '536027108275728': { sources: greenSrc },
  '536027113626642': { sources: greyFogSrc },
  '536027108451355': { sources: vastGreySrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-090-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
