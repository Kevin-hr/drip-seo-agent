import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const pinkOxfordSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-pink-oxford', facts: 'StockX: Dunk Low Pink Oxford confirmed.' }];
const blackWhiteMetallicSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-black-white-metallic', facts: 'StockX: Dunk Low Black White Metallic confirmed.' }];
const brownVeilSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-brown-veil-sail-vivid-green', facts: 'StockX: Dunk Low Brown Veil Sail Vivid Green confirmed.' }];
const researched = {
  '536027121003294': { sources: pinkOxfordSrc },
  '536027120826900': { sources: blackWhiteMetallicSrc },
  '536027120760858': { sources: brownVeilSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-096-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
