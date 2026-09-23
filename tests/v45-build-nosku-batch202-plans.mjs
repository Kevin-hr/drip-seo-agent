import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const names = {
  '536027350791446': '   Onitsuka Tiger Mexico 66 Vintage White Directoire Blue 1183B391-100 (Leather)'
};
const plans = [];
for (const [pid, rawName] of Object.entries(names)) {
  const backendNameTrimmed = rawName.trim();
  const slug = 'onitsuka-tiger-mexico-66-vintage-white-directoire-blue-leather';
  plans.push({
    product_id: pid,
    baseline_name_trimmed: backendNameTrimmed,
    product_name: backendNameTrimmed,
    subtitle: 'Onitsuka Tiger Mexico 66 Vintage White Directoire Blue Leather - Premium Running Shoe',
    slug,
    description_images: [],
    key_description_html: `<h2>Product Details</h2><ul><li>Onitsuka Tiger Mexico 66 in Vintage White and Directoire Blue</li><li>Premium leather upper with iconic Tiger Stripes design</li><li>Retro running silhouette inspired by 1968 Mexico Olympics</li><li>Comfortable cushioning with rubber sole for everyday wear</li><li>Authentic Onitsuka Tiger style with vintage aesthetic</li></ul>`,
    seo_title: 'Onitsuka Tiger Mexico 66 Vintage White Directoire Blue Leather',
    meta_description: 'Onitsuka Tiger Mexico 66 Vintage White Directoire Blue Leather - Premium retro running shoe with iconic Tiger Stripes design.',
    seo_keywords: ['Onitsuka Tiger', 'Mexico 66', 'Vintage White', 'Directoire Blue', 'Leather Sneaker']
  });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-202-plans.json'), `${JSON.stringify(plans, null, 2)}\n`);
console.log(`Wrote ${plans.length} plans`);
