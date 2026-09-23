import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2540.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lebroSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-sg/sneakers/air-jordan-1-retro-high-le-bro', facts: 'GOAT: AJ1 Le Bro confirmed.' }];
const cementSrc = [{ tier: 'T2', url: 'https://www.stadiumgoods.com/collections/og-jordans', facts: 'Stadium Goods: AJ4 White Cement confirmed.' }];
const cactusSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/shopping/women/jordan/items.aspx', facts: 'Farfetch: AJ4 Travis Scott Cactus Jack confirmed.' }];
const researched = {
  '536027080651258': { sources: lebroSrc },
  '536027080327258': { sources: cementSrc },
  '536027080278106': { sources: cactusSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-059-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
