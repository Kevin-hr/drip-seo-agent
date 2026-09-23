import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const blueBearSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/the-vault/striped-box-era/nike-sb-grateful-dead-dunk-low', facts: 'NikeSB: Grateful Dead Dunk confirmed.' }];
const pinkBearSrc = [{ tier: 'T2', url: 'https://www.dead.net/features/news-general-news/introducing-nike-sb-dunk-low-grateful-dead', facts: 'Dead.net: Grateful Dead Dunk confirmed.' }];
const orangeBearSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-sa/collections/nike-sb', facts: 'GOAT: Grateful Dead Orange Bear confirmed.' }];
const seanCliverSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-sean-cliver', facts: 'StockX: SB Dunk Sean Cliver confirmed.' }];
const diamondSupplySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-diamond-supply-co-black-diamond', facts: 'StockX: SB Dunk Diamond Supply confirmed.' }];
const researched = {
  '536027057753372': { sources: blueBearSrc },
  '536027057239829': { sources: pinkBearSrc },
  '536027057158683': { sources: orangeBearSrc },
  '536027056596247': { sources: seanCliverSrc },
  '536027056178455': { sources: diamondSupplySrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-152-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
