import fs from 'node:fs/promises';
import path from 'node:path';
const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const names = {
  '536027264919068': '    NO.731 MIHARA YASUHIRO Black And White',
  '536027264773400': '    NO.775 MIHARA YASUHIRO Pink White',
  '536027264726810': '    NO.787 MIHARA YASUHIRO Black Gold White Tail',
  '536027264516884': '    NO.781 MIHARA YASUHIRO Yellow, White, And Red',
  '536027264467731': '    NO.784 MIHARA YASUHIRO Black And White Characters',
  '536027264421400': '    NO.722 MIHARA YASUHIRO White Black'
};
const plans = [];
for (const [pid, rawName] of Object.entries(names)) {
  const backendNameTrimmed = rawName.trim();
  const slug = backendNameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  plans.push({
    product_id: pid,
    baseline_name_trimmed: backendNameTrimmed,
    product_name: backendNameTrimmed,
    subtitle: `${backendNameTrimmed} - Maison Mihara Yasuhiro Original Sole Sneaker`,
    slug,
    description_images: [],
    seo_title: backendNameTrimmed,
    meta_description: `${backendNameTrimmed} - Maison Mihara Yasuhiro original sole sneaker with vintage-style detailing.`,
    key_description_html: `<h2>Product Details</h2><ul><li>${backendNameTrimmed}</li><li>Maison Mihara Yasuhiro original sole sneaker</li><li>Vintage-style detailing on the sole</li><li>Premium leather and canvas upper</li><li>Iconic Japanese streetwear design</li></ul>`,
    seo_keywords: ['Mihara Yasuhiro', 'Original Sole', 'Sneaker', 'Japanese Streetwear', 'Vintage Style']
  });
}
await fs.writeFile(path.join(runDir, 'nosku-batch-210-plans.json'), `${JSON.stringify(plans, null, 2)}\n`);
console.log(`Wrote ${plans.length} plans`);
