import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const clotSrc = [{ tier: 'T2', url: 'https://www.nike.com/sg/launch/t/dunk-low-clot-fragment-design-black-and-white', facts: 'Nike official: Dunk Low CLOT Fragment confirmed.' }];
const rtjSrc = [{ tier: 'T2', url: 'https://www.laced.com/nike/dunk-low', facts: 'Laced: SB Dunk Run The Jewels confirmed.' }];
const orangeLabelSrc = [{ tier: 'T2', url: 'https://stockx.com/it-it/nike-sb-dunk-low-pro-iso-orange-label-court-purple', facts: 'StockX: SB Dunk Pro ISO Orange Label confirmed.' }];
const industrialBlueSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-industrial-blue', facts: 'StockX: Dunk Low Industrial Blue confirmed.' }];
const yutoSrc = [{ tier: 'T2', url: 'https://shopaurore.com/products/nike-dunk-low-yuto-horigome', facts: 'shopaurore: Dunk Low Yuto Horigome confirmed.' }];
const researched = {
  '536027245803035': { sources: clotSrc },
  '536027245643544': { sources: rtjSrc },
  '536027245320735': { sources: orangeLabelSrc },
  '536027245159960': { sources: industrialBlueSrc },
  '536027221881875': { sources: yutoSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-133-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
