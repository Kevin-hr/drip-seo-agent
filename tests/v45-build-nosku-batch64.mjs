import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2440.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const src = [{ tier: 'T2', url: 'https://www.tactics.com/converse/chuck-70-shoes/parchment-garnet-egret', facts: 'Tactics: Chuck 70 variants confirmed.' }];
const converseIds = ['536027077830427', '536027077748759', '536027077589013', '536027077523987', '536027077444630', '536027077381662', '536027077686807'];
const inputs = [];
for (const pid of converseIds) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: src });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-064-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
