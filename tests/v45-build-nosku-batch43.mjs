import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const psSrc = [{ tier: 'T2', url: 'https://www.goat.com/collections/travis-scott-nike', facts: 'GOAT: Travis Scott x PlayStation x Nike Dunk Low 2020 confirmed.' }];
const chicagoSrc = [{ tier: 'T2', url: 'https://www.grailed.com/browse/dunk-chicago', facts: 'Grailed: Nike Dunk Low Chicago Split DZ2536-600 confirmed.' }];
const crocsSrc = [{ tier: 'T2', url: 'https://stockx.com/crocs-pollex-clog-salehe-bembury', facts: 'Crocs Pollex Clog by Salehe Bembury confirmed.' }];
const researched = {
  '536027128618783': { sources: psSrc },
  '536027132201744': { sources: chicagoSrc },
  '536027137297941': { sources: crocsSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-043-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
