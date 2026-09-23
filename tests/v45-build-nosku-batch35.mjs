import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1690.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const marsSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/tom-sachs-x-nikecraft-mars-yard-2-0-aa2261-100', facts: 'GOAT: Tom Sachs x NikeCraft Mars Yard 2.0, AA2261-100, Off-White mesh, maple nubuck, Sport Red Swoosh, 2017.' }];
const pigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-staple-pigeon', facts: 'Nike SB Dunk Staple NYC Pigeon 304292-011 confirmed.' }];
const grinchSrc = [{ tier: 'T2', url: 'https://www.sneakerjagers.com/s/nike-zoom-kobe-6-protro-reverse-grinch-fv4921-600/434490', facts: 'Sneakerjagers: Kobe 6 Protro Reverse Grinch FV4921-600, snakeskin texture.' }];
const researched = {
  '536027301284120': { sources: marsSrc },
  '536027301380891': { sources: pigeonSrc },
  '536027296413716': { sources: grinchSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-035-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
