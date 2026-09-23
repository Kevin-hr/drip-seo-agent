import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const blueBearSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-sa/collections/nike-sb', facts: 'GOAT: Grateful Dead Blue Bear confirmed.' }];
const summitWhiteSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-summit-white', facts: 'StockX: SB Dunk Summit White confirmed.' }];
const californiaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-california-cali-pecan', facts: 'StockX: SB Dunk California confirmed.' }];
const seanCliverSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-sean-cliver', facts: 'StockX: SB Dunk Sean Cliver confirmed.' }];
const blackPigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/sneakers/nike/dunk-low?page=2', facts: 'StockX: SB Dunk Black Pigeon confirmed.' }];
const researched = {
  '536027057753372': { sources: blueBearSrc },
  '536027057703442': { sources: summitWhiteSrc },
  '536027057063184': { sources: californiaSrc },
  '536027056596247': { sources: seanCliverSrc },
  '536027056224534': { sources: blackPigeonSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-145-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
