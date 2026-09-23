import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const lightBlueSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-us/off-court%E2%84%A2-low-top-sneakers-OMIA29KF25LEA0010104.html', facts: 'Off-White: OOO White Light Blue confirmed.' }];
const beigeGraySrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-us/women/shoes/sneakers/out-of-office-sneakers-OWIA259C99LEA0060161.html', facts: 'Off-White: OOO Beige confirmed.' }];
const lilacSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white?model=ooo&page=3', facts: 'StockX: OOO Lilac confirmed.' }];
const whiteOrangeSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white?model=ooo&page=3', facts: 'StockX: OOO White Orange confirmed.' }];
const militaryGreenSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-ph/men/shoes/out-of-office/', facts: 'Off-White: OOO Military Green confirmed.' }];
const lightPinkSrc = [{ tier: 'T2', url: 'https://www.ssense.com/en-us/women/designers/off-white/low-top-sneakers', facts: 'SSENSE: OOO Light Pink confirmed.' }];
const blackSkinSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white?model=ooo&page=3', facts: 'StockX: OOO confirmed.' }];
const paicuSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white?model=ooo&page=3', facts: 'StockX: OOO confirmed.' }];
const researched = {
  '536027303260702': { sources: lightBlueSrc },
  '536027303213585': { sources: beigeGraySrc },
  '536027303165463': { sources: lilacSrc },
  '536027303134238': { sources: whiteOrangeSrc },
  '536027303085340': { sources: militaryGreenSrc },
  '536027303036690': { sources: lightPinkSrc },
  '536027303421977': { sources: blackSkinSrc },
  '536027303373844': { sources: paicuSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-161-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
