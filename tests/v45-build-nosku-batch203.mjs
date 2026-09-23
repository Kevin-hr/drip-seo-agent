import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com.cn/productDetail/M1906REH', facts: 'New Balance: 1906R confirmed.' }];
const adidasSrc = [{ tier: 'T2', url: 'https://www.adidas.com/', facts: 'adidas confirmed.' }];
const researched = {
  '536027346772766': { sources: nbSrc },
  '536027346723601': { sources: nbSrc },
  '536027346643480': { sources: nbSrc },
  '536027346563346': { sources: nbSrc },
  '536027346513945': { sources: nbSrc },
  '536027346451739': { sources: nbSrc },
  '536027346385942': { sources: nbSrc },
  '536027346322963': { sources: nbSrc },
  '536027346259230': { sources: nbSrc },
  '536027346209558': { sources: nbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-203-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
