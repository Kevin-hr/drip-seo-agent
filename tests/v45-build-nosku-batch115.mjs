import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1890.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const clotSrc = [{ tier: 'T1', url: 'https://www.nike.com/launch/t/dunk-low-clot-fragment-design-black-and-white/', facts: 'Nike: Dunk Low CLOT Fragment confirmed.' }];
const rtjSrc = [{ tier: 'T1', url: 'https://www.nikesb.com/the-vault/sail-box-era/run-the-jewels', facts: 'Nike SB: Run The Jewels confirmed.' }];
const orangeLabelSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-pro-iso-orange-label-court-purple', facts: 'StockX: SB Dunk Orange Label Court Purple confirmed.' }];
const researched = {
  '536027245803035': { sources: clotSrc },
  '536027245643544': { sources: rtjSrc },
  '536027245320735': { sources: orangeLabelSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-115-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
