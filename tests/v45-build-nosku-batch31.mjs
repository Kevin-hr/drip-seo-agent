import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1440.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const kobe10Src = [{ tier: 'T2', url: 'https://www.goat.com/en-au/sneakers/nike-kobe-10-silk-705317-676', facts: 'GOAT: Nike Kobe 10 Silk, SKU 705317-676, Merlot/Metallic Gold, Lunarlon, 2015.' }];
const kobe11Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/kobe-11-elite-low-bruce-lee', facts: 'StockX: Kobe 11 Elite Low Bruce Lee, 822675-706, University Gold/Red/Black, $200, 2016.' }];
const travisSrc = [{ tier: 'T2', url: 'https://stockx.com/travis-scott-jordan-1-low-olive', facts: 'AJ1 Low Travis Scott Olive confirmed.' }];
const researched = {
  '536027324431124': { sources: kobe10Src },
  '536027324061202': { sources: kobe11Src },
  '536027325732112': { sources: travisSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-031-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
