import fs from 'node:fs/promises';
const results = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/minimal-run/execution-results.json', 'utf8'));
const failed = results.filter(r => !r.success).map(r => ({ product_id: r.product_id, product_name: '' }));
await fs.writeFile('data/runs/v45-batch-2026-09-23/minimal-run/retry.json', JSON.stringify(failed, null, 2));
console.log(`Retry list: ${failed.length} products`);
