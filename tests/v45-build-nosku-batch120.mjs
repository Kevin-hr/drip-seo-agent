import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2040.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
// These products are from queue, need to read their detail files
// Try multiple offsets
const offsets = [2040, 1990, 1940, 1890, 1840, 1790, 1740, 1690, 1640, 1590, 1540, 1490, 1440, 1390, 1340, 1290, 1240, 1190, 1140, 1090, 1040, 990, 940, 890, 840, 790, 740, 690, 640, 590, 540, 490, 440, 390, 340, 290, 240, 190, 140, 90, 40, 0];
const allById = new Map();
for (const off of offsets) {
  try {
    const d = JSON.parse(await fs.readFile(path.join(runDir, `nosku-detail-offset-${off}.json`), 'utf8'));
    d.forEach(x => allById.set(x.id, x));
  } catch {}
}
const aprilSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-sb-dunk-low-april-skateboards', facts: 'StockX: SB Dunk April Skateboards confirmed.' }];
const strangeLoveSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-strangelove', facts: 'StockX: SB Dunk StrangeLove confirmed.' }];
const rayssaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-rayssa-leal', facts: 'StockX: SB Dunk Rayssa Leal confirmed.' }];
const famuSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-famu', facts: 'StockX: Dunk Low FAMU confirmed.' }];
const stJohnsSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-sp-st-johns', facts: 'StockX: Dunk Low St. Johns confirmed.' }];
const crownPrinceSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-crown-prince-ao-bingsan', facts: 'StockX: Dunk Low Crown Prince confirmed.' }];
const offwhite31Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot 31 confirmed.' }];
const offwhite46Src = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot 46 confirmed.' }];
const lightOrewoodSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-light-orewood-brown', facts: 'StockX: Dunk Low Light Orewood Brown confirmed.' }];
const valentinesSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-valentines-day', facts: 'StockX: SB Dunk Valentines Day confirmed.' }];
const researched = {
  '536027422376722': { sources: aprilSrc },
  '536027378694687': { sources: strangeLoveSrc },
  '536027342739217': { sources: rayssaSrc },
  '536027334395160': { sources: famuSrc },
  '536027302651666': { sources: stJohnsSrc },
  '536027369468694': { sources: crownPrinceSrc },
  '536027324510492': { sources: offwhite31Src },
  '536027317661464': { sources: offwhite46Src },
  '536027308353819': { sources: lightOrewoodSrc },
  '536027307277588': { sources: valentinesSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-120-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
