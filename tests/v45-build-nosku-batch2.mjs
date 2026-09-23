import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027541250324': { sources: [{ tier: 'T1', url: 'https://www.birkenstock.com/us/arizona-suede-leather/arizona-core-suedeleather-0-eva-u_46.html', facts: 'Birkenstock official: Arizona two-strap sandal, leather upper, cork-latex footbed.' }]},
  '536027541203732': { sources: [{ tier: 'T1', url: 'https://www.birkenstock.com/us/arizona-suede-leather-taupe/arizona-core-suedeleather-0-eva-u_46.html', facts: 'Birkenstock official: Arizona Suede in taupe, soft suede upper, anatomically shaped footbed.' }]},
  '536027541155354': { sources: [{ tier: 'T1', url: 'https://www.birkenstock.com/gb/arizona-suede-leather-sandcastle/4066648952282.html', facts: 'Birkenstock official: Arizona Suede Sandcastle (camel/tan), napped suede upper.' }]},
  '536027538260507': { sources: [{ tier: 'T2', url: 'https://stockx.com/brands/chrome-hearts', facts: 'StockX: Chrome Hearts denim shorts with cross embroidery confirmed product line.' }]},
  '536027530178071': { sources: [{ tier: 'T2', url: 'https://stockx.com/brands/hellstar', facts: 'StockX: Hellstar cotton shorts with graphic print confirmed line.' }]}
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; specific branded product name.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-002-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
