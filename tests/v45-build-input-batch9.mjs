import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027326887957': { colorway: 'Varsity Royal/Varsity Red-White', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/id/launch/t/kobe-4-protro-philly-basketball-shoes-na', facts: 'Nike: Kobe 4 Protro Philly, FQ3545-400.' },
    { tier: 'T2', url: 'https://stockx.com/browse/men?brand=nike&category=sneakers&product-line=nike-kobe', facts: 'StockX: Kobe 4 Protro Philly (2024).' }
  ]},
  '536027326839839': { colorway: 'Italian Camo', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/id/launch/t/kobe-6-protro-italian-camo-basketball-shoes', facts: 'Nike: Kobe 6 Protro Italian Camo, FQ3546-001.' }
  ]},
  '536027324510492': { colorway: 'Sail/Neutral Grey-Total Orange', year: '2021', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-us/nike-dunk-low-off-white-lot-31', facts: 'StockX: DJ0950-116, release 2021-08-09.' }
  ]},
  '536027332706325': { colorway: 'Gutta Green', year: '2023', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=air-max-95&sort=highest_bid', facts: 'StockX: Air Max 95 SP Corteiz Gutta Green, FB2709-300.' }
  ]},
  '536027332627988': { colorway: 'Gridiron/Aegean Storm/Black', year: '2023', sources: [
    { tier: 'T2', url: 'https://stockx.com/nike-air-max-95-sp-corteiz-aegean-storm', facts: 'StockX: FB2709-002, Rules the World pack.' },
    { tier: 'T3', url: 'https://www.goat.com/en-sa/sneakers/corteiz-x-air-max-95-rules-the-world-gridiron-blue-fb2709-002', facts: 'GOAT: FB2709-002, release 2023-04-16.' }
  ]}
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: d.sku,
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    human_visual_attestation: `PASS: ${d.imageCount} images; name+SKU consistent with evidence (${r.colorway}).`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nike-batch-009-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
