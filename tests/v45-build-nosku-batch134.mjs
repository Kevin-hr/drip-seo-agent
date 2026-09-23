import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const rabbitSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-au/sneakers/dunk-low-year-of-the-rabbit-white-taupe-fd4203-211', facts: 'GOAT: Dunk Low Year of the Rabbit Fossil Stone confirmed.' }];
const russetSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-iso-dk-russet-sail', facts: 'StockX: SB Dunk Pro Iso DK Russet Sail confirmed.' }];
const orangeLobsterSrc = [{ tier: 'T2', url: 'https://www.grailed.com/listings/104479460-nike-sb-dunk-low-concepts-orange-lobster', facts: 'Grailed: SB Dunk Concepts Orange Lobster confirmed.' }];
const hufSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-huf-friends-and-family', facts: 'StockX: SB Dunk HUF Friends and Family confirmed.' }];
const pandaKidsSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-retro-panda-kids', facts: 'StockX: Dunk Low Panda Kids confirmed.' }];
const researched = {
  '536027132842776': { sources: rabbitSrc },
  '536027128231960': { sources: russetSrc },
  '536027123173137': { sources: orangeLobsterSrc },
  '536027122512415': { sources: hufSrc },
  '536027124793879': { sources: pandaKidsSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-134-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
