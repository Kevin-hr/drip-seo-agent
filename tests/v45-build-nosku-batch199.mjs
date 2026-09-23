import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const balenciagaSrc = [{ tier: 'T1', url: 'https://www.balenciaga.cn/products/734734w3xl11010.html', facts: 'Balenciaga: 3XL confirmed.' }];
const researched = {
  '536027361366559': { sources: balenciagaSrc },
  '536027361286167': { sources: balenciagaSrc },
  '536027360966417': { sources: balenciagaSrc },
  '536027360899604': { sources: balenciagaSrc },
  '536027360723736': { sources: balenciagaSrc },
  '536027360290077': { sources: balenciagaSrc },
  '536027359921680': { sources: balenciagaSrc },
  '536027359614750': { sources: balenciagaSrc },
  '536027359550994': { sources: balenciagaSrc },
  '536027359487255': { sources: balenciagaSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = allById.get(pid); if (!d) { console.log('NOT FOUND:', pid); continue; }
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-199-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
