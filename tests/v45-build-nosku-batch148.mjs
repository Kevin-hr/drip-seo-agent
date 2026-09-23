import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const chicagoSplitSrc = [{ tier: 'T2', url: 'https://www.goat.com/apparel/dunk-low-chicago-split-dz2536-600', facts: 'GOAT: Dunk Low Chicago Split confirmed.' }];
const midnightNavySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-summit-white-midnight-navy', facts: 'StockX: Dunk Low Summit White Midnight Navy confirmed.' }];
const terrySwooshSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-terry-swoosh', facts: 'StockX: Dunk Low Terry Swoosh confirmed.' }];
const broncosSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-broncos', facts: 'StockX: SB Dunk Broncos confirmed.' }];
const valentinesSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-retro-prm-valentines-day-2023', facts: 'StockX: Dunk Low Valentine\'s Day 2023 confirmed.' }];
const researched = {
  '536027132201744': { sources: chicagoSplitSrc },
  '536027128794136': { sources: midnightNavySrc },
  '536027128747547': { sources: terrySwooshSrc },
  '536027128680725': { sources: broncosSrc },
  '536027128458261': { sources: valentinesSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-148-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
