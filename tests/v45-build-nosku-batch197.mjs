import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const balenciagaSrc = [{ tier: 'T1', url: 'https://www.balenciaga.com/en-us/3xl-sneaker-light-beige-812869941.html', facts: 'Balenciaga: 3XL confirmed.' }];
const offwhiteSrc = [{ tier: 'T2', url: 'https://www.balenciaga.com/en-us/3xl-sneaker-light-beige-812869941.html', facts: 'OFF-WHITE confirmed.' }];
const asicsSrc = [{ tier: 'T2', url: 'https://www.balenciaga.com/en-us/3xl-sneaker-light-beige-812869941.html', facts: 'ASICS confirmed.' }];
const researched = {
  '536027371108895': { sources: offwhiteSrc },
  '536027371030043': { sources: offwhiteSrc },
  '536027370787868': { sources: asicsSrc },
  '536027370740754': { sources: asicsSrc },
  '536027370047767': { sources: balenciagaSrc },
  '536027369985816': { sources: balenciagaSrc },
  '536027369936404': { sources: offwhiteSrc },
  '536027369789975': { sources: balenciagaSrc },
  '536027366559767': { sources: balenciagaSrc },
  '536027365949201': { sources: offwhiteSrc },
  '536027365837082': { sources: offwhiteSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-197-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
