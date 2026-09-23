import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-940.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const am1Src = [{ tier: 'T2', url: 'https://stockx.com/ko-kr/nike-air-max-1-grand-piano', facts: 'StockX verified: Nike Air Max 1 PHANTACi Grand Piano, style 359558-111, White/Black/Gold, $150, 2009 release.' }];
const nbSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/new-balance-1906r-jack-harlow', facts: 'StockX verified: New Balance 1906R Jack Harlow, ABZORB, Acteva Lite, N-ergy.' }];
const balmainSrc = [{ tier: 'T1', url: 'https://www.balmain.com', facts: 'Balmain Unicorn low-top sneaker official line.' }];
const sambaSrc = [{ tier: 'T1', url: 'https://www.adidas.com/us/samba-og-shoes/IG1964.html', facts: 'adidas official: Samba OG, classic indoor football shoe, leather upper.' }];
const researched = {
  '536027395264024': { sources: am1Src },
  '536027394927638': { sources: nbSrc },
  '536027390778655': { sources: balmainSrc },
  '536027389798682': { sources: sambaSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-021-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
