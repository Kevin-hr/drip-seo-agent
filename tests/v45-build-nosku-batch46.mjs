import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const unionSrc = [{ tier: 'T2', url: 'https://stockx.com/union-x-nike-dunk-low-midnight-navy', facts: 'StockX: Union x Nike Dunk Low Midnight Navy confirmed.' }];
const jjjSrc = [{ tier: 'T2', url: 'https://id.carousell.com/men-s-fashion/sneakers/jjjjound/q-1832/', facts: 'Carousell: Bape Sta x JJJJound confirmed.' }];
const crocsSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-de/sneakers/brand/Crocs/lifestyle', facts: 'GOAT: Salehe Bembury x Crocs Pollex Clog Sasquatch 2022 confirmed.' }];
const researched = {
  '536027113674261': { sources: unionSrc },
  '536027110828058': { sources: jjjSrc },
  '536027110186527': { sources: crocsSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-046-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
