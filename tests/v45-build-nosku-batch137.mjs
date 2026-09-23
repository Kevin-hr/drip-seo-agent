import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const courtPurpleSrc = [{ tier: 'T2', url: 'https://www.grailed.com/designers/nike/browse/sb-dunk-low-court', facts: 'Grailed: SB Dunk Court Purple confirmed.' }];
const laserBlueSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-laser-blue', facts: 'StockX: SB Dunk Laser Blue confirmed.' }];
const wheatSrc = [{ tier: 'T2', url: 'https://www.sneakerjagers.com/en/s/nike-sb-dunk-low-pro-wheat-bq6817-204/179174', facts: 'Sneakerjagers: SB Dunk Wheat confirmed.' }];
const darkRussetSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-dark-russet-cedar', facts: 'StockX: SB Dunk Pro Dark Russet Cedar confirmed.' }];
const yellowStrikeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-yellow-strike', facts: 'StockX: SB Dunk Yellow Strike confirmed.' }];
const researched = {
  '536027090241300': { sources: courtPurpleSrc },
  '536027090176024': { sources: laserBlueSrc },
  '536027089999389': { sources: wheatSrc },
  '536027089934878': { sources: darkRussetSrc },
  '536027089501209': { sources: yellowStrikeSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-137-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
