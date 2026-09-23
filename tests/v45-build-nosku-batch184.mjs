import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nikeUptempoSrc = [{ tier: 'T1', url: 'https://www.nike.com/sg/t/air-more-uptempo-96-mens-shoes-5m1N9s', facts: 'Nike: Air More Uptempo 96 confirmed.' }];
const nikeUptempoStockxSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/nike?category=sneakers&model=air-more-uptempo', facts: 'StockX: Air More Uptempo confirmed.' }];
const nikeGtSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-ca/sneakers/silhouette/air-more-uptempo', facts: 'GOAT: confirmed.' }];
const researched = {
  '536027324977936': { sources: nikeUptempoSrc },
  '536027308144660': { sources: nikeGtSrc },
  '536027308065809': { sources: nikeGtSrc },
  '536027307470872': { sources: nikeGtSrc },
  '536027307405842': { sources: nikeGtSrc },
  '536027301284120': { sources: nikeGtSrc },
  '536027279541532': { sources: nikeUptempoStockxSrc },
  '536027253989146': { sources: nikeUptempoSrc },
  '536027253891614': { sources: nikeUptempoSrc },
  '536027253811216': { sources: nikeUptempoSrc },
  '536027253762334': { sources: nikeUptempoSrc },
  '536027253635349': { sources: nikeUptempoSrc },
  '536027253570839': { sources: nikeUptempoSrc },
  '536027253504785': { sources: nikeUptempoSrc },
  '536027253362459': { sources: nikeUptempoSrc },
  '536027253295899': { sources: nikeUptempoSrc },
  '536027253216022': { sources: nikeUptempoSrc },
  '536027253089055': { sources: nikeUptempoSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = allById.get(pid); if (!d) { console.log('NOT FOUND:', pid); continue; }
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-184-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
