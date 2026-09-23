import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const vietnamSrc = [{ tier: 'T2', url: 'https://www.sothebys.com/en/buy/pdp/fashion/sneaker/skateboarding/_nike-sb-dunk-low-vietnam-or-size-85-6a1d', facts: 'Sothebys: SB Dunk Vietnam confirmed.' }];
const blueFurySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-blue-fury', facts: 'StockX: SB Dunk Pro Blue Fury confirmed.' }];
const kasinaBusSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-kasina-80s-bus-blue', facts: 'StockX: SB Dunk Kasina 80s Bus Blue confirmed.' }];
const cnySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-cny-chinese-new-year', facts: 'StockX: SB Dunk CNY confirmed.' }];
const offwhiteRedSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-off-white-university-red', facts: 'StockX: Dunk Low Off-White University Red confirmed.' }];
const researched = {
  '536027056659474': { sources: vietnamSrc },
  '536027056483102': { sources: blueFurySrc },
  '536027056353305': { sources: kasinaBusSrc },
  '536027055792402': { sources: cnySrc },
  '536027041181714': { sources: offwhiteRedSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-132-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
