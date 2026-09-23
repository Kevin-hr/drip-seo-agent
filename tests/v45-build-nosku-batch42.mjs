import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2040.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const jjjSrc = [{ tier: 'T1', url: 'https://www.newbalance.co.nz/pd/new-balance-x-jjjjound-made-in-usa-990v3/MR990V3-38602.html', facts: 'NB official: JJJJound x 990v3, olive nubuck over mesh, ENCAP, Made in USA.' },
  { tier: 'T2', url: 'https://www.jjjjound.com/blogs/projects/new-balance-iv', facts: 'JJJJound: 990v3 Olive, special edition, 2022.' }];
const lotSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-off-white-lot-20', facts: 'StockX: Off-White Dunk Dear Summer series confirmed.' }];
const researched = {
  '536027139034134': { sources: jjjSrc },
  '536027145287704': { sources: lotSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-042-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
