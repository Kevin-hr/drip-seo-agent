import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const names = {
  '536027346259230': '   New Balance 1906R White and yellow Silver White M1906REH'
};
const plans = [];
for (const [pid, rawName] of Object.entries(names)) {
  const backendNameTrimmed = rawName.trim();
  const slug = 'new-balance-1906r-white-yellow-silver-white';
  plans.push({
    product_id: pid,
    baseline_name_trimmed: backendNameTrimmed,
    product_name: backendNameTrimmed,
    subtitle: 'New Balance 1906R White and Yellow Silver White - Retro Running Sneaker',
    slug,
    description_images: [],
    seo_title: 'New Balance 1906R White and Yellow Silver White M1906REH',
    meta_description: 'New Balance 1906R White and Yellow Silver White M1906REH - Retro running sneaker with ABZORB cushioning and N-ergy outsole.',
    key_description_html: `<h2>Product Details</h2><ul><li>New Balance 1906R in White and Yellow Silver White colorway</li><li>Retro running silhouette inspired by 2000s performance design</li><li>ABZORB SBS heel cushioning for superior shock absorption</li><li>N-ergy outsole and Stability Web technology for arch support</li><li>Mesh upper with synthetic overlays for breathable comfort</li></ul>`,
    seo_keywords: ['New Balance', '1906R', 'White Yellow', 'Silver White', 'Retro Running Shoe']
  });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-203-plans.json'), `${JSON.stringify(plans, null, 2)}\n`);
console.log(`Wrote ${plans.length} plans`);
