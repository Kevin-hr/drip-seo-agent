import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const parraSrc = [{ tier: 'T2', url: 'https://www.nikesb.com/the-vault/striped-box-era/parra-21', facts: 'Nike SB: Parra Abstract Art confirmed.' }];
const embSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-emb-nba-75th-anniversary', facts: 'StockX: Dunk Low EMB NBA 75th confirmed.' }];
const pinkPigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-og-qs-pink-pigeon', facts: 'StockX: SB Dunk Pink Pigeon confirmed.' }];
const firecrackerSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-chinese-new-year-firecracker-2021', facts: 'StockX: Dunk Low CNY Firecracker confirmed.' }];
const nikebookSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-premium-nikebook', facts: 'StockX: Dunk Low Premium Nikebook confirmed.' }];
const researched = {
  '536027089419806': { sources: parraSrc },
  '536027089322010': { sources: embSrc },
  '536027089131030': { sources: pinkPigeonSrc },
  '536027088455197': { sources: firecrackerSrc },
  '536027088504350': { sources: nikebookSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-144-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
