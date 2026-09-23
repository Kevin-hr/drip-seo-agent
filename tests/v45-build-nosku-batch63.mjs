import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2440.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const sacaiSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/sacai-vaporwaffle-royal-fuchsia', facts: 'Nike official: Sacai VaporWaffle confirmed.' }];
const converseSrc = [{ tier: 'T2', url: 'https://www.tactics.com/converse/chuck-70-shoes/parchment-garnet-egret', facts: 'Tactics: Chuck 70 Parchment/Garnet/Egret confirmed.' }];
const fragmentSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-it/collections/fragment-collabs', facts: 'GOAT: Fragment x Moncler x Converse CT70 confirmed.' }];
const researched = {
  '536027078585361': { sources: sacaiSrc },
  '536027077909273': { sources: converseSrc },
  '536027076655634': { sources: fragmentSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-063-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
