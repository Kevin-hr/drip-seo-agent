const fs = require('fs');
const p = 'data/runs/v45-batch-2026-09-23/minimal-run/retry-run/execution-results.json';
if (!fs.existsSync(p)) { console.log('Not ready'); process.exit(0); }
const r = JSON.parse(fs.readFileSync(p, 'utf8'));
const ok = r.filter(x => x.success);
const skip = ok.filter(x => x.steps.includes('already-published')).length;
const pub = ok.filter(x => x.steps.includes('published')).length;
const fail = r.filter(x => !x.success);
console.log(`Retry: ${r.length} | Already: ${skip} | Published: ${pub} | Failed: ${fail.length}`);
if (fail.length) console.log('Still failing:', fail.map(f => f.product_id).join(', '));
