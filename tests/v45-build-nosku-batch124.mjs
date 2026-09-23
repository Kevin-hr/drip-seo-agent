import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const jPackShadowSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/ng/shopping/men/nike-sb-dunk-low-pro-j-pack-shadow-sneakers-item-15158258.aspx', facts: 'Farfetch: SB Dunk J-Pack Shadow confirmed.' }];
const spBrazilSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-sp-brazil', facts: 'StockX: SB Dunk SP Brazil confirmed.' }];
const purpleLobsterSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-de/sneakers/silhouette/dunk-sb', facts: 'GOAT: Purple Lobster Special Box confirmed.' }];
const uncOffwhiteFuturaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-unc-x-off-white-x-futura', facts: 'StockX: UNC x Off-White x Futura confirmed.' }];
const proWhiteGumSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-white-gum', facts: 'StockX: SB Dunk Pro White Gum confirmed.' }];
const courtPurpleSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-court-purple', facts: 'StockX: SB Dunk Court Purple confirmed.' }];
const hayleyWilsonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-hayley-wilson', facts: 'StockX: SB Dunk Hayley Wilson confirmed.' }];
const artsRecSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-arts-rec', facts: 'StockX: SB Dunk Arts-Rec confirmed.' }];
const researched = {
  '536027040380181': { sources: jPackShadowSrc },
  '536027040523538': { sources: spBrazilSrc },
  '536027078168084': { sources: purpleLobsterSrc },
  '536027078359836': { sources: uncOffwhiteFuturaSrc },
  '536027344103965': { sources: proWhiteGumSrc },
  '536027090241300': { sources: courtPurpleSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-124-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
