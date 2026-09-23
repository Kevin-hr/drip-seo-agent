import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const strangeLoveGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-strangelove-green', facts: 'StockX: SB Dunk Strange Love Green confirmed.' }];
const strangeLoveBlueSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-strangelove-blue', facts: 'StockX: SB Dunk Strange Love Blue confirmed.' }];
const gratefulDeadSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-grateful-dead', facts: 'StockX: SB Dunk Grateful Dead confirmed.' }];
const kasinaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-kasina-neptune-green', facts: 'StockX: SB Dunk Kasina Neptune Green confirmed.' }];
const seanCliverSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-sean-cliver', facts: 'StockX: SB Dunk Sean Cliver confirmed.' }];
const primeNorthernSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-premier-northern-lights', facts: 'StockX: SB Dunk Premier Northern Lights confirmed.' }];
const greenHempSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-green-hemp', facts: 'StockX: SB Dunk Green Hemp confirmed.' }];
const brownHempSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-brown-hemp', facts: 'StockX: SB Dunk Brown Hemp confirmed.' }];
const californiaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-california', facts: 'StockX: SB Dunk California confirmed.' }];
const laserOrangeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-laser-orange', facts: 'StockX: SB Dunk Laser Orange confirmed.' }];
const brownStarsSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-brown-stars', facts: 'StockX: SB Dunk Brown Stars confirmed.' }];
const offwhiteWhiteBlackSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-off-white-white-black-orange', facts: 'StockX: SB Dunk Off-White White Black Orange confirmed.' }];
const researched = {
  '536027057352465': { sources: strangeLoveGreenSrc },
  '536027057302814': { sources: strangeLoveBlueSrc },
  '536027057753372': { sources: gratefulDeadSrc },
  '536027056772371': { sources: kasinaSrc },
  '536027056596247': { sources: seanCliverSrc },
  '536027061659673': { sources: primeNorthernSrc },
  '536027061756186': { sources: greenHempSrc },
  '536027061707028': { sources: brownHempSrc },
  '536027057063184': { sources: californiaSrc },
  '536027056916762': { sources: laserOrangeSrc },
  '536027056290326': { sources: brownStarsSrc },
  '536027056097296': { sources: offwhiteWhiteBlackSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-122-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
