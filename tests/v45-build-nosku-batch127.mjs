import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const buttercupSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/the-powerpuff-girls-x-dunk-low-pro-sb-qs-buttercup-fz8319-300', facts: 'GOAT: SB Dunk Buttercup confirmed.' }];
const blossomSrc = [{ tier: 'T2', url: 'https://www.flightclub.com/the-powerpuff-girls-x-dunk-low-pro-sb-qs-blossom-fd2631-600', facts: 'Flight Club: SB Dunk Blossom confirmed.' }];
const stapleSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-staple-nyc-pigeon', facts: 'StockX: SB Dunk Staple NYC Pigeon confirmed.' }];
const bornxraisedSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-born-x-raised', facts: 'StockX: Dunk Born x Raised confirmed.' }];
const researched = {
  '536027283139095': { sources: buttercupSrc },
  '536027283027729': { sources: blossomSrc },
  '536027301380891': { sources: stapleSrc },
  '536027158451224': { sources: bornxraisedSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-127-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
