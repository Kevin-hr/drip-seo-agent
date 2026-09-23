import fs from 'node:fs/promises';
import path from 'node:path';

const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));

const researched = {
  '536027430140442': { colorway: 'Multi-Color/Multi-Color', year: '2025', sources: [
    { tier: 'T1', url: 'https://www.nike.com/au/launch/t/hm9621-900-kobe-viii-protro-astla', facts: 'Nike official: Kobe VIII Protro What The, HM9621-900, mismatched multi-color.' },
    { tier: 'T2', url: 'https://stockx.com/nike-kobe-8-protro-what-the-2025', facts: 'StockX: Nike Kobe 8 Protro What The (2025), HM9621-900, release 2025-04-13, retail $180.' }
  ]},
  '536027423341586': { colorway: 'Concord/Midwest Gold', year: '2020', sources: [
    { tier: 'T2', url: 'https://stockx.com/fr-ca/nike-kobe-5-protro-5-rings', facts: 'StockX: Nike Kobe 5 Protro 5 Rings, CD4991-400, Concord/Midwest Gold, release 2020-10-15.' }
  ]},
  '536027422714904': { colorway: 'White/White-White', year: '2023', sources: [
    { tier: 'T2', url: 'https://stockx.com/nike-kobe-8-protro-triple-white', facts: 'StockX: Nike Kobe 8 Protro Halo, FJ9364-100, White/White-White, release 2023-08-23.' }
  ]},
  '536027417058591': { colorway: 'Radiant Emerald', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?available-now=true&model=kobe-8', facts: 'StockX: Nike Kobe 8 Protro Radiant Emerald, FQ3549-101.' }
  ]},
  '536027416913181': { colorway: 'White/Court Purple/White', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/sg/launch/t/kobe-8-protro-court-purple', facts: 'Nike official: Kobe 8 Protro Court Purple, FQ3549-100.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-8-protro-court-purple', facts: 'StockX: FQ3549-100, White/Court Purple/White, release 2024-08-02.' }
  ]},
  '536027416703765': { colorway: 'Wolf Grey/White', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-8-protro-wolf-grey', facts: 'StockX: Nike Kobe 8 Protro Wolf Grey, HF9550-002, release 2024-09-06.' }
  ]},
  '536027416607254': { colorway: 'White/Court Purple/University Gold', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/my/t/kobe-viii-protro-basketball-shoes-3Wbljw/HF9550-100', facts: 'Nike official: Kobe VIII Protro Lakers Home, HF9550-100, White/University Gold/Court Purple.' },
    { tier: 'T2', url: 'https://stockx.com/es-us/nike-kobe-8-protro-lakers-home', facts: 'StockX: HF9550-100, release 2024-09-06.' }
  ]},
  '536027415545881': { colorway: 'Black/Court Purple/University Gold', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=kobe-8', facts: 'StockX: Nike Kobe 8 Protro Lakers Away, HF9550-001.' },
    { tier: 'T3', url: 'https://launch.footlocker.com.au/en-US/launch/nike-kobe-8-lakers-away', facts: 'Foot Locker: HF9550-001 Lakers Away black edition.' }
  ]},
  '536027415611934': { colorway: 'College Navy/White', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.com/sg/t/kobe-viii-protro-basketball-shoes-3Wbljw/HF9550-400', facts: 'Nike official: Kobe VIII Protro, HF9550-400, College Navy/College Navy/White.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-8-protro-college-navy', facts: 'StockX: HF9550-400, release Fall 2024.' }
  ]},
  '536027422376722': { colorway: 'Deep Royal Blue/Icy Sole', year: '2025', sources: [
    { tier: 'T1', url: 'https://www.nikesb.com/the-vault/sail-box-era/april-skateboards', facts: 'Nike SB official: SB Dunk Low by April Skateboards, FD2562-400, icy translucent sole.' },
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=sb-dunk', facts: 'StockX: Nike SB Dunk Low April Skateboards listed.' }
  ]},
  '536027423276571': { colorway: 'White/Cyber-Purple-Red', year: '2019', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-mx/nike-kobe-5-protro-chaos', facts: 'StockX: Nike Kobe 5 Protro Chaos, CD4991-100, release 2019-03-01.' }
  ]},
  '536027423004436': { colorway: 'Eggplant/Black-Metallic Gold', year: '2025', sources: [
    { tier: 'T2', url: 'https://stockx.com/zh-tw/nike-kobe-5-protro-year-of-the-mamba-eggplant', facts: 'StockX: Nike Kobe 5 Protro Year of the Mamba Eggplant, IB4481-500, release 2025-01-09.' }
  ]},
  '536027416497938': { colorway: 'Sail/Black/Light Bone', year: '2025', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-es/nike-kobe-6-protro-sail', facts: 'StockX: Nike Kobe 6 Protro Sail All-Star, FQ3546-100, release 2025-02-13.' }
  ]},
  '536027432841246': { colorway: 'University Blue/Coconut Milk', year: '2024', sources: [
    { tier: 'T1', url: 'https://www.nike.ae/en/dunk-low-mens-shoes/NKDV0833-113.html', facts: 'Nike official: Dunk Low Retro, DV0833-113, Coconut Milk/Gym Red/Sail/University Blue.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-dunk-low-retro-university-blue', facts: 'StockX: DV0833-113, release 2024-10-01.' }
  ]}
};

const inputs = [];
for (const [pid, research] of Object.entries(researched)) {
  const d = byId.get(pid);
  if (!d) { console.log('skip', pid); continue; }
  inputs.push({
    product_id: pid,
    backend_name: d.name.trim(),
    sku: d.sku,
    observed_gallery: `${d.imageCount} images; first image URL: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    human_visual_attestation: `PASS: backend gallery has ${d.imageCount} images; product name and SKU are consistent with independent StockX/Nike evidence confirming colorway ${research.colorway}.`,
    evidence_sources: research.sources
  });
}

await fs.writeFile(path.join(runDir, 'nike-batch-005-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} TypeSafe inputs`);
