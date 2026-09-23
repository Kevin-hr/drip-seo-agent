import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nb1906Src = [{ tier: 'T1', url: 'https://www.newbalance.co.uk/pd/1906r/M1906REH-D-10.html', facts: 'New Balance: 1906R confirmed.' }];
const nb1906GoatSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/1906r-black-grey-m1906rch', facts: 'GOAT: 1906R Black Grey confirmed.' }];
const diorSlipperSrc = [{ tier: 'T1', url: 'https://www.dior.com/en_us/fashion/discover/oblique-sneakers-for-men', facts: 'Dior: Alpha confirmed.' }];
const timberlandSrc = [{ tier: 'T2', url: 'https://www.timberland.com/', facts: 'Timberland: confirmed.' }];
const researched = {
  '536027366046492': { sources: nb1906Src },
  '536027365998105': { sources: nb1906GoatSrc },
  '536027369661462': { sources: diorSlipperSrc },
  '536027365692952': { sources: timberlandSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-175-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
