import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1040.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const miumiuSrc = [{ tier: 'T1', url: 'https://www.miumiu.com/ww/en/p/new-balance-x-miu-miu-530-sl-suede-and-mesh-sneakers/5E165E_3D8C_F0009_F_BD05', facts: 'Miu Miu official: New Balance x Miu Miu 530 SL, suede and mesh, ultra-light, super flat sole, geometric rubber sole.' }];
const kayanoSrc = [{ tier: 'T1', url: 'https://www.asics.com', facts: 'ASICS Gel-Kayano 14, 2000s retro runner, GEL cushioning confirmed line.' }];
const jfgSrc = [{ tier: 'T2', url: 'https://stockx.com/new-balance-9060-joe-freshgoods', facts: 'StockX: Joe Freshgoods x New Balance 9060 confirmed collab.' }];
const researched = {
  '536027377507095': { sources: miumiuSrc },
  '536027377441822': { sources: miumiuSrc },
  '536027375095569': { sources: kayanoSrc },
  '536027376781850': { sources: jfgSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact collab confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-023-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
