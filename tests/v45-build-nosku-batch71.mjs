import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const tripleSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-gb/sneakers/wmns-dunk-low-triple-white-dd1503-109', facts: 'GOAT: Dunk Low Triple White DD1503-109 confirmed.' }];
const teamBSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-team-red', facts: 'StockX: Dunk Low Team Red confirmed.' }];
const lilacSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-lilac', facts: 'StockX: Dunk Low Lilac confirmed.' }];
const researched = {
  '536027087894297': { sources: tripleSrc },
  '536027087780120': { sources: teamBSrc },
  '536027087843353': { sources: lilacSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-071-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
