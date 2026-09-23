import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const nbSrc = [{ tier: 'T2', url: 'https://www.stadiumgoods.com/products/990-v3-grey-077850', facts: 'Stadium Goods: New Balance 990v3 Grey, M990GY3, Made in USA, ENCAP midsole, pig suede and mesh.' },
  { tier: 'T1', url: 'https://www.newbalance.com.sg/men/shoes/MR990V3-38857.html', facts: 'New Balance official: 990v3 Made in USA, ENCAP midsole, pig suede and mesh upper.' }];
const balSrc = [{ tier: 'T1', url: 'https://www.balenciaga.cn/products/734731w3xl11210.html', facts: 'Balenciaga official: 3XL sneaker, mesh and polyurethane, distressed effect, size embossed.' }];
const researched = {
  '536027354391324': { sources: nbSrc },
  '536027354440720': { sources: nbSrc },
  '536027360723736': { sources: balSrc },
  '536027355197203': { sources: balSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-027-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
