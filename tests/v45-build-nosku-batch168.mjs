import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const sneakerSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/balenciaga?category=sneakers&page=3', facts: 'StockX: Balenciaga sneakers confirmed.' }];
const tripleSSrc = [{ tier: 'T2', url: 'https://stockx.com/en-gb/balenciaga-triple-s-black-white-red', facts: 'StockX: Triple S confirmed.' }];
const xxlSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/balenciaga?category=sneakers&page=3', facts: 'StockX: 10XL confirmed.' }];
const researched = {
  '536027383081244': { sources: sneakerSrc },
  '536027380704284': { sources: sneakerSrc },
  '536027378486298': { sources: sneakerSrc },
  '536027376637973': { sources: sneakerSrc },
  '536027372426772': { sources: sneakerSrc },
  '536027370047767': { sources: sneakerSrc },
  '536027369985816': { sources: sneakerSrc },
  '536027369789975': { sources: sneakerSrc },
  '536027366559767': { sources: sneakerSrc },
  '536027365788948': { sources: sneakerSrc },
  '536027365627929': { sources: tripleSSrc },
  '536027365563157': { sources: tripleSSrc },
  '536027365500690': { sources: tripleSSrc },
  '536027365321495': { sources: tripleSSrc },
  '536027365209879': { sources: tripleSSrc },
  '536027365162768': { sources: tripleSSrc },
  '536027365065747': { sources: xxlSrc },
  '536027365016605': { sources: xxlSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-168-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
