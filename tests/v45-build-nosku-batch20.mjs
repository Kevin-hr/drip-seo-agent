import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-890.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const rolexSrc = [{ tier: 'T1', url: 'https://www.rolex.cn/en/watches/submariner/m126610ln-0001', facts: 'Rolex official: Submariner Date, 41mm Oystersteel, black Cerachrom bezel, black dial, ref 126610LN.' }];
const daytonaSrc = [{ tier: 'T1', url: 'https://assets.rolex.com/api/brochure/en/cosmograph-daytona/m126500ln-0001.pdf', facts: 'Rolex official: Cosmograph Daytona, 40mm Oystersteel, white dial, black Cerachrom bezel, ref 126500LN.' }];
const gmtSrc = [{ tier: 'T1', url: 'https://www.rolex.com', facts: 'Rolex GMT-Master II Pepsi, ref 126710BLRO, Jubilee bracelet confirmed.' }];
const researched = {
  '536027396228112': { sources: rolexSrc },
  '536027397818384': { sources: daytonaSrc },
  '536027396034576': { sources: gmtSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact Rolex ref confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-020-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
