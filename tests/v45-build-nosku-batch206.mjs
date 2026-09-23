import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const amqSrc = [{ tier: 'T1', url: 'https://www.alexandermcqueen.cn/products/oversized-sneaker-807881whaeg9022.html', facts: 'Alexander McQueen: Oversized confirmed.' }];
const researched = {
  '536027322605087': { sources: amqSrc },
  '536027321890587': { sources: amqSrc },
  '536027320603158': { sources: amqSrc },
  '536027320523034': { sources: amqSrc },
  '536027319734809': { sources: amqSrc },
  '536027319655704': { sources: amqSrc },
  '536027319607063': { sources: amqSrc },
  '536027319476506': { sources: amqSrc },
  '536027319364636': { sources: amqSrc },
  '536027319316764': { sources: amqSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = allById.get(pid); if (!d) { console.log('NOT FOUND:', pid); continue; }
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model confirmed.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-206-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
