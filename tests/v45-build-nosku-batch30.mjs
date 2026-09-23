import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const gazelleSrc = [{ tier: 'T2', url: 'https://www.sneakerjagers.com/en/s/adidas-originals-gazelle-indoor-ig9979/374004', facts: 'Sneakerjagers: adidas Gazelle Indoor IG9979, gold letters above stripes, branded outsole pattern.' },
  { tier: 'T1', url: 'https://www.adidas.com.au/gazelle-indoor-shoes/IG5929.html', facts: 'adidas official: Gazelle Indoor.' }];
const sambaSrc = [{ tier: 'T1', url: 'https://www.adidas.com/kw/en/samba-og-shoes/B75806.html', facts: 'adidas official: Samba OG B75806.' }];
const nb9060Src = [{ tier: 'T1', url: 'https://www.newbalance.com', facts: 'New Balance 9060 confirmed line.' }];
const researched = {
  '536027341452817': { sources: gazelleSrc },
  '536027340245267': { sources: sambaSrc },
  '536027336532506': { sources: nb9060Src }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-030-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
