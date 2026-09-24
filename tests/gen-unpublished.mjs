import fs from 'node:fs/promises';
const queue = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/queue.json', 'utf8'));
const blocked = new Set(['536027544723736','536027544674326','536027517605911']);
// Scan unpublished from queue products
const unpublished = queue.products.filter(p => p.liveIsShow === false && !blocked.has(String(p.productId)));
const plans = unpublished.map(p => ({
  product_id: String(p.productId),
  product_name: p.name || '',
  baseline_name_trimmed: (p.name || '').trim()
}));
await fs.writeFile('data/runs/v45-batch-2026-09-23/unpublished-ids.json', JSON.stringify(plans, null, 2));
console.log(`Unpublished plans: ${plans.length} (blocked: ${blocked.size})`);
