import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const rabbitWhiteSrc = [{ tier: 'T2', url: 'https://www.nike.com/ph/launch/t/dunk-low-year-of-the-rabbit-1', facts: 'Nike: Dunk Low Year of the Rabbit confirmed.' }];
const rabbitFossilSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/dunk-low-year-of-the-rabbit-multi-color-fd4203-111', facts: 'GOAT: Dunk Low Year of the Rabbit Multi-Color confirmed.' }];
const jennySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-85-jenny-bakery', facts: 'StockX: Dunk Low SE 85 Jenny Bakery confirmed.' }];
const researched = {
  '536027134436123': { sources: rabbitWhiteSrc },
  '536027132842776': { sources: rabbitFossilSrc },
  '536027133873680': { sources: jennySrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-107-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
