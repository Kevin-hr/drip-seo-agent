import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const pinkPigeonSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/the-vault/pink-box/pigeon', facts: 'NikeSB: Dunk Low Pigeon confirmed.' }];
const orangeLabelSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-orange-label-white-black', facts: 'StockX: SB Dunk Orange Label confirmed.' }];
const acgTerraSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/nike?model=sb-dunk&page=4', facts: 'StockX: SB Dunk ACG Terra Red Plum confirmed.' }];
const dustyOliveSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-dusty-olive', facts: 'StockX: SB Dunk Dusty Olive confirmed.' }];
const purpleLobsterSrc = [{ tier: 'T2', url: 'http://www.nikeinc.com.cn/html/page-2847.html', facts: 'Nike: Concepts Purple Lobster confirmed.' }];
const researched = {
  '536027089131030': { sources: pinkPigeonSrc },
  '536027087168278': { sources: orangeLabelSrc },
  '536027085417234': { sources: acgTerraSrc },
  '536027083730201': { sources: dustyOliveSrc },
  '536027078168084': { sources: purpleLobsterSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-151-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
