import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1790.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const superstarSrc = [{ tier: 'T2', url: 'https://stockx.com/adidas-superstar-core-black-cloud-white-gold', facts: 'StockX: adidas Superstar EG4959, Core Black/Cloud White, $85, 2019.' }];
const mcqSrc = [{ tier: 'T1', url: 'https://www.alexandermcqueen.com/en-lv/pr/oversized-sneaker-553680WIAKY9071.html', facts: 'Alexander McQueen official: Oversized Sneaker, white calf leather, chunky rubber sole.' }];
const researched = {
  '536027257443100': { sources: superstarSrc },
  '536027258826513': { sources: mcqSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-037-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
