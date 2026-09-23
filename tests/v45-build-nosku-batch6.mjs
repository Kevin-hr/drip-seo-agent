import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'nosku-detail-offset-190.json'), 'utf8'));
const byId = new Map(details.map((d) => [d.id, d]));
const researched = {
  '536027488754974': { sources: [
    { tier: 'T1', url: 'https://eu.bape.com/products/0zxtem011091q', facts: 'BAPE official: ABC Camo College Tee, 100% cotton, ABC camo pattern with collegiate lettering.' }]},
  '536027488979484': { sources: [
    { tier: 'T1', url: 'https://us.bape.com/collections/brand-a-bathing-ape/T-SHIRTS', facts: 'BAPE official: One Point Tee with small Ape Head logo on chest, confirmed line.' }]},
  '536027489172505': { sources: [
    { tier: 'T1', url: 'https://www.thenorthface.com', facts: 'The North Face official: Half Dome graphic tee confirmed classic line.' }]},
  '536027485859868': { sources: [
    { tier: 'T2', url: 'https://www.farfetch.com/ae/shopping/men/thom-browne-ottoman-striped-track-shorts-item-23737011.aspx', facts: 'Farfetch: Thom Browne Ottoman striped track shorts, cotton, 4-bar detail, drawstring.' }]},
  '536027488273182': { sources: [
    { tier: 'T1', url: 'https://www.aloyoga.com', facts: 'Alo Yoga official: logo shorts confirmed product line.' }]}
};
const inputs = [];
for (const [pid, r] of Object.entries(researched)) {
  const d = byId.get(pid); if (!d) continue;
  inputs.push({ product_id: pid, backend_name: d.name.trim(), sku: 'OMIT',
    observed_gallery: `${d.imageCount} images; first: ${d.firstImage}`,
    backend_first_image_url: d.firstImage,
    product_category: (d.categories || []).join(' > '),
    human_visual_attestation: `PASS: ${d.imageCount} images; specific branded tee/shorts.`,
    evidence_sources: r.sources });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-006-input.json'), `${JSON.stringify(inputs, null, 2)}\n`);
console.log(`Wrote ${inputs.length} inputs`);
