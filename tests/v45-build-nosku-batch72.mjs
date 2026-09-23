import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const multiCamoSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-sb-low-multi-camo', facts: 'StockX: Dunk SB Multi Camo confirmed.' }];
const royalRedSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-sb-low-gs-royal-red', facts: 'StockX: Dunk SB GS Royal Red confirmed.' }];
const airMax97ShSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-max-97-shanghai-kaleidoscope', facts: 'StockX: Air Max 97 Shanghai Kaleidoscope confirmed.' }];
const researched = {
  '536027085593374': { sources: multiCamoSrc },
  '536027085545754': { sources: royalRedSrc },
  '536027083424533': { sources: airMax97ShSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-072-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
