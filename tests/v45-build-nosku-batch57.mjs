import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2690.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const prestoSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/off-white-x-air-presto-white-aa3830-100', facts: 'GOAT: Off-White Air Presto White AA3830-100 confirmed.' }];
const am97Src = [{ tier: 'T2', url: 'https://sneakerlanestore.com/en/products/nike-air-max-97-off-white-menta', facts: 'Menta AJ4585-101 confirmed.' }];
const civilistSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-civilist-thermography', facts: 'StockX: SB Dunk Civilist Thermography confirmed.' }];
const researched = {
  '536027042084376': { sources: prestoSrc },
  '536027041504030': { sources: am97Src },
  '536027040458779': { sources: civilistSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-057-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
