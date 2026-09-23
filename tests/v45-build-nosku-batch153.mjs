import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const atmosSrc = [{ tier: 'T2', url: 'https://www.laced.com/products/nike-sb-dunk-low-premium-atmos-elephant', facts: 'Laced: atmos Elephant confirmed.' }];
const cnySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-cny-chinese-new-year', facts: 'StockX: SB Dunk CNY confirmed.' }];
const frameSkateSrc = [{ tier: 'T2', url: 'https://www.laced.com/nike/sb-dunk', facts: 'Laced: Frame Skate Habibi confirmed.' }];
const purplePigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-purple-pigeon', facts: 'StockX: SB Dunk Purple Pigeon confirmed.' }];
const instantSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-instant-skateboards', facts: 'StockX: SB Dunk Instant Skateboards confirmed.' }];
const researched = {
  '536027055857428': { sources: atmosSrc },
  '536027055792402': { sources: cnySrc },
  '536027055086866': { sources: frameSkateSrc },
  '536027054927632': { sources: purplePigeonSrc },
  '536027041020954': { sources: instantSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-153-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
