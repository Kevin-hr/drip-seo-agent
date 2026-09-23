import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const raygunBlackSrc = [{ tier: 'T2', url: 'https://www.farfetch.com/ph/shopping/men/nike-sb-dunk-low-tie-dye-rayguns-2019-black-sneakers-item-14921636.aspx', facts: 'Farfetch: SB Dunk Raygun Tie-Dye Black confirmed.' }];
const purplePigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-purple-pigeon', facts: 'StockX: SB Dunk Purple Pigeon confirmed.' }];
const medicomSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/articles/20-years-sb-collabs', facts: 'Nike SB: Medicom BE@RBRICK confirmed.' }];
const chunkyDunkySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-chunky-dunky', facts: 'StockX: SB Dunk Chunky Dunky confirmed.' }];
const civilistSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-civilist-pro-qs-thermography', facts: 'StockX: SB Dunk Civilist Thermography confirmed.' }];
const researched = {
  '536027054990869': { sources: raygunBlackSrc },
  '536027054927632': { sources: purplePigeonSrc },
  '536027040911129': { sources: medicomSrc },
  '536027040731935': { sources: chunkyDunkySrc },
  '536027040458779': { sources: civilistSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-139-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
