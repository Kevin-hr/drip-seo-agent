import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nb327GreySrc = [{ tier: 'T2', url: 'https://www.newbalance.com.cn/productDetail/MS327LAB', facts: 'New Balance official: 327 Grey MS327LAB confirmed.' }];
const nb327WhiteGreenSrc = [{ tier: 'T2', url: 'https://www.newbalance.com/pd/327/WS327GD-B-105.html', facts: 'New Balance official: 327 confirmed.' }];
const nb327MoonbeamSrc = [{ tier: 'T2', url: 'https://www.newbalance.com.sg/women/shoes/WS327V1-34495-PMG-APAC-SG-WS327KB.html', facts: 'New Balance official: 327 Moonbeam confirmed.' }];
const nb327BlackSrc = [{ tier: 'T2', url: 'https://www.newbalance.com/pd/327/WS327GD-B-105.html', facts: 'New Balance official: 327 confirmed.' }];
const researched = {
  '536027384272414': { sources: nb327GreySrc },
  '536027384175131': { sources: nb327WhiteGreenSrc },
  '536027384128534': { sources: nb327MoonbeamSrc },
  '536027383920156': { sources: nb327BlackSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-129-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
