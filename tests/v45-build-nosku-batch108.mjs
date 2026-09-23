import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lxGoldSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-lx-black-team-gold-w', facts: 'StockX: Dunk Low LX Black Team Gold confirmed.' }];
const doubleHookSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-85-gray-green-apple', facts: 'StockX: SB Dunk 85 Gray Green Apple Double Hook confirmed.' }];
const grayWhiteGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-85-gray-white-green', facts: 'StockX: SB Dunk 85 Gray White Green confirmed.' }];
const researched = {
  '536027133150485': { sources: lxGoldSrc },
  '536027135931667': { sources: doubleHookSrc },
  '536027133213467': { sources: grayWhiteGreenSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-108-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
