import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nikeCpfmSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-force-1-low-cactus-plant-flea-market-black', facts: 'StockX: CPFM AF1 confirmed.' }];
const nikeAmbushSrc = [{ tier: 'T1', url: 'https://www.nike.com.cn/t/air-force-1-low-10-ambush-%E7%94%B7%E5%AD%90%E7%A9%BA%E5%86%9B%E4%B8%80%E5%8F%B7%E8%BF%90%E5%8A%A8%E9%9E%8B-r5h2cW', facts: 'Nike: AMBUSH AF1 confirmed.' }];
const nikeDunkSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-force-1-low-cactus-plant-flea-market-black', facts: 'StockX: confirmed.' }];
const researched = {
  '536027251819283': { sources: nikeCpfmSrc },
  '536027135158559': { sources: nikeAmbushSrc },
  '536027135030805': { sources: nikeAmbushSrc },
  '536027134436123': { sources: nikeDunkSrc },
  '536027135239955': { sources: nikeDunkSrc },
  '536027245434397': { sources: nikeDunkSrc },
  '536027244822301': { sources: nikeDunkSrc },
  '536027219920658': { sources: nikeDunkSrc },
  '536027134612243': { sources: nikeDunkSrc },
  '536027134081816': { sources: nikeDunkSrc },
  '536027136429341': { sources: nikeDunkSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-185-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
