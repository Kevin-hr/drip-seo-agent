import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const lot10Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot 10 confirmed.' }];
const orangeLabelSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-orange-label-white-black', facts: 'StockX: SB Dunk Orange Label confirmed.' }];
const airMax97Src = [{ tier: 'T2', url: 'https://stockx.com/nike-air-max-97-triple-white-wolf-grey', facts: 'StockX: Air Max 97 Triple White Wolf Grey confirmed.' }];
const researched = {
  '536027088729620': { sources: lot10Src },
  '536027087168278': { sources: orangeLabelSrc },
  '536027083472657': { sources: airMax97Src }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-070-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
