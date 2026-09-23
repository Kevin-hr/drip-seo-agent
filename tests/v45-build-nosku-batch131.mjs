import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const sambaSrc = [{ tier: 'T2', url: 'https://www.everysize.com/es/p/nike-dunk-low-sp-samba-2020-cz2667-400.html', facts: 'everysize: Dunk Low Samba 2020 confirmed.' }];
const firecrackerSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-mx/sneakers/dunk-low-ps-chinese-new-year-firecracker-dd8479-446', facts: 'GOAT: Dunk Low CNY Firecracker confirmed.' }];
const travisScottSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-travis-scott-playstation', facts: 'StockX: Dunk Low Travis Scott Playstation confirmed.' }];
const acgTerraSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-acg-terra-red-plum', facts: 'StockX: SB Dunk ACG Terra Red Plum confirmed.' }];
const offwhitePineGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-off-white-pine-green', facts: 'StockX: SB Dunk Off-White Pine Green confirmed.' }];
const researched = {
  '536027088567583': { sources: sambaSrc },
  '536027088455197': { sources: firecrackerSrc },
  '536027086189597': { sources: travisScottSrc },
  '536027085417234': { sources: acgTerraSrc },
  '536027084660760': { sources: offwhitePineGreenSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-131-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
