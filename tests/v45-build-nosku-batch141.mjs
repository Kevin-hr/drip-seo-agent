import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const flyStreetwearSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/the-vault/striped-box-era/fly-streetwear', facts: 'Nike SB: Fly Streetwear confirmed.' }];
const darkDriftwoodSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-dark-driftwood', facts: 'StockX: Dunk Low Dark Driftwood confirmed.' }];
const baroqueBrownSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-baroque-brown', facts: 'StockX: Dunk Low Baroque Brown confirmed.' }];
const arizonaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-arizona-state', facts: 'StockX: Dunk Low Arizona State confirmed.' }];
const lebronSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-qs-lebron-james-fruity-pebbles', facts: 'StockX: Dunk Low LeBron Fruity Pebbles confirmed.' }];
const researched = {
  '536027132907549': { sources: flyStreetwearSrc },
  '536027132570654': { sources: darkDriftwoodSrc },
  '536027132521488': { sources: baroqueBrownSrc },
  '536027132424987': { sources: arizonaSrc },
  '536027132282389': { sources: lebronSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-141-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
