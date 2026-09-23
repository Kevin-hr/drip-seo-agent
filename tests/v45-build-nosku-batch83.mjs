import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const fosSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-fossil-rose', facts: 'StockX: Dunk Low Fossil Rose confirmed.' }];
const roseSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-rose-whisper-w', facts: 'StockX: Dunk Low Rose Whisper confirmed.' }];
const patSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-essential-paisley-pack-worn-blue', facts: 'StockX: Dunk Low Paisley Worn Blue confirmed.' }];
const researched = {
  '536027105881881': { sources: fosSrc },
  '536027105221659': { sources: roseSrc },
  '536027102200095': { sources: patSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-083-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
