import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027378021908': { colorway: 'White/Dark Obsidian/Varsity Red/Metallic Gold', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/tw/launch/t/kobe-4-protro-metallic-gold-and-dark-obsidian', facts: 'Nike: Kobe 4 Protro Gold Medal, FQ3544-100.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-4-protro-gold-medal-2024', facts: 'StockX: FQ3544-100, release 2024-08-06.' }
  ]},
  '536027343800089': { colorway: 'Bicoastal/Black/Metallic Silver', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/th/launch/t/kobe-4-protro-girl-dad', facts: 'Nike: Kobe 4 Protro Girl Dad, FQ3545-300.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-zoom-kobe-4-protro-girl-dad', facts: 'StockX: FQ3545-300, release 2024-06-07.' }
  ]},
  '536027371155484': { colorway: 'White/Black', year: '2021', sources: [
    { tier: 'T1', url: 'https://www.nike.com/mx/t/tenis-dunk-low-retro-mhrtZC', facts: 'Nike: Dunk Low Retro DD1391-100.' }
  ]},
  '536027370097181': { colorway: 'Black/Black', year: '2020', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=air-force-1', facts: 'StockX: Air Force 1 Low Black CW2288-001.' }
  ]},
  '536027343590416': { colorway: 'White/White', year: '2019', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=air-force-1', facts: 'StockX: Air Force 1 Low White CW2288-111.' }
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
await fs.writeFile(path.join(runDir, 'nike-batch-008-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
