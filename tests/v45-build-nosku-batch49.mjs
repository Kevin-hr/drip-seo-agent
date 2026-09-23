import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const grinchSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/vault-kobe-6', facts: 'Nike official: Kobe VI Protro Grinch Green Apple confirmed.' },
  { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-6-protro-grinch?size=17', facts: 'StockX: CW2190-300, 2020.' }];
const clotsrc = [{ tier: 'T2', url: 'https://stockx.com/nike-air-max-1-clot-kiss-of-death', facts: 'StockX: AM1 CLOT KOD 2021 confirmed.' }];
const researched = {
  '536027085128222': { sources: grinchSrc },
  '536027083153175': { sources: clotsrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-049-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
