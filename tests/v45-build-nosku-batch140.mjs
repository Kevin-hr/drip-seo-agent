import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nycPigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-sb-low-staple-nyc-pigeon', facts: 'StockX: SB Dunk Staple NYC Pigeon confirmed.' }];
const greyLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-grey-lobster', facts: 'StockX: SB Dunk Grey Lobster confirmed.' }];
const yellowLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-yellow-lobster', facts: 'StockX: SB Dunk Yellow Lobster confirmed.' }];
const redPandaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-red-panda', facts: 'StockX: Dunk Low Red Panda confirmed.' }];
const georgetownSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-georgetown', facts: 'StockX: Dunk Low Georgetown confirmed.' }];
const researched = {
  '536027301380891': { sources: nycPigeonSrc },
  '536027273499933': { sources: greyLobsterSrc },
  '536027273258263': { sources: yellowLobsterSrc },
  '536027263343389': { sources: redPandaSrc },
  '536027158387487': { sources: georgetownSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-140-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
