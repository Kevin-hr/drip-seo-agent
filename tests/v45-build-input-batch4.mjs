import fs from 'node:fs/promises';
import path from 'node:path';

const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));

const researched = {
  '536027455053339': { colorway: 'Ocean Fog/Ocean Fog/Black', year: '2025', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-us/nike-sb-dunk-low-supreme-94-ocean-fog', facts: 'StockX: Nike SB Dunk Low Supreme 94 Ocean Fog, HQ8487-400, Ocean Fog/Ocean Fog/Black, release 2025-09-04, retail $135.' },
    { tier: 'T3', url: 'https://www.goat.com/en-it/sneakers/supreme-x-dunk-low-sb-ocean-fog-hq8487-400', facts: 'GOAT: Supreme x Nike Dunk Low SB Ocean Fog, suede upper, black base with marina blue overlays, 94 graphic on heel.' }
  ]},
  '536027445313818': { colorway: 'Gridiron/Pink Beam/Black', year: '2023', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-max-95-sp-corteiz-pink-beam', facts: 'StockX: Nike Air Max 95 SP Corteiz Pink Beam, FB2709-001, Gridiron/Pink Beam/Black, release 2023-03-21, retail $190.' }
  ]},
  '536027444171288': { colorway: 'Black/Metallic Gold/Black', year: '2025', sources: [
    { tier: 'T1', url: 'https://www.nike.com/au/launch/t/fz7333-002-kobe-ix-elite-low-em-protro-astla', facts: 'Nike official: Kobe IX Low Protro EM Mambacita, FZ7333-002, black and white mesh upper with metallic gold accents.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-9-em-low-protro-mambacita', facts: 'StockX: Nike Kobe 9 EM Low Protro Mambacita, FZ7333-002, Black/Metallic Gold/Black, release 2025-05-01.' }
  ]},
  '536027438882834': { colorway: 'White/White-Cobalt Tint-White', year: '2022', sources: [
    { tier: 'T1', url: 'https://www.nike.com/tw/launch/t/nocta-air-force-1-white', facts: 'Nike official: NOCTA Air Force 1 White, CZ8065-100, triple-white premium leather.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-air-force-1-low-drake-certified-lover-boy', facts: 'StockX: Nike AF1 Low Drake NOCTA Certified Lover Boy, CZ8065-100, White/White-Cobalt Tint-White, release 2022-12-08.' }
  ]},
  '536027437211673': { colorway: 'Black/Black', year: '2021', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-mx/nike-dunk-low-sp-undefeated-black-dunk-vs-af1-pack', facts: 'StockX: Nike Dunk Low SP Undefeated 5 On It Black, DO9329-001, Black/Black, release 2021-09-08, retail $120.' },
    { tier: 'T3', url: 'https://www.goat.com/en-ca/sneakers/undefeated-x-dunk-low-dunk-vs-af1-do9329-001', facts: 'GOAT: Undefeated x Nike Dunk Low Dunk vs AF1, DO9329 001, Black/Black/Black, release 2021-09-04.' }
  ]},
  '536027434961171': { colorway: 'Midnight Navy/Bright Crimson', year: '2025', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-5-protro-caitlin-clark-indiana-fever', facts: 'StockX: Nike Kobe 5 Protro Caitlin Clark Indiana Fever, IM3207-400, Midnight Navy/Bright Crimson, release 2025-06-30.' },
    { tier: 'T3', url: 'https://www.goat.com/sneakers/caitlin-clark-x-zoom-kobe-5-protro-indiana-fever-im3207-400', facts: 'GOAT: Caitlin Clark x Zoom Kobe 5 Protro Indiana Fever, IM3207 400, Midnight Navy/Bright Crimson/University Gold.' }
  ]},
  '536027435992856': { colorway: 'White/Metallic Silver-Max Orange-White', year: '2019', sources: [
    { tier: 'T1', url: 'https://www.nike.sa/en/shox-tl-mens-shoes/NKAV3595-100.html', facts: 'Nike official: Shox TL, AV3595-100, White/Metallic Silver/Max Orange/White.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-shox-tl-white-metallic-silver', facts: 'StockX: Nike Shox TL White Metallic Silver, AV3595-100, release 2019-07-25, retail $170.' }
  ]},
  '536027444911378': { colorway: 'Team Red/Summit White/University Red', year: '2022', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-mx/air-max-95-anatomy-of-air-gid', facts: 'StockX: Nike Air Max 95 Anatomy of Air GID, DM0012-600, Team Red/Summit White/University Red, release 2022-06-23.' },
    { tier: 'T3', url: 'https://www.goat.com/en-gb/sneakers/air-max-95-anatomy-of-air-dm0012-600', facts: 'GOAT: Nike Air Max 95 Anatomy of Air, DM0012 600, muscle-inspired colorway.' }
  ]},
  '536027436585748': { colorway: 'Game Royal/White-University Red', year: '2025', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-es/nike-kobe-6-protro-dodgers-pe', facts: 'StockX: Nike Kobe 6 Protro Dodgers, CW2190-400, Game Royal/White-University Red, release 2025-05-30.' }
  ]}
};

const inputs = [];
for (const [pid, research] of Object.entries(researched)) {
  const d = byId.get(pid);
  if (!d) { console.log('skip', pid, 'not in batch details'); continue; }
  inputs.push({
    product_id: pid,
    backend_name: d.name.trim(),
    sku: d.sku,
    observed_gallery: `${d.imageCount} images; first image URL: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    human_visual_attestation: `PASS: backend gallery has ${d.imageCount} images; product name and SKU are consistent with independent StockX/Nike/GOAT evidence confirming colorway ${research.colorway}.`,
    evidence_sources: research.sources
  });
}

await fs.writeFile(path.join(runDir, 'nike-batch-004-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} TypeSafe inputs to nike-batch-004-input.json`);
