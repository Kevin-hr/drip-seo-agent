const fs = require('fs');
const r = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/execution-results.json', 'utf8'));
const ok = r.filter(x => x.success);
const skip = ok.filter(x => x.steps.includes('already-published')).length;
const pub = ok.filter(x => x.steps.includes('published')).length;
const fail = r.filter(x => !x.success);
console.log(`Processed: ${r.length} | Skipped(already): ${skip} | Published: ${pub} | Failed: ${fail.length}`);
if (fail.length) {
  const last = fail[fail.length - 1];
  console.log('Last fail:', last.product_id, last.error?.slice(0, 200));
  const reasons = {};
  for (const f of fail) {
    const k = f.error?.slice(0, 80) || 'unknown';
    reasons[k] = (reasons[k] || 0) + 1;
  }
  console.log('\nFailure reasons:');
  for (const [k, v] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) console.log(`  ${v}x ${k}`);
}
