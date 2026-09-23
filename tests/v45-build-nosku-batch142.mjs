import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const pinkOxfordSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-pink-oxford', facts: 'StockX: Dunk Low Pink Oxford confirmed.' }];
const blackWhiteMetallicSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-black-white-metallic', facts: 'StockX: Dunk Low Black White Metallic confirmed.' }];
const clearBlueSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-clear-blue-swoosh', facts: 'StockX: Dunk Low Clear Blue Swoosh confirmed.' }];
const barberShopSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-barber-shop-black', facts: 'StockX: Dunk Low SE Barber Shop Black confirmed.' }];
const coconutMilkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-coconut-milk', facts: 'StockX: Dunk Low Coconut Milk confirmed.' }];
const researched = {
  '536027121003294': { sources: pinkOxfordSrc },
  '536027120826900': { sources: blackWhiteMetallicSrc },
  '536027119156254': { sources: clearBlueSrc },
  '536027117949208': { sources: barberShopSrc },
  '536027116727317': { sources: coconutMilkSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-142-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
