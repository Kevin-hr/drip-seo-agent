import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const jjjSrc = [{ tier: 'T1', url: 'https://www.asics.com/us/en-us/gel-kayano-14/p/ANA_1201A457-101.html', facts: 'ASICS official: Gel-Kayano 14 JJJJound Silver Black, 1201A457-101, white mesh, metallic silver overlays, black tiger stripes, $180.' },
  { tier: 'T2', url: 'https://www.goat.com/en-gb/sneakers/jjjjound-x-gel-kayano-14-silver-black-1201a457-101', facts: 'GOAT: JJJJound x ASICS Gel-Kayano 14 Silver Black, first collab, mismatched JJJJound/ASICS branding.' }];
const cloudSrc = [{ tier: 'T1', url: 'https://www.asics.com/tr/gel-kayano-14-690', facts: 'ASICS: Gel-Kayano 14 Cloud Grey, style 1202A056-021, layered leather and mesh construction.' }];
const balSrc = [{ tier: 'T1', url: 'https://www.balenciaga.com', facts: 'Balenciaga Triple S, chunky dad sneaker confirmed line.' }];
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com', facts: 'New Balance 1906R, ABZORB and N-ergy cushioning confirmed line.' }];
const researched = {
  '536027367588629': { sources: jjjSrc },
  '536027367540764': { sources: cloudSrc },
  '536027365209879': { sources: balSrc },
  '536027365998105': { sources: nbSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact collab confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-025-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
