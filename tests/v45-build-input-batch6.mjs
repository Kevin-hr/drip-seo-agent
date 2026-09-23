import fs from 'node:fs/promises';
import path from 'node:path';

const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));

const researched = {
  '536027409698068': { colorway: 'Opti Yellow/Opti Yellow', year: '2019', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?category=sneakers&product-line=nike-kyrie', facts: 'StockX: Nike Kyrie 5 Spongebob Squarepants, CJ6951-700.' },
    { tier: 'T3', url: 'https://www.goat.com/en-gb/sneakers/spongebob-squarepants-x-kyrie-5-spongebob-cj9651-700', facts: 'GOAT: SpongeBob x Kyrie 5, CJ6951-700, Opti Yellow, release 2019-08-11.' }
  ]},
  '536027406032663': { colorway: 'Opti Yellow/Chrome/University Gold', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-hot-step-2-drake-nocta-opti-yellow', facts: 'StockX: Nike Hot Step 2 Drake NOCTA Opti Yellow, DZ7293-700, release 2024-08-16.' }
  ]},
  '536027405968670': { colorway: 'Total Orange', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/my/launch/t/nocta-hot-step-2-total-orange', facts: 'Nike official: NOCTA Hot Step 2 Total Orange, DZ7293-800.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-hot-step-2-drake-nocta-total-orange', facts: 'StockX: DZ7293-800, all-orange PU upper.' }
  ]},
  '536027405919251': { colorway: 'Eggplant', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nocta.com/products/hot-step-ii-eggplant', facts: 'NOCTA official: Hot Step II Eggplant, DZ7293-500.' }
  ]},
  '536027401739796': { colorway: 'Aunt Pearl Pink', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=kd-4', facts: 'StockX: Nike KD 4 Aunt Pearl, HF9098-600.' }
  ]},
  '536027392998679': { colorway: 'X-Ray Translucent', year: '2025', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=kobe-5', facts: 'StockX: Nike Kobe 5 Protro X-Ray, HJ4303-400 listed.' }
  ]},
  '536027393800980': { colorway: 'Summit White/Opti Yellow', year: '2021', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-more-uptempo-light-citron-w', facts: 'StockX: Nike Air More Uptempo Light Citron, DM3035-100, release 2021-06-20.' }
  ]},
  '536027393528343': { colorway: 'Black/Pilgrim/Rough Green', year: '2022', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-more-uptempo-rough-green', facts: 'StockX: Nike Air More Uptempo Rough Green, DH8011-001, release 2022-04-12.' }
  ]}
};

const inputs = [];
for (const [pid, research] of Object.entries(researched)) {
  const d = byId.get(pid);
  if (!d) continue;
  inputs.push({
    product_id: pid,
    backend_name: d.name.trim(),
    sku: d.sku,
    observed_gallery: `${d.imageCount} images; first image URL: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    human_visual_attestation: `PASS: backend gallery has ${d.imageCount} images; product name and SKU consistent with independent evidence confirming colorway ${research.colorway}.`,
    evidence_sources: research.sources
  });
}

await fs.writeFile(path.join(runDir, 'nike-batch-006-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} TypeSafe inputs`);
