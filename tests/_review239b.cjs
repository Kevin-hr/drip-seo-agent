const fs = require('fs');
const b = JSON.parse(fs.readFileSync('./data/runs/v45-batch-2026-09-23/bulk-nosku-1790196495326-exec/backups/536027239001368.json', 'utf8'));
const segs = Array.isArray(b.result) ? b.result : (b.args ? b.args[0] : b.result ? b.result : [b]);
const pro = segs.find(s => s.name === 'dtb_proProduct') || segs.find(s => Array.isArray(s.rows));
const row = pro.rows[0];
const C = String(row.Content || '');
console.log('Content len =', C.length);
console.log('has Pkgod =', /Pkgod/i.test(C), ' | has dripsneakers link =', C.includes('dripsneakers.net/About'));
console.log('---- Content HEAD 500 ----');
console.log(C.slice(0, 500));
console.log('---- Content has <section class="ds-pdp-key-description"> =', C.includes('ds-pdp-key-description'));
// Compare with plans key_description_html
const plans = JSON.parse(fs.readFileSync('./data/runs/v45-batch-2026-09-23/bulk-nosku-1790196495326-exec/plans.json', 'utf8'));
const p = plans.find(x => String(x.product_id) === '536027239001368');
console.log('---- plan key_description_html (expected to write) ----');
console.log(p.key_description_html);
console.log('---- plan slug:', p.slug, '| subtitle:', p.subtitle);
