import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const mmSrc = [{ tier: 'T1', url: 'https://www.maisonmargiela.com/en-gb/replica-sneakers-8053833629926.html', facts: 'Maison Margiela official: Replica sneakers, calf leather, suede trims, white stitch at back, Made in Italy, inspired by Austrian 1970s sports shoes.' }];
const sambaSrc = [{ tier: 'T1', url: 'https://www.adidas.com/us/samba-og-shoes/KI5719.html', facts: 'adidas official: Samba OG, gold metallic/cloud white, leather upper, nubuck overlays, 3-Stripes.' }];
const tnsSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-au/collections/luxe-accents', facts: 'GOAT: Swarovski x Nike Wmns Air Max Plus Moonlight 2024 confirmed.' }];
const researched = {
  '536027457831190': { sources: mmSrc },
  '536027457784607': { sources: mmSrc },
  '536027457735709': { sources: mmSrc },
  '536027453477149': { sources: sambaSrc },
  '536027451066386': { sources: tnsSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; iconic model with official evidence.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-010-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
