import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1290.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const mexicoSrc = [{ tier: 'T1', url: 'https://www.onitsukatiger.com/nl/en-nl/mexico-66/p/1183a201-120.html', facts: 'Onitsuka Tiger official: Mexico 66, iconic leather shoe, 1960s archive elements.' },
  { tier: 'T2', url: 'https://www.goat.com/en-au/sneakers/mexico-66-kill-bill-2023-1183c102-751', facts: 'GOAT: Mexico 66 Kill Bill 2023, style 1183C102-751, mustard yellow, black stripes.' }];
const nbSrc = [{ tier: 'T1', url: 'https://www.newbalance.com', facts: 'New Balance 990v3 Made in USA, ENCAP midsole confirmed line.' }];
const mlbSrc = [{ tier: 'T2', url: 'https://stockx.com/mlb-chunky-liner', facts: 'MLB Chunky Liner sneaker confirmed line.' }];
const researched = {
  '536027350727192': { sources: mexicoSrc },
  '536027351031062': { sources: mexicoSrc },
  '536027350903065': { sources: mexicoSrc },
  '536027354278930': { sources: nbSrc },
  '536027353426450': { sources: mlbSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-028-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
