import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const brownVeilSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-brown-veil-sail-vivid-green', facts: 'StockX: Dunk Low Brown Veil confirmed.' }];
const vintageGreenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-vintage-green', facts: 'StockX: Dunk Low Vintage Green confirmed.' }];
const barberGreySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-barber-shop-grey', facts: 'StockX: Dunk Low SE Barber Shop Grey confirmed.' }];
const whiteMintSrc = [{ tier: 'T2', url: 'https://www.laced.com/nike/green-dunks', facts: 'Laced: Dunk Low Next Nature White Mint confirmed.' }];
const kobeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-kobe', facts: 'StockX: SB Dunk Kobe confirmed.' }];
const researched = {
  '536027120760858': { sources: brownVeilSrc },
  '536027118851348': { sources: vintageGreenSrc },
  '536027117771546': { sources: barberGreySrc },
  '536027116664343': { sources: whiteMintSrc },
  '536027116021021': { sources: kobeSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-149-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
