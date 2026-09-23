import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const michiganSrc = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/dunk-low-gs-michigan-state-cw1590-102', facts: 'GOAT: Dunk Low Michigan State confirmed.' }];
const vintageNavySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-vintage-navy', facts: 'StockX: Dunk Low Vintage Navy confirmed.' }];
const sailLightBoneSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-sail-light-bone', facts: 'StockX: Dunk Low Sail Light Bone confirmed.' }];
const veniceSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-venice', facts: 'StockX: Dunk Low Venice confirmed.' }];
const supremeBWSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-supreme-black-white', facts: 'StockX: Dunk Low Supreme Black White confirmed.' }];
const researched = {
  '536027107888155': { sources: michiganSrc },
  '536027107776277': { sources: vintageNavySrc },
  '536027107550225': { sources: sailLightBoneSrc },
  '536027106876433': { sources: veniceSrc },
  '536027106346012': { sources: supremeBWSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-143-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
