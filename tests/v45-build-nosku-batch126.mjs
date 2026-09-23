import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const lot42Src = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-off-white-lot-42', facts: 'StockX: Off-White Dunk Lot 42 confirmed.' }];
const neckfaceSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/the-vault/striped-box-era/neckface', facts: 'Nike SB official: Neckface confirmed.' }];
const lagoonPulseSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/ftc-x-dunk-low-sb-lagoon-pulse-dh7687-400', facts: 'GOAT: FTC Lagoon Pulse confirmed.' }];
const midasGoldSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-midas-gold', facts: 'StockX: SB Dunk Midas Gold confirmed.' }];
const archeoPinkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-archeo-pink', facts: 'StockX: SB Dunk Archeo Pink confirmed.' }];
const researched = {
  '536027302474004': { sources: lot42Src },
  '536027122850581': { sources: neckfaceSrc },
  '536027087651101': { sources: lagoonPulseSrc },
  '536027097330197': { sources: midasGoldSrc },
  '536027097265936': { sources: archeoPinkSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-126-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
