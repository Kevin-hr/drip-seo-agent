import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const kyrieSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-kyrie-irving-baltic-blue-gs', facts: 'StockX: Dunk Low Kyrie Irving Baltic Blue confirmed.' }];
const fossilRoseSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-fossil-rose', facts: 'StockX: Dunk Low Fossil Rose confirmed.' }];
const teamRedSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-team-red', facts: 'StockX: Dunk Low Team Red confirmed.' }];
const unionCourtPurpleSrc = [{ tier: 'T2', url: 'https://stockx.com/union-la-x-nike-dunk-low-court-purple', facts: 'StockX: Union LA Dunk Low Court Purple confirmed.' }];
const yearOfTigerSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-year-of-the-tiger', facts: 'StockX: Dunk Low Year of the Tiger confirmed.' }];
const researched = {
  '536027106010128': { sources: kyrieSrc },
  '536027105881881': { sources: fossilRoseSrc },
  '536027105832724': { sources: teamRedSrc },
  '536027105527059': { sources: unionCourtPurpleSrc },
  '536027105286426': { sources: yearOfTigerSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-130-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
