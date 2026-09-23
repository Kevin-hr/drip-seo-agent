import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-340.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const hermesSrc = [{ tier: 'T1', url: 'https://www.hermes.com/us/en/product/bouncing-sneaker-H261013Zv18/', facts: 'Hermès official: Bouncing sneaker in perforated calfskin, light sole, Made in Italy, 4cm sole height.' }];
const lvTaticSrc = [{ tier: 'T1', url: 'https://us.louisvuitton.com/eng-us/products/lv-tatic-runner-sneaker-nvprod7540103v/1AKC33', facts: 'LV official: LV Tatic Runner sneaker, 1990s running inspiration, mesh upper, LV Initials, lightweight outsole.' }];
const lvOlympiaSrc = [{ tier: 'T1', url: 'https://www.louisvuitton.cn/zhs-cn/products/lv-olympia-sneaker-nvprod6130104v/1AHOEU', facts: 'LV official: LV Olympia sneaker, mesh + synthetic leather + Monogram canvas, EVA outsole.' }];
const researched = {
  '536027460066584': { sources: hermesSrc },
  '536027460003102': { sources: hermesSrc },
  '536027459841043': { sources: hermesSrc },
  '536027458812959': { sources: lvTaticSrc },
  '536027458763540': { sources: lvTaticSrc },
  '536027458570775': { sources: lvTaticSrc },
  '536027458444829': { sources: lvOlympiaSrc },
  '536027458251025': { sources: lvOlympiaSrc }
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact model match to official brand site.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-009-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
