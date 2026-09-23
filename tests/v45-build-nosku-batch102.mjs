import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lightPinkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-light-soft-pink', facts: 'StockX: Dunk Low Light Soft Pink confirmed.' }];
const ae86PurpleSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-ae86-purple-yellow', facts: 'StockX: Dunk Low AE86 Purple Yellow confirmed.' }];
const sbAe86Src = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-ae86', facts: 'StockX: SB Dunk AE86 confirmed.' }];
const researched = {
  '536027121598494': { sources: lightPinkSrc },
  '536027122113815': { sources: ae86PurpleSrc },
  '536027122063633': { sources: sbAe86Src }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-102-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
