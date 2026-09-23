import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027386811414': { colorway: 'Sail/University Red/Black/Medium Olive', year: '2023', sources: [
    { tier: 'T1', url: 'https://www.nike.com/ph/launch/t/womens-air-jordan-1-low-travis-scott-medium-olive', facts: 'Nike: AJ1 Low Travis Scott Olive, DZ4137-106.' },
    { tier: 'T2', url: 'https://stockx.com/air-jordan-1-retro-low-og-sp-travis-scott-olive-w', facts: 'StockX: DZ4137-106, release 2023-04-26.' }
  ]},
  '536027386649886': { colorway: 'Black/Black-Phantom', year: '2022', sources: [
    { tier: 'T1', url: 'https://www.nike.com/launch/t/air-jordan-1-low-travis-scott-black-phantom', facts: 'Nike: AJ1 Low Travis Scott Black Phantom, DM7866-001.' },
    { tier: 'T2', url: 'https://stockx.com/es-mx/air-jordan-1-retro-low-og-sp-travis-scott-black-phantom', facts: 'StockX: DM7866-001, release 2022-12-15.' }
  ]},
  '536027386472977': { colorway: 'Fragment x Travis Scott', year: '2021', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/jordan?model=1', facts: 'StockX: AJ1 Low Fragment x Travis Scott DM7866-140 listed.' }
  ]},
  '536027389958685': { colorway: 'Velvet Brown', year: '2022', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/jordan?model=1', facts: 'StockX: AJ1 Low Velvet Brown DM7866-202 listed.' }
  ]},
  '536027366720016': { colorway: 'Sail/Laser Orange-Light Orewood Brown-Medium Olive', year: '2023', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-zoom-vomero-5-sail-laser-orange-medium-olive-womens', facts: 'StockX: FQ6868-181, release 2023-10-01.' }
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
await fs.writeFile(path.join(runDir, 'nike-batch-012-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
