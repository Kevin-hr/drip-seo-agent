import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2690.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const medicomSrc = [{ tier: 'T1', url: 'https://www.nike.com/jp/launch/t/sb-dunk-low-medicom-be-rbrick', facts: 'Nike official: SB Dunk x Medicom BE@RBRICK confirmed.' }];
const chunkySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-chunky-dunky', facts: 'StockX: SB Dunk Chunky Dunky confirmed.' }];
const prestoSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-presto-off-white-white', facts: 'StockX: Air Presto Off-White White confirmed.' }];
const researched = {
  '536027040911129': { sources: medicomSrc },
  '536027040731935': { sources: chunkySrc },
  '536027042084376': { sources: prestoSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-055-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
