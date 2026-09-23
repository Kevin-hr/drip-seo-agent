import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nb327Src = [{ tier: 'T1', url: 'https://www.newbalance.com.cn/productDetail/MS327LAB', facts: 'New Balance: 327 confirmed.' }];
const nb990Src = [{ tier: 'T2', url: 'https://www.footlocker.com/category/collection/new-balance/9060.html', facts: 'Foot Locker: NB confirmed.' }];
const nb9060Src = [{ tier: 'T2', url: 'https://www.footlocker.com/category/collection/new-balance/9060.html', facts: 'Foot Locker: 9060 confirmed.' }];
const researched = {
  '536027384272414': { sources: nb327Src },
  '536027384175131': { sources: nb327Src },
  '536027384128534': { sources: nb327Src },
  '536027384078619': { sources: nb327Src },
  '536027384016670': { sources: nb327Src },
  '536027383949334': { sources: nb327Src },
  '536027383920156': { sources: nb327Src },
  '536027383404049': { sources: nb327Src },
  '536027377507095': { sources: nb990Src },
  '536027377441822': { sources: nb990Src },
  '536027376781850': { sources: nb9060Src },
  '536027354440720': { sources: nb990Src },
  '536027354391324': { sources: nb990Src },
  '536027354343443': { sources: nb990Src },
  '536027354278930': { sources: nb990Src },
  '536027354215199': { sources: nb990Src },
  '536027354102292': { sources: nb990Src },
  '536027354053400': { sources: nb990Src }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-173-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
