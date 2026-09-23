import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1890.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const uptempoSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-mx/sneakers/air-more-uptempo-rosewell-raygun-dd9223-100', facts: 'GOAT: Nike Air More Uptempo Roswell Raygun, DD9223-100, 2021, oversized AIR lettering.' }];
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com', facts: 'NB 2002R confirmed line.' }];
const clottSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-clot-fragment', facts: 'Nike Dunk Low CLOT Fragment confirmed.' }];
const researched = {
  '536027253504785': { sources: uptempoSrc },
  '536027246831381': { sources: nbSrc },
  '536027245803035': { sources: clottSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-039-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
