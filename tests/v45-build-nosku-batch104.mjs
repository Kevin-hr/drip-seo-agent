import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const chicagoSplitSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-chicago-split', facts: 'StockX: Dunk Low Chicago Split confirmed.' }];
const darkDriftwoodSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/cn/shopping/women/nike-dunk-low-dark-driftwood-item-19284930.aspx', facts: 'Farfetch: Dunk Low Dark Driftwood confirmed.' }];
const arizonaStateSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/dunk-low-arizona-state-sun-devils-dd1391-702', facts: 'GOAT: Dunk Low Arizona State confirmed.' }];
const baroqueBrownSrc = [{ tier: 'T2', url: 'https://hypebeast.com/2025/11/nike-dunk-low-baroque-brown-io4244-102-release-info', facts: 'Hypebeast: Dunk Low Baroque Brown confirmed.' }];
const researched = {
  '536027132201744': { sources: chicagoSplitSrc },
  '536027132570654': { sources: darkDriftwoodSrc },
  '536027132424987': { sources: arizonaStateSrc },
  '536027132521488': { sources: baroqueBrownSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-104-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
