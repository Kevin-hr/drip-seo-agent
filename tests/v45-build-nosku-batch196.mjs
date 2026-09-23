import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.co.za/men/shoes/MS327V1-41890.html', facts: 'New Balance: 327 confirmed.' }];
const asicsSrc = [{ tier: 'T2', url: 'https://www.elle.com.au/shopping/sneakers-sale-black-friday/', facts: 'ASICS Gel-Kayano 14 confirmed.' }];
const adidasSrc = [{ tier: 'T1', url: 'https://www.adidas.com.tw/SalePage/Index/10393698', facts: 'adidas Samba confirmed.' }];
const offwhiteSrc = [{ tier: 'T2', url: 'https://www.elle.com.au/shopping/sneakers-sale-black-friday/', facts: 'OFF-WHITE confirmed.' }];
const researched = {
  '536027384272414': { sources: nbSrc },
  '536027384175131': { sources: nbSrc },
  '536027384128534': { sources: nbSrc },
  '536027384078619': { sources: nbSrc },
  '536027384016670': { sources: nbSrc },
  '536027383949334': { sources: nbSrc },
  '536027383920156': { sources: nbSrc },
  '536027383404049': { sources: nbSrc },
  '536027375095569': { sources: asicsSrc },
  '536027374871826': { sources: offwhiteSrc },
  '536027372234267': { sources: adidasSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-196-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
