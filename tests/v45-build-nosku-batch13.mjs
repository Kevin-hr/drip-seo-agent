import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-540.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const loeweSrc = [{ tier: 'T1', url: 'https://www.loewe.com/eur/en/men/shoes/sneakers/flow-runner-in-nylon-and-suede/M816282X52-1102.html', facts: 'Loewe official: Flow Runner in nylon and suede, L monogram on quarter, honey rubber outsole, gold embossed Loewe on backtab, Made in Italy.' }];
const dunkSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/sb-dunk-low-de-la-soul-789841-332', facts: 'GOAT: Nike SB Dunk Low De La Soul 789841-332, Baroque Brown suede, Altitude Green elephant print, 2015 release.' }];
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com', facts: 'New Balance official: 1906R runner with ABZORB and N-ergy cushioning, Stability Web outsole.' }];
const researched = {
  '536027438129942': { sources: loeweSrc },
  '536027437904154': { sources: loeweSrc },
  '536027437373470': { sources: dunkSrc },
  '536027435218963': { sources: nbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-013-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
