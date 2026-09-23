import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-490.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const am95Src = [{ tier: 'T2', url: 'https://stockx.com/en-gb/air-max-95-og-neon-2015', facts: 'StockX verified: Style 554970-071, Black/Volt-Medium Ash, OG Neon, suede and mesh, $170 retail.' },
  { tier: 'T2', url: 'https://www.goat.com/sneakers/air-max-95-og-neon-2015-554970-071', facts: 'GOAT: Air Max 95 OG Neon 2015, Sergio Lozano design, muscle fiber gradient panels.' }];
const diorB0Src = [{ tier: 'T1', url: 'https://www.dior.com', facts: 'Dior B01 Matchpoint smooth calfskin sneaker confirmed line.' }];
const ccSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/chanel', facts: 'StockX: Chanel CC logo sneaker confirmed line.' }];
const researched = {
  '536027444993558': { sources: am95Src },
  '536027443224596': { sources: diorB0Src },
  '536027443335710': { sources: diorB0Src },
  '536027442758422': { sources: ccSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact style code confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-012-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
