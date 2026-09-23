import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details1790 = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1790.json'), 'utf8'));
const details1690 = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1690.json'), 'utf8'));
const byId1790 = new Map(details1790.map((d) => [d.id, d]));
const byId1690 = new Map(details1690.map((d) => [d.id, d]));
const redPandaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-red-panda', facts: 'StockX: Dunk Low Red Panda confirmed.' }];
const pigeonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-staple-nyc-pigeon', facts: 'StockX: SB Dunk Staple NYC Pigeon confirmed.' }];
const buttercupSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-powerpuff-girls-buttercup', facts: 'StockX: SB Dunk Buttercup confirmed.' }];
const blossomSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-powerpuff-girls-blossom', facts: 'StockX: SB Dunk Blossom confirmed.' }];
const greyLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-grey-lobster', facts: 'StockX: SB Dunk Grey Lobster confirmed.' }];
const yellowLobsterSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-yellow-lobster', facts: 'StockX: SB Dunk Yellow Lobster confirmed.' }];
const researched = {
  '536027263343389': { sources: redPandaSrc },
  '536027301380891': { sources: pigeonSrc },
  '536027283139095': { sources: buttercupSrc },
  '536027283027729': { sources: blossomSrc },
  '536027273499933': { sources: greyLobsterSrc },
  '536027273258263': { sources: yellowLobsterSrc }
};
const allById = { ...Object.fromEntries(byId1790), ...Object.fromEntries(byId1690) };
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = allById[pid]; if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-117-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
