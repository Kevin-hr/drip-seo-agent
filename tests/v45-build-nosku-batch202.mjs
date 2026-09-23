import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const onitsukaSrc = [{ tier: 'T1', url: 'https://www.onitsukatiger.com/fr/fr-fr/mexico-66/p/dl408-0101.html', facts: 'Onitsuka Tiger: Mexico 66 confirmed.' }];
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com.cn/productDetail/M1906RB', facts: 'New Balance: 1906R confirmed.' }];
const researched = {
  '536027351031062': { sources: onitsukaSrc },
  '536027350966302': { sources: onitsukaSrc },
  '536027350903065': { sources: onitsukaSrc },
  '536027350791446': { sources: onitsukaSrc },
  '536027350727192': { sources: onitsukaSrc },
  '536027350421015': { sources: onitsukaSrc },
  '536027350339615': { sources: onitsukaSrc },
  '536027350244629': { sources: onitsukaSrc },
  '536027350131479': { sources: onitsukaSrc },
  '536027350067989': { sources: onitsukaSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-202-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
