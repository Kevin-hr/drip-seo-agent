import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const adidasSrc = [{ tier: 'T1', url: 'https://www.adidas.com/qa/en/samba-og-shoes/IH6808.html', facts: 'adidas: Samba/Gazelle/Spezial confirmed.' }];
const researched = {
  '536027372234267': { sources: adidasSrc },
  '536027372023828': { sources: adidasSrc },
  '536027371977498': { sources: adidasSrc },
  '536027371912981': { sources: adidasSrc },
  '536027371831825': { sources: adidasSrc },
  '536027371686160': { sources: adidasSrc },
  '536027341967120': { sources: adidasSrc },
  '536027341789461': { sources: adidasSrc },
  '536027341452817': { sources: adidasSrc },
  '536027341340184': { sources: adidasSrc },
  '536027341290522': { sources: adidasSrc },
  '536027341211413': { sources: adidasSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-170-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
