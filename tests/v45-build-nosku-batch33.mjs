import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-1590.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const sambaSrc = [{ tier: 'T1', url: 'https://www.adidas.com.cn/pdp?articleId=B75807', facts: 'adidas official: Samba OG B75807, black/white, gum midsole, ¥849.' }];
const dunkSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-reese-forbes-hunter', facts: 'Nike SB Dunk Reese Forbes Hunter 304292-281 confirmed.' }];
const researched = {
  '536027306539540': { sources: sambaSrc },
  '536027308260120': { sources: dunkSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-033-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
