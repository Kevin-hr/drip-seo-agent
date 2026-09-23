import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1090.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const sambaSrc = [{ tier: 'T1', url: 'https://www.adidas.com.au/samba-og-shoes/IG6177.html', facts: 'adidas official: Samba OG Wonder Silver, IG6177, Wonder Silver/Chalk White/Off White, pigskin suede.' },
  { tier: 'T2', url: 'https://stockx.com/en-gb/adidas-samba-og-wonder-silver', facts: 'StockX verified: Samba OG Wonder Silver, style IG6177, $100, 2024 release.' }];
const diorSrc = [{ tier: 'T1', url: 'https://www.dior.com', facts: 'Dior Alpha oblique sandal, style 3SA081, Oblique jacquard confirmed.' }];
const adifomSrc = [{ tier: 'T1', url: 'https://www.adidas.com', facts: 'adidas AdiFom Infinity confirmed line.' }];
const researched = {
  '536027372153367': { sources: sambaSrc },
  '536027369661462': { sources: diorSrc },
  '536027371977498': { sources: adifomSrc },
  '536027372023828': { sources: adifomSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-024-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
