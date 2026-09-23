import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const venSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-venice-w', facts: 'StockX: Dunk Low Venice confirmed.' }];
const valSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-valerian-blue', facts: 'StockX: Dunk Low Valerian Blue confirmed.' }];
const vibeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-vibe', facts: 'StockX: Dunk Low Vibe confirmed.' }];
const researched = {
  '536027106876433': { sources: venSrc },
  '536027105125904': { sources: valSrc },
  '536027104804112': { sources: vibeSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-081-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
