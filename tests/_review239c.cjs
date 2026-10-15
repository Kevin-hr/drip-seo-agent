const fs = require('fs');
const ID = '536027239001368';
const run = './data/runs/v45-batch-2026-09-23/';
// remediation-results.json structure
let j;
try {
  j = JSON.parse(fs.readFileSync(run + 'minimal-run/remediation-results.json', 'utf8'));
  console.log('remediation top keys:', Object.keys(j).join(','));
  for (const k of Object.keys(j)) {
    if (Array.isArray(j[k])) {
      const rec = j[k].find(x => JSON.stringify(x).includes(ID));
      if (rec) { console.log('remediation key=' + k + ':'); console.log(JSON.stringify(rec, null, 1).slice(0, 2000)); }
    }
  }
} catch (e) { console.log('remediation ERR', e.message); }
// bulk exec: find ALL products that failed with the same loop symptom
const ex = JSON.parse(fs.readFileSync(run + 'bulk-nosku-1790196495326-exec/execution-results.json', 'utf8'));
const arr = Array.isArray(ex) ? ex : (ex.results || ex);
console.log('\nbulk exec total:', arr.length);
const loop = arr.filter(x => JSON.stringify(x.steps || []).includes('slug-collision-retry'));
console.log('products with slug-collision-retry:', loop.map(x => x.product_id + ' success=' + x.success).join(' ; '));
// did any of them actually get Summary written? we only have this execution result, check success flags
console.log('\nsuccess summary:', arr.filter(x => x.success === true).length, 'ok /', arr.filter(x => x.success === false).length, 'fail');
arr.filter(x => x.success === false).forEach(x => console.log(' FAIL', x.product_id, String(x.error || '').slice(0, 120)));
