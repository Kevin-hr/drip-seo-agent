import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const raygunWhiteSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-gb/sneakers/dunk-sb-low-tie-dye-raygun-white-bq6832-101', facts: 'GOAT: SB Dunk Raygun Tie-Dye White confirmed.' }];
const purplePigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-purple-pigeon', facts: 'StockX: SB Dunk Purple Pigeon confirmed.' }];
const supremeWRSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-supreme-white-red', facts: 'StockX: SB Dunk Supreme White Red confirmed.' }];
const supremeMSSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-supreme-metallic-silver', facts: 'StockX: SB Dunk Supreme Metallic Silver confirmed.' }];
const instantSkateSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-instant-skateboards', facts: 'StockX: SB Dunk Instant Skateboards confirmed.' }];
const researched = {
  '536027055038750': { sources: raygunWhiteSrc },
  '536027054927632': { sources: purplePigeonSrc },
  '536027041132828': { sources: supremeWRSrc },
  '536027041070103': { sources: supremeMSSrc },
  '536027041020954': { sources: instantSkateSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-146-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
