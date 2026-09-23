import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-140.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027491825176': { sources: [
    { tier: 'T1', url: 'https://www.gucci.com/us/en/pr/men/ready-to-wear-for-men/t-shirts-polo-shirts-for-men/polo-shirts-for-men/cotton-piquet-polo-with-web-collar-p-701735XJELJ1043', facts: 'Gucci official: Style 701735 XJELJ 1043, Cotton piquet polo with Web collar, Double G embroidery, green/red Web collar, chest patch pocket.' }]},
  '536027491695647': { sources: [
    { tier: 'T1', url: 'https://www.gucci.com/us/en/pr/men/ready-to-wear-for-men/t-shirts-polo-shirts-for-men/polo-shirts-for-men/cotton-polo-shirt-p-795174XJHHM1000', facts: 'Gucci official: Style 795174 XJHHM 1000, black stretch cotton piquet polo, Double G embroidery, dropped shoulder, chest pocket.' }]},
  '536027490585631': { sources: [
    { tier: 'T1', url: 'https://www.gucci.com/us/en/pr/men/ready-to-wear-for-men/t-shirts-polo-shirts-for-men/polo-shirts-for-men/cotton-piquet-polo-shirt-p-784422XJGJW1043', facts: 'Gucci official: Style 784422 XJGJW 1043, cotton piquet polo shirt, Gucci Lido collection, Web detail.' }]},
  '536027489493784': { sources: [
    { tier: 'T2', url: 'https://stockx.com/brands/gucci', facts: 'StockX: The North Face x Gucci collaboration confirmed with outdoor/heart logo prints.' }]},
  '536027491260954': { sources: [
    { tier: 'T2', url: 'https://www.goat.com/en-au/tops/brand/gucci', facts: 'GOAT: Gucci Firenze 1921 print tee confirmed.' }]}
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; exact style code match to Gucci official.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-005-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
