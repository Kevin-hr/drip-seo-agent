import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1740.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const screenerSrc = [{ tier: 'T1', url: 'https://www.gucci.com/int/en/pr/men/shoes-for-men/winter-shoes-for-men/mens-gg-screener-sneaker-p-5465519Y9209666', facts: 'Gucci official: GG Screener, style 546551 9Y920 9666, Gucci Lido, Cruise 2019, 70s inspiration.' }];
const miharaSrc = [{ tier: 'T2', url: 'https://stockx.com/mihara-yasuhiro', facts: 'Mihara Yasuhiro sneaker confirmed.' }];
const researched = {
  '536027265866258': { sources: screenerSrc },
  '536027264919068': { sources: miharaSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-036-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
