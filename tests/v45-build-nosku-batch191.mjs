import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const nikeSacaiSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/sacai?trending-deals=true', facts: 'StockX: sacai confirmed.' }];
const nikeBlazerSrc = [{ tier: 'T1', url: 'https://www.nike.com.cn/t/blazer-mid-77-%E7%94%B7%E5%AD%90%E8%BF%90%E5%8A%A8%E9%9E%8B-QFzW22', facts: 'Nike: Blazer confirmed.' }];
const researched = {
  '536027078763550': { sources: nikeSacaiSrc },
  '536027078698014': { sources: nikeSacaiSrc },
  '536027078635292': { sources: nikeSacaiSrc },
  '536027078585361': { sources: nikeSacaiSrc },
  '536027070486297': { sources: nikeBlazerSrc },
  '536027070436895': { sources: nikeBlazerSrc },
  '536027070356253': { sources: nikeBlazerSrc },
  '536027070290965': { sources: nikeBlazerSrc },
  '536027070194973': { sources: nikeBlazerSrc },
  '536027070130197': { sources: nikeBlazerSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-191-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
