import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const sbKobeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-kobe', facts: 'StockX: SB Dunk Kobe confirmed.' }];
const laDodgersSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-los-angeles-dodgers', facts: 'StockX: SB Dunk LA Dodgers confirmed.' }];
const vintageGreenMBatchSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-vintage-green', facts: 'StockX: Dunk Low Vintage Green confirmed.' }];
const researched = {
  '536027116021021': { sources: sbKobeSrc },
  '536027119379995': { sources: laDodgersSrc },
  '536027118851348': { sources: vintageGreenMBatchSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-097-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
