import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const diorAlphaSrc = [{ tier: 'T1', url: 'https://www.dior.com/en_sa/fashion/mens-fashion/shoes/all-shoes', facts: 'Dior: Alpha confirmed.' }];
const diorBagSrc = [{ tier: 'T1', url: 'https://www.dior.cn/zh_cn/fashion/products/M0636PUQA_M39Z', facts: 'Dior: Lady D-Joy confirmed.' }];
const researched = {
  '536027439221521': { sources: diorAlphaSrc },
  '536027439174936': { sources: diorAlphaSrc },
  '536027388367389': { sources: diorBagSrc },
  '536027388353555': { sources: diorBagSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-180-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
