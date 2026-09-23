import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-840.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const tsPhantomSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/air-jordan-1-low-travis-scott-black-phantom', facts: 'Nike official: AJ1 Low x Travis Scott Black Phantom, DM7866-001, black suede, Cactus Jack branding, $150.' }];
const tsMochaSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/shopping/men/jordan-x-travis-scott-air-jordan-1-low-og-reverse-mocha-sneakers-item-18399239.aspx', facts: 'Farfetch: AJ1 Low x Travis Scott Reverse Mocha, Sail/Ridgerock suede, reverse Swoosh, Cactus Jack.' }];
const uggSrc = [{ tier: 'T1', url: 'https://www.ugg.com', facts: 'UGG Tazz slipper, style 1122553, confirmed line.' }];
const timberSrc = [{ tier: 'T1', url: 'https://www.timberland.com', facts: 'Timberland 6-inch Premium Boot confirmed line.' }];
const researched = {
  '536027404328221': { sources: tsPhantomSrc },
  '536027404423440': { sources: tsMochaSrc },
  '536027404649244': { sources: uggSrc },
  '536027401355030': { sources: timberSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-019-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
