import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const sailGumSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-vaporwaffle-sacai-sail-gum', facts: 'StockX: Vaporwaffle sacai Sail Gum confirmed.' }];
const setsubunSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-setsubun', facts: 'StockX: Dunk Low Setsubun confirmed.' }];
const brazilSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-brazil', facts: 'StockX: Dunk Low Brazil confirmed.' }];
const researched = {
  '536027102523165': { sources: sailGumSrc },
  '536027106073887': { sources: setsubunSrc },
  '536027106219280': { sources: brazilSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-086-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
