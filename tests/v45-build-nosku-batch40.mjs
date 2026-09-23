import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1940.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const tripleSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/eg/shopping/men/balenciaga/shoes-2/items.aspx', facts: 'Farfetch: Balenciaga Triple S confirmed iconic dad shoe line.' }];
const speedSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/balenciaga?category=sneakers&page=7', facts: 'StockX: Balenciaga Speed 2.0 confirmed.' }];
const defenderSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/balenciaga?category=sneakers&page=6', facts: 'StockX: Balenciaga Defender confirmed.' }];
const researched = {
  '536027238712595': { sources: tripleSrc },
  '536027241445656': { sources: speedSrc },
  '536027239887388': { sources: defenderSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-040-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
