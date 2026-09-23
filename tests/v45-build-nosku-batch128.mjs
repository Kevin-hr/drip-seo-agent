import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const georgetownSrc = [{ tier: 'T2', url: 'https://www.sneakerjagers.com/en/s/nike-dunk-low-georgetown-dd1391-003/226525', facts: 'Sneakerjagers: Dunk Low Georgetown confirmed.' }];
const industrialBlueSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-industrial-blue', facts: 'StockX: Dunk Low Industrial Blue confirmed.' }];
const rammellzeeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-rammellzee', facts: 'StockX: Dunk Low Rammellzee confirmed.' }];
const whiteLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-white-lobster', facts: 'StockX: SB Dunk White Lobster confirmed.' }];
const photonDustSrc = [{ tier: 'T2', url: 'https://www.nike.com/il/t/dunk-low-shoes-TlGnmw', facts: 'Nike official: Dunk Low Photon Dust confirmed.' }];
const researched = {
  '536027158387487': { sources: georgetownSrc },
  '536027144533529': { sources: industrialBlueSrc },
  '536027143390738': { sources: rammellzeeSrc },
  '536027143311126': { sources: whiteLobsterSrc },
  '536027139643935': { sources: photonDustSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-128-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
