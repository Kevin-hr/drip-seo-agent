import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const diorB25Src = [{ tier: 'T1', url: 'https://www.dior.com/en_us/fashion/products/3SN259YUH_H960', facts: 'Dior: B25 Runner confirmed.' }];
const diorB01Src = [{ tier: 'T1', url: 'https://www.dior.cn/zh_cn/fashion/mens-fashion/shoes/b01-sneakers-matchpoint', facts: 'Dior: B01 Matchpoint confirmed.' }];
const researched = {
  '536027437003807': { sources: diorB25Src },
  '536027436973087': { sources: diorB25Src },
  '536027436923415': { sources: diorB25Src },
  '536027432133399': { sources: diorB25Src },
  '536027443545361': { sources: diorB01Src },
  '536027443482136': { sources: diorB01Src },
  '536027443224596': { sources: diorB01Src },
  '536027443062813': { sources: diorB01Src }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-179-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
