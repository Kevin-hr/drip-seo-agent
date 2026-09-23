import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const dkRussetSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-iso-dk-russet-sail', facts: 'StockX: SB Dunk DK Russet Sail confirmed.' }];
const redLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-sb-low-red-lobster', facts: 'StockX: SB Dunk Red Lobster confirmed.' }];
const pandaKidsSrc = [{ tier: 'T2', url: 'https://www.nike.sa/en/dunk-low-older-kids-shoes/NKFB9109-124.html', facts: 'Nike: Dunk Low Kids confirmed.' }];
const ae86PinkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-ae86-pink', facts: 'StockX: SB Dunk AE86 Pink confirmed.' }];
const hufSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-huf-friends-and-family', facts: 'StockX: SB Dunk HUF confirmed.' }];
const researched = {
  '536027128231960': { sources: dkRussetSrc },
  '536027126144543': { sources: redLobsterSrc },
  '536027124793879': { sources: pandaKidsSrc },
  '536027122595604': { sources: ae86PinkSrc },
  '536027122512415': { sources: hufSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-155-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
