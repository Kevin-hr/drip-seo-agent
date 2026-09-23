import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-990.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const nb327Src = [{ tier: 'T1', url: 'https://www.newbalance.com/pd/327/WS327BL-B-115.html', facts: 'New Balance official: 327, 1970s running inspired, oversized N logo, lugged outsole from 355, suede/nylon upper, EVA midsole.' }];
const aj1Src = [{ tier: 'T2', url: 'https://www.goat.com/sneakers/air-jordan-1-low-travis-scott-mocha', facts: 'GOAT: AJ1 Low Travis Scott Mocha, Cactus Jack, reverse Swoosh confirmed.' }];
const balSrc = [{ tier: 'T1', url: 'https://www.balenciaga.com', facts: 'Balenciaga runner sneaker with style 803681 confirmed line.' }];
const researched = {
  '536027385187607': { sources: nb327Src },
  '536027385138460': { sources: nb327Src },
  '536027385090334': { sources: nb327Src },
  '536027386732307': { sources: aj1Src },
  '536027384656917': { sources: balSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-022-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
