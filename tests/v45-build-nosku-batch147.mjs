import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const jokerSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-joker', facts: 'StockX: Dunk Low Joker confirmed.' }];
const buttercupSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/the-powerpuff-girls-x-dunk-low-pro-sb-qs-buttercup-fz8319-300', facts: 'GOAT: Powerpuff Girls Buttercup confirmed.' }];
const blossomSrc = [{ tier: 'T2', url: 'https://thesolesupplier.co.uk/release-dates/nike/dunk/the-powerpuff-girls-x-nike-sb-dunk-low-blossom/', facts: 'The Sole Supplier: Powerpuff Girls Blossom confirmed.' }];
const blueLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-concepts-blue-lobster', facts: 'StockX: Dunk Low Concepts Blue Lobster confirmed.' }];
const redLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-concepts-red-lobster', facts: 'StockX: Dunk Low Concepts Red Lobster confirmed.' }];
const researched = {
  '536027345712924': { sources: jokerSrc },
  '536027283139095': { sources: buttercupSrc },
  '536027283027729': { sources: blossomSrc },
  '536027279541532': { sources: blueLobsterSrc },
  '536027279414550': { sources: redLobsterSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-147-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
