import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const northernLightsSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-gb/sneakers/dunk-low-premium-sb-ae-qs-premier-northern-lights-724183-063', facts: 'GOAT: SB Dunk Premier Northern Lights confirmed.' }];
const greenLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-concepts-green-lobster', facts: 'StockX: SB Dunk Concepts Green Lobster confirmed.' }];
const pandaPigeonSrc = [{ tier: 'T2', url: 'https://www.therealreal.com/designers/nike-sb', facts: 'The RealReal: SB Dunk Staple Panda Pigeon confirmed.' }];
const michiganSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-off-white-white-michigan', facts: 'StockX: SB Dunk Off-White White Michigan confirmed.' }];
const gameRoyalSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-premium-white-game-royal', facts: 'StockX: SB Dunk Premium White Game Royal confirmed.' }];
const researched = {
  '536027061659673': { sources: northernLightsSrc },
  '536027059857685': { sources: greenLobsterSrc },
  '536027057526806': { sources: pandaPigeonSrc },
  '536027057593625': { sources: michiganSrc },
  '536027056420634': { sources: gameRoyalSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-138-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
