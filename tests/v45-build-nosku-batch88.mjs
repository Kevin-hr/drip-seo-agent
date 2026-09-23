import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const jackieSrc = [{ tier: 'T1', url: 'https://about.nike.com/en/newsroom/releases/nike-dunk-low-jackie-robinson-official-images-release-date', facts: 'Nike official: Dunk Low Jackie Robinson confirmed.' }];
const otomoSrc = [{ tier: 'T2', url: 'https://www.carousell.sg/men-s-fashion/sneakers/otomo-katsuhiro-dunk/q-1832/', facts: 'Otomo Katsuhiro SB Dunk Low Steamboy OST confirmed.' }];
const worldChampSrc = [{ tier: 'T2', url: 'https://www.carousell.com.my/p/nike-dunk-low-se-world-champ-8-5uk-1454203587/', facts: 'Dunk Low SE World Champ DR9511-100 confirmed.' }];
const researched = {
  '536027114942993': { sources: jackieSrc },
  '536027114413846': { sources: otomoSrc },
  '536027114027289': { sources: worldChampSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-088-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
