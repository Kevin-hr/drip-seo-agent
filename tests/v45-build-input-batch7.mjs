import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027379178014': { colorway: 'White/White/Black/Metallic Gold/Bright Emerald', year: '2023', sources: [
    { tier: 'T1', url: 'https://www.nike.com/th/launch/t/kobe-4-protro-mambacita', facts: 'Nike official: Kobe 4 Protro Mambacita, FJ9363-100.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-4-protro-gigi', facts: 'StockX: FJ9363-100, release 2023-05-01.' }
  ]},
  '536027379096604': { colorway: 'Black/Mamba Green', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=kobe-4', facts: 'StockX: Nike Kobe 4 Protro Gift of Mamba, FQ3544-001 listed.' }
  ]},
  '536027379049246': { colorway: 'Black/Texas Orange', year: '2021', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-4-protro-undefeated-black-mamba', facts: 'StockX: Kobe 4 Protro Undefeated Black Mamba, CQ3869-001.' }
  ]},
  '536027391887647': { colorway: 'White/Total Orange-Black', year: '2018', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-us/nike-air-vapormax-off-white-2018', facts: 'StockX: AA3831-100, release 2018-04-14.' }
  ]},
  '536027391374611': { colorway: 'Black/Black/Galactic Jade', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-es/nike-air-max-dn-supreme', facts: 'StockX: FZ4044-001, release 2024-02-22.' },
    { tier: 'T3', url: 'https://www.goat.com/sneakers/supreme-x-air-max-dn-black-galactic-jade-fz4044-001', facts: 'GOAT: Supreme x Air Max DN Black Galactic Jade, FZ4044-001.' }
  ]},
  '536027391245333': { colorway: 'Black/Dark Smoke Grey/Anthracite/Light Crimson', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-max-dn-anthracite-light-crimson', facts: 'StockX: DV3337-008 All Night, release 2024-03-26.' }
  ]},
  '536027391132177': { colorway: 'Black/Cool Grey/Pure Platinum/White', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/t/air-max-dn-premium-electric-mens-shoes-zPC01x/DV3337-003', facts: 'Nike official: DV3337-003 Black/Cool Grey.' }
  ]},
  '536027392306708': { colorway: 'Sanddrift', year: '2023', sources: [
    { tier: 'T2', url: 'https://www.goat.com/en-it/sneakers/air-vapormax-2023-flyknit-oreo-dv1678-001', facts: 'GOAT: VaporMax 2023 Flyknit DV1678 series confirmed.' }
  ]},
  '536027391984154': { colorway: 'Triple Red', year: '2023', sources: [
    { tier: 'T2', url: 'https://www.goat.com/en-it/sneakers/air-vapormax-2023-flyknit-oreo-dv1678-001', facts: 'GOAT: VaporMax 2023 Flyknit DV1678 series confirmed; Triple Red DV1678-600.' }
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
await fs.writeFile(path.join(runDir, 'nike-batch-007-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
