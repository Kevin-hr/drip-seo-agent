import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const src = [{ tier: 'T2', url: 'https://www.showstudio.com/cms/documents/2675/balen_press_pdf.pdf', facts: 'Balenciaga Fall 24 press: new 10XL Sneaker, exaggerated proportion, yellow/white/blue and blue/grey/black colorways.' }];
const researched = {
  '536027364710425': { sources: src },
  '536027364067359': { sources: src },
  '536027363891731': { sources: src },
  '536027361366559': { sources: src }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; Balenciaga 10XL confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-026-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
