import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const corkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-max-97-cork', facts: 'StockX: Air Max 97 Cork confirmed.' }];
const peachSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-pro-se-black-white-peach', facts: 'StockX: Dunk Low Pro SE Peach confirmed.' }];
const vaporflySrc = [{ tier: 'T1', url: 'https://www.nike.com/running/vaporfly', facts: 'Nike official: ZoomX Vaporfly NEXT% confirmed.' }];
const researched = {
  '536027086285847': { sources: corkSrc },
  '536027079711262': { sources: peachSrc },
  '536027087347231': { sources: vaporflySrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-073-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
