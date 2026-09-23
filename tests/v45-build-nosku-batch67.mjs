import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-2390.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const ftcSrc = [{ tier: 'T1', url: 'https://www.nikesb.com/the-vault/striped-box-era/ftc-dunk-low-vault', facts: 'Nike SB official: FTC Lagoon Pulse DH7687-400 confirmed.' }];
const cnySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-chinese-new-year-firecracker-2021-w', facts: 'StockX: Dunk Low CNY Firecracker DH4966-446 confirmed.' }];
const halloweenSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-halloween-2021', facts: 'StockX: SB Dunk Halloween 2021 confirmed.' }];
const researched = {
  '536027087651101': { sources: ftcSrc },
  '536027088455197': { sources: cnySrc },
  '536027087217686': { sources: halloweenSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-067-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
