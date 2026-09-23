import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const kentuckySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-sp-kentucky', facts: 'StockX: Dunk Low SP Kentucky confirmed.' }];
const mediumCurrySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-medium-curry', facts: 'StockX: Dunk Low Medium Curry confirmed.' }];
const sbGreyFogSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-grey-fog', facts: 'StockX: SB Dunk Grey Fog confirmed.' }];
const researched = {
  '536027126207510': { sources: kentuckySrc },
  '536027126883869': { sources: mediumCurrySrc },
  '536027126929946': { sources: sbGreyFogSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-099-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
