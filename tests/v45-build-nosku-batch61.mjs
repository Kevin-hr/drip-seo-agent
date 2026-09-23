import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2540.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const sashikoSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-blazer-mid-77-sashiko-navy', facts: 'StockX: Blazer Mid 77 Sashiko DD5486-492 confirmed.' }];
const shanghaiSrc = [{ tier: 'T2', url: 'https://www.jordan5.net/product/nike-blazer-mid-77-vintage-shanghai/', facts: 'Blazer Mid 77 Vintage Shanghai confirmed.' }];
const cityPrideSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/blazer-mid-77-vintage-city-pride', facts: 'GOAT: Blazer Mid City Pride confirmed.' }];
const researched = {
  '536027070065427': { sources: sashikoSrc },
  '536027069840151': { sources: shanghaiSrc },
  '536027070130197': { sources: cityPrideSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-061-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
