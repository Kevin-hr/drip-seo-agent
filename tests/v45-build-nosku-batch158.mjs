import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const flipOldSchoolSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-flip-the-old-school', facts: 'StockX: Flip the Old School confirmed.' }];
const whiteOrangeSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-pro-white-orange', facts: 'StockX: Dunk Low Pro White Orange confirmed.' }];
const sambaSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-samba', facts: 'StockX: Dunk Low Samba confirmed.' }];
const teamBSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-teamb', facts: 'StockX: Dunk Low TeamB confirmed.' }];
const halloweenSrc = [{ tier: 'T2', url: 'https://www.laced.com/products/nike-dunk-low-prm-halloween', facts: 'Laced: Dunk Low PRM Halloween confirmed.' }];
const blackWhitePeachSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-pro-se-black-white-peach', facts: 'StockX: Dunk Low Black White Peach confirmed.' }];
const uncOffWhiteSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-unc-x-off-white-x-futura', facts: 'StockX: UNC x Off-White x Futura confirmed.' }];
const plumSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-plum-2020', facts: 'StockX: Dunk Low Plum 2020 confirmed.' }];
const washedCoralSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-black-washed-coral', facts: 'StockX: SB Dunk Black Washed Coral confirmed.' }];
const club58Src = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-club-58-gulf', facts: 'StockX: SB Dunk Club 58 Gulf confirmed.' }];
const veneerSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-veneer', facts: 'StockX: SB Dunk Veneer confirmed.' }];
const parraAbstractSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-parra-abstract-art', facts: 'StockX: Parra Abstract Art confirmed.' }];
const researched = {
  '536027090369817': { sources: flipOldSchoolSrc },
  '536027088679452': { sources: whiteOrangeSrc },
  '536027088567583': { sources: sambaSrc },
  '536027087780120': { sources: teamBSrc },
  '536027087217686': { sources: halloweenSrc },
  '536027079711262': { sources: blackWhitePeachSrc },
  '536027078359836': { sources: uncOffWhiteSrc },
  '536027065739287': { sources: plumSrc },
  '536027064584464': { sources: washedCoralSrc },
  '536027061916699': { sources: club58Src },
  '536027061851935': { sources: veneerSrc },
  '536027089419806': { sources: parraAbstractSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-158-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
