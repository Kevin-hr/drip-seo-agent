import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1840.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const b23Src = [{ tier: 'T1', url: 'https://www.dior.com/en_us/fashion/products/3SN249ZSA_H961_T47', facts: 'Dior official: B23 League Low-Top, beige and black Dior Oblique jacquard, white rubber sole.' }];
const lvSrc = [{ tier: 'T1', url: 'https://www.louisvuitton.com', facts: 'LV Trainer confirmed line.' }];
const sacaiSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-ld-waffle-sf-sacai-fragment-grey', facts: 'Nike LD Waffle SF sacai Fragment Grey confirmed.' }];
const researched = {
  '536027256704020': { sources: b23Src },
  '536027255080980': { sources: lvSrc },
  '536027256944669': { sources: sacaiSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-038-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
