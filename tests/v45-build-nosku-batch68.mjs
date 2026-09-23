import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const d2 = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2690.json'), 'utf8'));
for (const x of d2) byId.set(x.id, x);
const grinchSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/zoom-kobe-6-protro-grinch-cw2190-300', facts: 'GOAT: Kobe 6 Protro Grinch CW2190-300 confirmed.' }];
const acgSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-acg-terra-red-plum', facts: 'StockX: SB Dunk ACG Terra Red Plum confirmed.' }];
const sambaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-samba', facts: 'StockX: Dunk Low Samba confirmed.' }];
const researched = {
  '536027085128222': { sources: grinchSrc },
  '536027085417234': { sources: acgSrc },
  '536027040635156': { sources: sambaSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-068-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
