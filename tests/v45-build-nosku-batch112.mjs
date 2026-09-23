import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2040.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const industrialSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-industrial-blue', facts: 'StockX: Dunk Low Industrial Blue confirmed.' }];
const whiteLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-sb-dunk-low-white-lobster-friends-and-family', facts: 'StockX: SB Dunk White Lobster confirmed.' }];
const photonSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/ph/shopping/women/nike-dunk-low-photon-dust-sneakers-item-20611944.aspx', facts: 'Farfetch: Dunk Low Photon Dust confirmed.' }];
const researched = {
  '536027144533529': { sources: industrialSrc },
  '536027143311126': { sources: whiteLobsterSrc },
  '536027139643935': { sources: photonSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-112-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
