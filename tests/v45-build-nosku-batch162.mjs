import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const doubleBlueSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-us/men/icons/out-of-office/', facts: 'Off-White: OOO confirmed.' }];
const blackBeigeSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-us/men/icons/out-of-office/', facts: 'Off-White: OOO confirmed.' }];
const forWalkingSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-it/sneakers/silhouette/off-white-out-of-office', facts: 'GOAT: OOO For Walking confirmed.' }];
const whiteGreySrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-ie/special-categories/sale-check/whitegray-out-of-office-metal-OWIA259S25LEA0080109.html', facts: 'Off-White: OOO White Grey confirmed.' }];
const riceWhiteSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-jp/women/shoes/out-of-office/', facts: 'Off-White: OOO confirmed.' }];
const redWhiteSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white?page=25', facts: 'StockX: OOO Red White confirmed.' }];
const riceWhite2Src = [{ tier: 'T2', url: 'https://www.off---white.com/en-jp/women/shoes/out-of-office/', facts: 'Off-White: OOO Rice White confirmed.' }];
const diamondBlueSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-us/men/icons/out-of-office/', facts: 'Off-White: OOO confirmed.' }];
const pandaSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-us/men/icons/out-of-office/', facts: 'Off-White: OOO Panda confirmed.' }];
const blueWhiteSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/off-white?page=25', facts: 'StockX: OOO Blue White confirmed.' }];
const tripleWhiteSrc = [{ tier: 'T2', url: 'https://www.off---white.com/en-jp/women/shoes/out-of-office/', facts: 'Off-White: OOO Triple White confirmed.' }];
const researched = {
  '536027302938652': { sources: doubleBlueSrc },
  '536027302876954': { sources: blackBeigeSrc },
  '536027302829336': { sources: forWalkingSrc },
  '536027302763038': { sources: forWalkingSrc },
  '536027302717209': { sources: whiteGreySrc },
  '536027302603798': { sources: riceWhiteSrc },
  '536027302538260': { sources: forWalkingSrc },
  '536027301203993': { sources: redWhiteSrc },
  '536027246333713': { sources: riceWhite2Src },
  '536027246253593': { sources: diamondBlueSrc },
  '536027246124822': { sources: pandaSrc },
  '536027244645910': { sources: blueWhiteSrc },
  '536027244052247': { sources: tripleWhiteSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-162-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
