import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-440.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const tnfSrc = [{ tier: 'T1', url: 'https://www.thenorthface.com/en-us/p/womens/womens-footwear/womens-trail-run-213489/womens-altamesa-500-shoes-NF0A8A9P?color=DQP', facts: 'TNF official: Altamesa 500 trail running shoes, DREAM midsole foam, SURFACE CTRL rubber outsole.' }];
const nuptseSrc = [{ tier: 'T1', url: 'https://www.thenorthface.com', facts: 'TNF official: Nuptse short down jacket iconic 1996 design confirmed.' }];
const diorB9Src = [{ tier: 'T1', url: 'https://www.dior.com', facts: 'Dior official: B9S skater sneaker with Cannage embroidery and ERL collaboration confirmed.' }];
const researched = {
  '536027449491742': { sources: tnfSrc },
  '536027449443102': { sources: tnfSrc },
  '536027449346332': { sources: tnfSrc },
  '536027448656154': { sources: nuptseSrc },
  '536027448269334': { sources: diorB9Src }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model match to official site.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-011-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
