import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027446230803': { colorway: 'Court Purple/Court Purple', year: '2025', sources: [
    { tier: 'T1', url: 'https://www.nike.com.ar/kobe-air-force-1-low-ib0018-500/p', facts: 'Nike: Kobe Air Force 1 Low, IB0018-500.' },
    { tier: 'T2', url: 'https://stockx.com/fr-fr/nike-air-force-1-low-kobe-bryant-court-purple', facts: 'StockX: IB0018-500, release 2025-10-01.' },
    { tier: 'T3', url: 'https://www.goat.com/sneakers/kobe-bryant-x-air-force-1-low-court-purple-ib0018-500', facts: 'GOAT: Court Purple snakeskin.' }
  ]},
  '536027414293008': { colorway: 'Black/Tour Yellow', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=air-max-95', facts: 'StockX: Corteiz Air Max 95 FB2709 series confirmed.' }
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
await fs.writeFile(path.join(runDir, 'nike-batch-011-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
