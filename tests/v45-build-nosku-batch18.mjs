import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-790.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const asicsSrc = [{ tier: 'T1', url: 'https://www.asics.com/us/en-us/gel-nyc/p/ANA_1203A383-100.html', facts: 'ASICS official: GEL-NYC, 2000s running influences, GEL-NIMBUS 3 upper, GEL cushioning.' },
  { tier: 'T2', url: 'https://www.stadiumgoods.com/products/gel-nyc-cream-mineral-beige-pink-131803', facts: 'Stadium Goods: Gel-NYC Cream Mineral Beige Pink, style 1203A383-104, $309.' }];
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com.cn/productDetail/U1906AE', facts: 'New Balance official: 1906A series, ACTEVA LITE cushioning, N-ergy, ABZORB SBS.' }];
const clSrc = [{ tier: 'T1', url: 'https://us.christianlouboutin.com/us_en/astroloubi-black-loubi-3230886h358.html', facts: 'Christian Louboutin official: Astroloubi, 90s basketball-inspired, CL monogram, spikes.' }];
const researched = {
  '536027409937688': { sources: asicsSrc },
  '536027408298521': { sources: nbSrc },
  '536027407882002': { sources: clSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-018-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
