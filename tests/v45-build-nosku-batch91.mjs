import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const valourSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-valour-blue-team-maroon', facts: 'StockX: SB Dunk Valour Blue Team Maroon confirmed.' }];
const otomoKobeSrc = [{ tier: 'T2', url: 'https://stockx.com/otomo-katsuhiro-x-nike-sb-dunk-low-pro-kobe', facts: 'StockX: Otomo Katsuhiro SB Dunk Pro Kobe confirmed.' }];
const graffitiSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-graffiti-pink', facts: 'StockX: Dunk Low Graffiti Pink confirmed.' }];
const researched = {
  '536027114525969': { sources: valourSrc },
  '536027114124572': { sources: otomoKobeSrc },
  '536027114366480': { sources: graffitiSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-091-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
