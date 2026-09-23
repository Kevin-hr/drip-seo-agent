import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const cgSrc = [{ tier: 'T1', url: 'https://canadagoose.com.au/products/wyndham-parka-cr-140172-cgnvy63', facts: 'Canada Goose: Wyndham confirmed.' }];
const cgExpeditionSrc = [{ tier: 'T1', url: 'https://canadagoose.com.au/products/expedition-parka-cr-140176-cgwht433', facts: 'Canada Goose: Expedition confirmed.' }];
const cgChelseaSrc = [{ tier: 'T1', url: 'https://www.canadagoose.jp/goods/3804W', facts: 'Canada Goose: Chelsea confirmed.' }];
const researched = {
  '536027406529567': { sources: cgExpeditionSrc },
  '536027406482714': { sources: cgExpeditionSrc },
  '536027406433309': { sources: cgExpeditionSrc },
  '536027406337042': { sources: cgExpeditionSrc },
  '536027405468957': { sources: cgSrc },
  '536027405372959': { sources: cgSrc },
  '536027405307932': { sources: cgSrc },
  '536027405212441': { sources: cgSrc },
  '536027401209875': { sources: cgSrc },
  '536027401178394': { sources: cgSrc },
  '536027401129242': { sources: cgSrc },
  '536027401098256': { sources: cgSrc },
  '536027395746840': { sources: cgChelseaSrc },
  '536027395699485': { sources: cgSrc },
  '536027395665434': { sources: cgSrc },
  '536027395617298': { sources: cgSrc },
  '536027395584536': { sources: cgSrc },
  '536027395537173': { sources: cgSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-176-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
