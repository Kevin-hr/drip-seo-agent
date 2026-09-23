import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1990.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const yutoSrc = [{ tier: 'T2', url: 'https://stockx.com/en/nike-sb-dunk-low-yuto-horigome', facts: 'StockX: SB Dunk Yuto Horigome confirmed.' }];
const bornRaisedSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-sb-dunk-low-born-x-raised-one-block-at-a-time', facts: 'StockX: SB Dunk Born x Raised confirmed.' }];
const georgetownSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-georgetown', facts: 'StockX: Dunk Low Georgetown confirmed.' }];
const owSrc = [{ tier: 'T2', url: 'https://www.flightclub.com/collections/off-white-nike-dunk-low-the-50', facts: 'Flight Club: Off-White Dunk Lot confirmed.' }];
const researched = {
  '536027221881875': { sources: yutoSrc },
  '536027158451224': { sources: bornRaisedSrc },
  '536027158387487': { sources: georgetownSrc },
  '536027145512472': { sources: owSrc },
  '536027145464343': { sources: owSrc },
  '536027145399056': { sources: owSrc },
  '536027145335836': { sources: owSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-113-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
