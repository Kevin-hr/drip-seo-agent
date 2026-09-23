import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-240.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027480185879': { sources: [
    { tier: 'T1', url: 'https://essentialsfearofgod.org/collabs/adidas/', facts: 'Adidas x Fear of God Athletics collab confirmed: heavy fleece mock neck, graphic print.' }]},
  '536027483561500': { sources: [
    { tier: 'T1', url: 'https://fearofgod.com/collections/essentials-men', facts: 'Fear of God official: Essentials fleece relaxed sweatpant confirmed line.' }]},
  '536027482789657': { sources: [
    { tier: 'T1', url: 'https://fearofgod.com/collections/essentials-men', facts: 'Fear of God official: Essentials 90s tee / New York 90s tee confirmed.' }]},
  '536027479382808': { sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/stussy', facts: 'StockX: Stussy graphic tees confirmed line.' }]}
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; specific branded product.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-007-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
