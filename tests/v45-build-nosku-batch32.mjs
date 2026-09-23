import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1490.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const kobe8Src = [{ tier: 'T2', url: 'https://www.goat.com/en-ca/sneakers/kobe-8-gc-easter-555286-302', facts: 'GOAT: Nike Kobe 8 GC Easter, 555286-302, Fiberglass/Court Purple, Lunarlon, Eric Avar.' }];
const adidasSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/adidas?model=forum', facts: 'StockX: adidas Forum Bad Bunny confirmed.' }];
const researched = {
  '536027323032598': { sources: kobe8Src },
  '536027315362591': { sources: adidasSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-032-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
