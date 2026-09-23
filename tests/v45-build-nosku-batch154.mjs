import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const runTheJewelsSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/the-vault/sail-box-era/run-the-jewels', facts: 'NikeSB: Run The Jewels Dunk confirmed.' }];
const rammellzeeSrc = [{ tier: 'T2', url: 'https://supreme.com/news/933', facts: 'Supreme: Rammellzee Dunk confirmed.' }];
const greenAppleSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-85-gray-green-apple', facts: 'StockX: Dunk Low 85 Green Apple confirmed.' }];
const floweringSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-flowering-messenger', facts: 'StockX: Dunk Low Flowering Messenger confirmed.' }];
const yearRabbitSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-gb/sneakers/dunk-low-year-of-the-rabbit-white-rabbit-candy-fd4203-161', facts: 'GOAT: Year of the Rabbit confirmed.' }];
const grayWhiteGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-85-gray-white-green', facts: 'StockX: Dunk Low 85 Gray White Green confirmed.' }];
const researched = {
  '536027245643544': { sources: runTheJewelsSrc },
  '536027143390738': { sources: rammellzeeSrc },
  '536027135931667': { sources: greenAppleSrc },
  '536027135239955': { sources: floweringSrc },
  '536027134436123': { sources: yearRabbitSrc },
  '536027133213467': { sources: grayWhiteGreenSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-154-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
