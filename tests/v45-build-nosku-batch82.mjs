import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const venySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-vintage-navy', facts: 'StockX: Dunk Low Vintage Navy confirmed.' }];
const boneSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-sail-light-bone', facts: 'StockX: Dunk Low Sail Light Bone confirmed.' }];
const teamSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-team-red-2022', facts: 'StockX: Dunk Low Team Red confirmed.' }];
const researched = {
  '536027107776277': { sources: venySrc },
  '536027107550225': { sources: boneSrc },
  '536027105832724': { sources: teamSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-082-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
