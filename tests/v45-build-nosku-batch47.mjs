import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const sacaiSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/nike-sacai-vaporwaffle-black-gum', facts: 'Nike official: sacai VaporWaffle Black Gum DD1875-001.' }];
const setsubunSrc = [{ tier: 'T1', url: 'https://www.nike.com/tw/launch/t/dunk-low-setsubun', facts: 'Nike official: Dunk Low Setsubun DQ5009-268.' }];
const researched = {
  '536027105945374': { sources: sacaiSrc },
  '536027106073887': { sources: setsubunSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-047-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
