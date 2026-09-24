const fs = require('fs');
const r = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/bulk-nosku-1790196495326-exec/execution-results.json','utf8'));
const ok = r.filter(x=>x.success).length;
const fail = r.filter(x=>!x.success).length;
console.log(`Processed: ${r.length}/853, Success: ${ok}, Fail: ${fail}`);
// Show failure reasons
const reasons = {};
for (const x of r.filter(x=>!x.success)) {
  const m = x.error.match(/Unsafe save receipt[^]*/) || x.error.split('\n')[0];
  reasons[m.slice(0,120)] = (reasons[m.slice(0,120)]||0)+1;
}
console.log('\nFailure reasons:');
for (const [k,v] of Object.entries(reasons).sort((a,b)=>b[1]-a[1])) console.log(`  ${v}x ${k}`);
