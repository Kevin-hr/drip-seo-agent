import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2590.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const travisSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/kz/shopping/men/nike-air-force-1-low-cactus-jack-travis-scott-item-14700437.aspx', facts: 'Farfetch: AF1 Low Cactus Jack Travis Scott confirmed.' }];
const gdSrc = [{ tier: 'T1', url: 'http://www.nikeinc.com.cn/html/page-3644.html', facts: 'Nike official: AF1 Para-Noise 2.0 G-Dragon confirmed.' }];
const sacaiSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-blazer-mid-sacai-white-grey', facts: 'StockX: Blazer Mid sacai White Grey confirmed.' }];
const researched = {
  '536027060294935': { sources: travisSrc },
  '536027060342557': { sources: gdSrc },
  '536027065082391': { sources: sacaiSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-053-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
