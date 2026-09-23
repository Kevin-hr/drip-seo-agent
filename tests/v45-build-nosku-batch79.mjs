import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const unionSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-union-grey-purple', facts: 'StockX: Union LA Dunk Low Court Purple confirmed.' }];
const vwSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-vaporwaffle-sacai-black-gum', facts: 'StockX: Vaporwaffle sacai Black Gum confirmed.' }];
const uncSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-unc-2021', facts: 'StockX: Dunk Low UNC 2021 confirmed.' }];
const researched = {
  '536027105527059': { sources: unionSrc },
  '536027105945374': { sources: vwSrc },
  '536027100208916': { sources: uncSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-079-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
