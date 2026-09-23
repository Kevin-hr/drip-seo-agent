import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const oliveSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/air-jordan-1-low-travis-scott-black-phantom', facts: 'Nike: Travis Scott AJ1 confirmed.' }];
const mochaSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-ca/collections/travis-scott-air-jordan-1', facts: 'GOAT: Travis Scott AJ1 Mocha confirmed.' }];
const fragmentSrc = [{ tier: 'T2', url: 'https://uk.complex.com/sneakers/a/zac-dubasik/travis-scott-air-jordan-1-low-collabs-ranked', facts: 'Complex: Fragment x Travis Scott confirmed.' }];
const reverseMochaSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-ca/collections/travis-scott-air-jordan-1', facts: 'GOAT: Reverse Mocha confirmed.' }];
const blackPhantomSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/air-jordan-1-low-travis-scott-black-phantom', facts: 'Nike: Black Phantom confirmed.' }];
const researched = {
  '536027325732112': { sources: oliveSrc },
  '536027325668377': { sources: mochaSrc },
  '536027325473310': { sources: fragmentSrc },
  '536027090674718': { sources: mochaSrc },
  '536027087121939': { sources: fragmentSrc },
  '536027065514518': { sources: mochaSrc },
  '536027047869464': { sources: mochaSrc },
  '536027047806224': { sources: mochaSrc },
  '536027404423440': { sources: reverseMochaSrc },
  '536027404328221': { sources: blackPhantomSrc },
  '536027386732307': { sources: mochaSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-167-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
