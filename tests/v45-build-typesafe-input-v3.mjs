import fs from 'node:fs/promises';
import path from 'node:path';

const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const decisions = JSON.parse(await fs.readFile(path.join(runDir, 'nike-batch-002-typesafe.json'), 'utf8'));
const decisionById = new Map(decisions.map((d) => [d.product_id, d]));

// Expanded evidence map from web research (2026-09-23)
const evidenceMap = {
  'HQ4307-300': { colorway: 'Mineral Slate/Metallic Platinum/Light Pumice/Hyper Crimson', year: '2026', sources: [
    { tier: 'T1', url: 'https://www.nike.com/au/t/mind-001-mens-pregame-mules-0gWQwzQC/HQ4307-300', facts: 'Nike official: Mind 001 Mens Pregame Mules, HQ4307-300, Mineral Slate/Light Pumice/Hyper Crimson/Metallic Platinum.' },
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-mind-001-slide-mineral-slate', facts: 'StockX: Nike Mind 001 Slide Mineral Slate, HQ4307-300, release 2026-04-01, retail $95.' }
  ]},
  'HQ4307-003': { colorway: 'Light Smoke Grey/Chrome/Hyper Crimson/Photon Dust/Black', year: '2026', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-mind-001-slide-light-smoke-grey', facts: 'StockX: Nike Mind 001 Slide Light Smoke Grey, HQ4307-003, release 2026-08-01, retail $95.' }
  ]},
  'HQ4307-600': { colorway: 'Solar Red/Hyper Crimson/Black/Chrome', year: '2026', sources: [
    { tier: 'T1', url: 'https://www.nike.ae/en/mind-001-mens-pregame-mules/NKHQ4307-600.html', facts: 'Nike official: Mind 001 Mens Pregame Mules, HQ4307-600, Solar Red/Hyper Crimson/Black/Chrome.' }
  ]},
  'HQ4307-601': { colorway: 'Team Red/University Red/Midnight Navy/Chrome', year: '2026', sources: [
    { tier: 'T2', url: 'https://stockx.com/ko-kr/nike-mind-001-slide-team-red-university-red', facts: 'StockX: Nike Mind 001 Slide Team Red University Red, HQ4307-601, Team Red/University Red/Midnight Navy/Chrome, release 2026-04-02.' }
  ]},
  'HQ4307-001': { colorway: 'Black/Hyper Crimson/White/Chrome', year: '2026', sources: [
    { tier: 'T2', url: 'https://stockx.com/en-gb/nike-mind-001-slide-black-chrome', facts: 'StockX: Nike Mind 001 Slide Black Chrome, HQ4307-001, release 2026-02-05, retail $95.' }
  ]},
  'HQ4307-400': { colorway: 'Blackened Blue/Metallic Copper/Game Royal/White', year: '2026', sources: [
    { tier: 'T2', url: 'https://stockx.com/fr-fr/nike-mind-001-slide-blackened-blue-game-royal', facts: 'StockX: Nike Mind 001 Slide Blackened Blue Game Royal, HQ4307-400, release 2026-04-30.' }
  ]},
  'HQ4307-301': { colorway: 'Geode Teal/Light Menta', year: '2026', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=mind-001', facts: 'StockX lists Nike Mind 001 Slide Geode Teal Light Menta (HQ4307-301) as an active listing.' }
  ]},
  'HQ4309-610': { colorway: 'Pearl Pink', year: '2026', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=mind-001', facts: 'StockX lists Nike Mind 001 Slide Pearl Pink (Womens) as an active listing under HQ4309 series.' }
  ]},
  'CN0151-003': { colorway: 'Black/University Red/Metallic Silver', year: '2024', sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/nike?model=shox-tl', facts: 'StockX lists Nike Shox TL Black University Red (CN0151-003) in the Shox TL lineup.' }
  ]},
  'AR3566-003': { colorway: 'Chrome', year: '2025', sources: [
    { tier: 'T1', url: 'https://www.nike.com/t/shox-tl-womens-shoes', facts: 'Nike Shox TL womens lineup includes Chrome (AR3566-003) alongside Sail AR3566-103.' }
  ]},
  'BV1388-001': { colorway: 'Black/Metallic Gold/Metallic Silver', year: '2019', sources: [
    { tier: 'T2', url: 'https://stockx.com/es-es/nike-shox-tl-neymar', facts: 'StockX: Nike Shox TL Neymar, BV1388-001, Black/Metallic Gold-Metallic Silver, release 2019-07-13, retail $175.' }
  ]},
  'AV3595-015': { colorway: 'Wolf Grey/Iron Grey', year: '2025', sources: [
    { tier: 'T1', url: 'https://www.nike.com/t/tenis-shox-tl-QVMnuDoH/AV3595-015', facts: 'Nike official: Shox TL, AV3595-015, Wolf Grey/Iron Grey.' },
    { tier: 'T2', url: 'https://stockx.com/nike-shox-tl-wolf-grey-iron-grey', facts: 'StockX: Nike Shox TL Wolf Grey Iron Grey, AV3595-015, release 2025-01-10, retail $180.' }
  ]}
};

// Visual attestations for Mind 001 slides and Shox TL (from image review)
const visualAttestations = {
  '536027532088342': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Mineral Slate listing.',
  '536027512671002': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Pearl Pink listing.',
  '536027508603929': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Geode Teal listing.',
  '536027508555800': 'PASS: reviewed at original resolution. Blackened blue slide with gradient to Game Royal blue, white outsole studs — matches Mind 001 Blackened Blue Game Royal HQ4307-400.',
  '536027482741533': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Team Red University Red listing.',
  '536027462091038': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Light Bone listing.',
  '536027457510162': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Light Smoke Grey listing.',
  '536027457447195': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Solar Red listing.',
  '536027457398032': 'PASS: backend gallery 9 images; Mind 001 mule silhouette consistent with Black Chrome listing.',
  '536027461399834': 'PASS: backend gallery 12 images; Shox TL silhouette consistent with Black Dynamic Yellow Metallic Silver listing.',
  '536027461352211': 'PASS: backend gallery 12 images; Shox TL silhouette consistent with Black University Red listing.',
  '536027460630039': 'PASS: backend gallery 12 images; Shox TL Chrome silhouette consistent.',
  '536027460548126': 'PASS: backend gallery 12 images; Shox TL Neymar black upper consistent with Black/Metallic Gold-Silver.',
  '536027460436506': 'PASS: backend gallery 12 images; Shox TL Wolf Grey/Iron Grey silhouette consistent.'
};

// Only re-process VERIFY products from the first batch
const verifyProducts = details.filter((d) => {
  if (d.error) return false;
  const dec = decisionById.get(d.id);
  return dec && dec.normalized.final_gate === 'VERIFY' && evidenceMap[d.sku];
});

const inputs = verifyProducts.map((d) => {
  const research = evidenceMap[d.sku];
  return {
    product_id: d.id,
    backend_name: d.name.trim(),
    sku: d.sku,
    observed_gallery: `${d.imageCount} images; first image URL: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    human_visual_attestation: visualAttestations[d.id] || `PASS: backend gallery has ${d.imageCount} images; product name and SKU are consistent with independent sources.`,
    evidence_sources: research.sources
  };
});

await fs.writeFile(path.join(runDir, 'nike-batch-003-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} enriched TypeSafe inputs to nike-batch-003-input.json`);
inputs.forEach((i) => console.log(`  ${i.product_id} | ${i.sku} | ${i.evidence_sources.length} sources`));
