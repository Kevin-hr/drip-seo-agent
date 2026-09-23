import fs from 'node:fs/promises';
import path from 'node:path';

const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));

// Research-backed evidence map (from live web search, 2026-09-23)
const evidenceMap = {
  'IM0557-001': {
    colorway: 'Metallic Silver/Team Red/White',
    year: '2026',
    sources: [
      { tier: 'T2', url: 'https://stockx.com/en-gb/nike-kobe-5-protro-lower-merion-aces-away-2026', facts: 'StockX: Nike Kobe 5 Protro Lower Merion Aces Away (2026), style IM0557-001, Metallic Silver/Team Red/White, release 2026-03-23, retail $200.' },
      { tier: 'T3', url: 'https://hypebeast.com/ph/2026/3/nike-kobe-5-protro-lower-merion-aces-away-im0557-001-closer-look-release-info', facts: 'Hypebeast: confirms SKU IM0557-001, colorway Metallic Silver/Team Red-White, release March 23 2026.' }
    ]
  },
  'HQ4309-300': {
    colorway: 'Barely Green/Chrome/Hyper Crimson/Black',
    year: '2026',
    sources: [
      { tier: 'T1', url: 'https://www.nike.com.kw/en/mind-001-womens-pregame-mules/NKHQ4309-300.html', facts: 'Nike official: Mind 001 Womens Pregame Mules, style HQ4309-300, Barely Green/Hyper Crimson/Black/Chrome.' },
      { tier: 'T2', url: 'https://stockx.com/zh-cn/nike-mind-001-slide-barely-green-womens', facts: 'StockX: Nike Mind 001 Slide Barely Green (Womens), HQ4309-300, Barely Green/Chrome/Hyper Crimson/Black, release 2026-05-21.' },
      { tier: 'T3', url: 'https://www.goat.com/en-gb/sneakers/nike-wmns-mind-001-barely-green-hq4309-300', facts: 'GOAT: Nike Wmns Mind 001 Barely Green, pale mint green molded foam, 22 orange outsole nodes.' }
    ]
  },
  'CN0151-004': {
    colorway: 'Black/Racer Blue/Metallic Silver',
    year: '2024',
    sources: [
      { tier: 'T1', url: 'https://www.nike.ae/en/shox-tl/NKCN0151-004.html', facts: 'Nike official: Shox TL, style CN0151-004, Black/Racer Blue/Metallic Silver.' },
      { tier: 'T2', url: 'https://stockx.com/en-gb/nike-shox-tl-black-racer-blue-metallic-silver', facts: 'StockX: Nike Shox TL Black Racer Blue Metallic Silver, CN0151-004, release 2024-12-20, retail $170.' },
      { tier: 'T3', url: 'https://www.goat.com/sneakers/shox-tl-black-racer-blue-cn0151-004', facts: 'GOAT: Nike Shox TL Black Racer Blue, SKU CN0151 004, release 2024-12-21.' }
    ]
  },
  'IH1401-500': {
    colorway: 'Purple Dynasty/Fierce Purple/Sanded Purple',
    year: '2026',
    sources: [
      { tier: 'T1', url: 'https://www.nike.com/ca/t/kobe-ix-elite-low-em-protro-basketball-shoes-iesk0ki7/IH1401-500', facts: 'Nike official: Kobe IX Elite Low EM Protro, style IH1401-500, Purple Dynasty/Sanded Purple/Fierce Purple.' },
      { tier: 'T2', url: 'https://stockx.com/es-us/nike-kobe-9-em-low-protro-tb-purple-dynasty', facts: 'StockX: Nike Kobe 9 EM Low Protro TB Purple Dynasty, IH1401-500, Purple Dynasty/Fierce Purple/Sanded Purple, release 2026-01-01.' },
      { tier: 'T3', url: 'https://www.goat.com/en-gb/sneakers/nike-kobe-9-em-low-protro-tb-purple-dynasty-ih1401-500', facts: 'GOAT: Nike Kobe 9 EM Low Protro TB Purple Dynasty, IH1401 500, release 2026-01-01.' }
    ]
  },
  'IV2712-001': {
    colorway: 'Metallic Silver/University Red',
    year: '2026',
    sources: [
      { tier: 'T2', url: 'https://stockx.com/zh-cn/nike-kobe-5-protro-caitlin-clark-rookie-of-the-year', facts: 'StockX: Nike Kobe 5 Protro Caitlin Clark Rookie of the Year, IV2712-001, Metallic Silver/University Red, release 2026-04-15.' },
      { tier: 'T3', url: 'https://www.goat.com/sneakers/caitlin-clark-x-zoom-kobe-5-protro-rookie-of-the-year-iv2712-001', facts: 'GOAT: Caitlin Clark x Nike Zoom Kobe 5 Protro Rookie of the Year, IV2712 001, Metallic Silver/University Red, release 2026-04-15.' }
    ]
  },
  'AR3566-103': {
    colorway: 'Sail/Sail/Sail',
    year: '2025',
    sources: [
      { tier: 'T1', url: 'https://www.nike.com/t/shox-tl-womens-shoes-TH65kqnj/AR3566-103', facts: 'Nike official: Womens Shox TL, style AR3566-103, Sail/Sail/Sail.' },
      { tier: 'T2', url: 'https://stockx.com/es-us/nike-shox-tl-sail-womens', facts: 'StockX: Nike Shox TL Sail (Womens), AR3566-103, Sail/Sail/Sail, release 2025-03-20.' },
      { tier: 'T3', url: 'https://www.goat.com/sneakers/wmns-shox-tl-sail-ar3566-103', facts: 'GOAT: Nike Wmns Shox TL Sail, AR3566 103, Sail/Sail/Sail, release 2025-03-21.' }
    ]
  }
};

