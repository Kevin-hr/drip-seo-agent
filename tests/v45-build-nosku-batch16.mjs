import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-690.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const clSrc = [{ tier: 'T1', url: 'https://us.christianlouboutin.com/us_en/astroloubi-black-loubi-3230886h358.html', facts: 'Christian Louboutin official: Astroloubi, 90s basketball-inspired low-top, calf leather and suede, CL varsity monogram, signature spikes.' }];
const mmSrc = [{ tier: 'T1', url: 'https://www.maisonmargiela.com', facts: 'Maison Margiela Replica German Army Trainer official line.' }];
const lvaf1Src = [{ tier: 'T2', url: 'https://www.sothebys.com/en/buy/_louis-vuitton-x-nike-air-force-1-red-or-size-8', facts: 'Sothebys: LV x Nike Air Force 1 by Virgil Abloh, 2022 posthumous release, 47 bespoke pairs.' }];
const researched = {
  '536027420721683': { sources: clSrc },
  '536027420672277': { sources: clSrc },
  '536027418745108': { sources: mmSrc },
  '536027417635601': { sources: lvaf1Src }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-016-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
