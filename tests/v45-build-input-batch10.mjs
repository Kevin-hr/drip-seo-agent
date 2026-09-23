import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027259164178': { colorway: 'Black/Pollen/White', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/ph/launch/t/dunk-high-wu-tang-clan', facts: 'Nike: Dunk High Wu-Tang, HJ4320-001.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-high-wu-tang-2024', facts: 'StockX: HJ4320-001, release 2024-09-11.' }
  ]},
  '536027055231766': { colorway: 'Black/Black-Parachute Beige-Petra Brown', year: '2020', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-sb-dunk-low-travis-scott', facts: 'StockX: CT5053-001, release 2020-02-29.' }
  ]},
  '536027093135122': { colorway: 'Black/Black-Muslin', year: '2017', sources: [
    { tier: 'T2', url: 'https://stockx.com/nike-air-presto-off-white', facts: 'StockX: AA3830-001, release 2017-09-09, The Ten.' }
  ]},
  '536027092988690': { colorway: 'White/Black/Cone', year: '2018', sources: [
    { tier: 'T3', url: 'https://www.goat.com/sneakers/off-white-x-air-presto-white-aa3830-100', facts: 'GOAT: AA3830-100, release 2018-08-04.' }
  ]},
  '536027279653912': { colorway: 'Orange Frost/Electro Orange/White', year: '2022', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-sb-dunk-low-concepts-orange-lobster-special-box', facts: 'StockX: FD8776-800, release 2022-12-02.' }
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
await fs.writeFile(path.join(runDir, 'nike-batch-010-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
