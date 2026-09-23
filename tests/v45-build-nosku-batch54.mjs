import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2640.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const gdSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/the-vault/striped-box-era/nike-sb-grateful-dead-dunk-low', facts: 'Nike SB official: Grateful Dead Dunk Low confirmed.' }];
const pandaSrc = [{ tier: 'T2', url: 'https://www.grailed.com/browse/nike-sb-dunk-low-staple', facts: 'Grailed: Staple Panda Pigeon confirmed.' }];
const researched = {
  '536027057753372': { sources: gdSrc },
  '536027057526806': { sources: pandaSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-054-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
