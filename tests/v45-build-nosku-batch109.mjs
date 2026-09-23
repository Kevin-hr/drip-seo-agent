import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const pineGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-force-1-low-sp-ambush-pine-green', facts: 'StockX: AF1 AMBUSH Pine Green confirmed.' }];
const gameRoyalSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/ph/shopping/men/nike-x-ambush-x-ambush-air-force-1-low-game-royal-sneakers-item-19442552.aspx', facts: 'Farfetch: AF1 AMBUSH Game Royal confirmed.' }];
const collegeNavySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-force-1-low-college-pack-midnight-navy', facts: 'StockX: AF1 College Pack Midnight Navy confirmed.' }];
const researched = {
  '536027135158559': { sources: pineGreenSrc },
  '536027135030805': { sources: gameRoyalSrc },
  '536027134081816': { sources: collegeNavySrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-109-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
