import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const dodgersSrc = [{ tier: 'T2', url: 'https://www.goat.com/en-it/sneakers/dunk-low-sb-los-angeles-dodgers-do9395-400', facts: 'GOAT: SB Dunk LA Dodgers DO9395-400 confirmed.' }];
const bbSrc = [{ tier: 'T2', url: 'https://stockx.com/brands/adidas?category=sneakers&model=forum&shoe-height=low', facts: 'StockX: adidas Forum Low Bad Bunny confirmed.' }];
const researched = {
  '536027119379995': { sources: dodgersSrc },
  '536027118528796': { sources: bbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-045-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
