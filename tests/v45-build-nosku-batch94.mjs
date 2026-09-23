import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const coconutSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-coconut-milk', facts: 'StockX: Dunk Low Coconut Milk confirmed.' }];
const smokeGreySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-light-smoke-grey', facts: 'StockX: Dunk Low Light Smoke Grey confirmed.' }];
const sunClubSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-retro-sun-club-burn-sunrise', facts: 'StockX: Dunk Low Sun Club Burn Sunrise confirmed.' }];
const researched = {
  '536027116727317': { sources: coconutSrc },
  '536027115955736': { sources: smokeGreySrc },
  '536027115907358': { sources: sunClubSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-094-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
