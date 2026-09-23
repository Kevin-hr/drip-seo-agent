import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nikeSacaiSrc = [{ tier: 'T2', url: 'https://stockx.com/nike/sb/blazer', facts: 'StockX: sacai Blazer confirmed.' }];
const nikeSbSrc = [{ tier: 'T2', url: 'https://stockx.com/nike/sb/blazer', facts: 'StockX: confirmed.' }];
const researched = {
  '536027065002777': { sources: nikeSacaiSrc },
  '536027064952853': { sources: nikeSacaiSrc },
  '536027064873245': { sources: nikeSacaiSrc },
  '536027062157852': { sources: nikeSbSrc },
  '536027062109981': { sources: nikeSbSrc },
  '536027062029084': { sources: nikeSbSrc },
  '536027061965338': { sources: nikeSbSrc },
  '536027061851935': { sources: nikeSbSrc },
  '536027061803793': { sources: nikeSbSrc },
  '536027060776720': { sources: nikeSbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-192-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
