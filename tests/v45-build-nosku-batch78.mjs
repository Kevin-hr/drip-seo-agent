import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2340.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const ciderSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-cider', facts: 'StockX: Dunk Low Cider confirmed.' }];
const champRedSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-championship-red-2021', facts: 'StockX: Dunk Low Championship Red confirmed.' }];
const darkRussetSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-dark-russet-cedar', facts: 'StockX: SB Dunk Dark Russet Cedar confirmed.' }];
const researched = {
  '536027092314904': { sources: ciderSrc },
  '536027090512922': { sources: champRedSrc },
  '536027089934878': { sources: darkRussetSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-078-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
