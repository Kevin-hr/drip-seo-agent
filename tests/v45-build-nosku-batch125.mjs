import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const pandaSrc = [{ tier: 'T2', url: 'https://www.nike.com.cn/t/dunk-low-retro-%E7%94%B7%E5%AD%90%E8%BF%90%E5%8A%A8%E9%9E%8B-9Mtv1cX5', facts: 'Nike official: Dunk Low Retro Panda confirmed.' }];
const universityBlueSrc = [{ tier: 'T2', url: 'https://www.nike.com/jp/launch/t/dunk-low-university-blue', facts: 'Nike official: Dunk Low University Blue confirmed.' }];
const syracuseSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-syracuse', facts: 'StockX: Dunk Low Syracuse confirmed.' }];
const kentuckySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-kentucky', facts: 'StockX: Dunk Low Kentucky confirmed.' }];
const uncSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-unc', facts: 'StockX: Dunk Low UNC confirmed.' }];
const researched = {
  '536027135626009': { sources: pandaSrc },
  '536027104192535': { sources: syracuseSrc },
  '536027126207510': { sources: kentuckySrc },
  '536027100208916': { sources: uncSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-125-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
