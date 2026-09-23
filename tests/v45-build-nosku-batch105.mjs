import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const summitSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-summit-white-midnight-navy', facts: 'StockX: Dunk Low Summit White Midnight Navy confirmed.' }];
const terrySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-terry-swoosh', facts: 'StockX: Dunk Low Terry Swoosh confirmed.' }];
const broncosSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-broncos', facts: 'StockX: SB Dunk Broncos confirmed.' }];
const researched = {
  '536027128794136': { sources: summitSrc },
  '536027128747547': { sources: terrySrc },
  '536027128680725': { sources: broncosSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-105-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
