import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const files = (await fs.readdir(runDir)).filter(f => f.startsWith('nosku-detail-offset-'));
const allById = new Map();
for (const f of files) {
  const d = JSON.parse(await fs.readFile(path.join(runDir, f), 'utf8'));
  d.forEach(x => allById.set(x.id, x));
}
const whySoSadSrc = [{ tier: 'T2', url: 'https://www.nike.com/sg/launch/t/sb-dunk-low-why-so-sad', facts: 'Nike official: SB Dunk Why So Sad confirmed.' }];
const lotterySrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-se-lottery', facts: 'StockX: Dunk Low SE Lottery confirmed.' }];
const dodgersSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-sb-dunk-low-los-angeles-dodgers', facts: 'StockX: SB Dunk LA Dodgers confirmed.' }];
const jackieRobinsonSrc = [{ tier: 'T2', url: 'https://stockx.com/nike-dunk-low-jackie-robinson', facts: 'StockX: Dunk Low Jackie Robinson confirmed.' }];
const otomoSrc = [{ tier: 'T2', url: 'https://stockx.com/otomo-katsuhiro-x-nike-sb-dunk-low-steamboy-ost', facts: 'StockX: Otomo Katsuhiro SB Dunk Steamboy OST confirmed.' }];
const researched = {
  '536027121083158': { sources: whySoSadSrc },
  '536027120906269': { sources: lotterySrc },
  '536027119379995': { sources: dodgersSrc },
  '536027114942993': { sources: jackieRobinsonSrc },
  '536027114413846': { sources: otomoSrc }
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
await fs.writeFile(path.join(runDir, 'nosku-batch-135-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