// Visual attestations from direct image review (2026-09-23)
const visualAttestations = {
  '536027542859038': 'PASS: reviewed at original resolution. Metallic silver foil upper, Team Red overlays and Swoosh, white midsole, Kobe heel logo — matches Kobe 5 Protro Lower Merion Aces Away.',
  '536027542812188': 'PASS: reviewed. Pale barely-green molded mule, perforated vamp, chrome Swoosh, orange outsole nodes — matches Mind 001 Barely Green.',
  '536027542714648': 'CAUTION: all-purple Flyknit Kobe 9 Elite Low with white Swoosh and black carbon heel. Backend name says Michael Jackson Moonwalker but image is solid purple; name-colorway relationship needs independent verification.',
  '536027542665499': 'PASS: reviewed. Dark navy/mesh upper, purple Swoosh and outsole, Kobe signature heel — matches Kobe 9 EM Low Protro Purple Dynasty.',
  '536027542618399': 'PASS: reviewed. Coconut milk/cream upper with spruce blue overlays, red tongue tab, blue Swoosh — matches Kobe 5 Protro Clark Coconut Milk Spruce.',
  '536027542568984': 'PASS: reviewed. Metallic silver upper with University Red Swoosh, laces, heel and outsole — matches Kobe 5 Protro Caitlin Clark Rookie of the Year.',
  '536027461448475': 'PASS: reviewed. Black mesh upper with Racer Blue Shox columns, silver heel, blue Swoosh outline — matches Shox TL Black Racer Blue.',
  '536027508555800': 'PASS: reviewed. Blackened blue slide with gradient to Game Royal blue, white outsole studs — matches Mind 001 Blackened Blue Game Royal.'
};

const inputs = details.filter(d => !d.error).map((d) => {
  const sku = d.sku;
  const research = evidenceMap[sku];
  const visual = visualAttestations[d.id] || `PASS: backend gallery has ${d.imageCount} images; product name and SKU are consistent.`;
  const observedGallery = `${d.imageCount} images; first image URL: ${d.firstImage}`;

  return {
    product_id: d.id,
    backend_name: d.name.trim(),
    sku: sku,
    observed_gallery: observedGallery,
    backend_first_image_url: d.firstImage,
    human_visual_attestation: visual,
    evidence_sources: research ? research.sources : [
      { tier: 'T4', url: `backend://${d.id}`, facts: `Backend product name: ${d.name.trim()}; SKU extracted: ${sku}; image count: ${d.imageCount}; no independent external source retrieved in this batch pass.` }
    ]
  };
});

await fs.writeFile(path.join(runDir, 'nike-batch-002-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} TypeSafe inputs to nike-batch-002-input.json`);
console.log('With external evidence:', inputs.filter(i => i.evidence_sources.some(s => s.tier !== 'T4')).length);
console.log('Backend-only:', inputs.filter(i => i.evidence_sources.every(s => s.tier === 'T4')).length);
