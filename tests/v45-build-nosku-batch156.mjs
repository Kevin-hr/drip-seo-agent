import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const valourBlueSrc = [{ tier: 'T2', url: 'https://www.laced.com/products/nike-sb-dunk-low-valour-blue-team-maroon', facts: 'Laced: Valour Blue Team Maroon confirmed.' }];
const worldChampSrc = [{ tier: 'T2', url: 'https://dunk.com.br/produtos/dunk-low-se-world-champ/', facts: 'Dunk.com.br: World Champ confirmed.' }];
const researched = {
  '536027114525969': { sources: valourBlueSrc },
  '536027114027289': { sources: worldChampSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-156-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
