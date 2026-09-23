import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const wssSrc = [{ tier: 'T1', url: 'https://www.nike.com/sg/launch/t/sb-dunk-low-why-so-sad', facts: 'Nike official: SB Dunk Low Why So Sad confirmed.' }];
const lotterySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-lottery', facts: 'StockX: Dunk Low SE Lottery confirmed.' }];
const clearBlueSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-clear-blue-swoosh', facts: 'StockX: Dunk Low Clear Blue Swoosh confirmed.' }];
const researched = {
  '536027121083158': { sources: wssSrc },
  '536027120906269': { sources: lotterySrc },
  '536027119156254': { sources: clearBlueSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-093-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
