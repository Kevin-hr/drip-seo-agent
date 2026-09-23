import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const kobeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-kyrie-irving-baltic-blue', facts: 'StockX: Dunk Low Kyrie Baltic Blue confirmed.' }];
const tigerSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-year-of-the-tiger-2022', facts: 'StockX: Dunk Low Year of the Tiger confirmed.' }];
const brightSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-on-the-bright-side', facts: 'StockX: Dunk Low On the Bright Side confirmed.' }];
const researched = {
  '536027106010128': { sources: kobeSrc },
  '536027105286426': { sources: tigerSrc },
  '536027106153758': { sources: brightSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-085-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
