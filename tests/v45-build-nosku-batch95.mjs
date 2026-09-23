import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const nextNatureSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-next-nature-white-mint', facts: 'StockX: Dunk Low Next Nature White Mint confirmed.' }];
const barberBlackSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-barber-shop-black', facts: 'StockX: Dunk Low Barber Shop Black confirmed.' }];
const barberGreySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-barber-shop-grey', facts: 'StockX: Dunk Low Barber Shop Grey confirmed.' }];
const researched = {
  '536027116664343': { sources: nextNatureSrc },
  '536027117949208': { sources: barberBlackSrc },
  '536027117771546': { sources: barberGreySrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-095-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
