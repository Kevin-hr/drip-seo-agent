const fs = require('fs');
const dir = './data/runs/v45-batch-2026-09-23/';
const ID = '536027239001368';
for (const f of ['minimal-run/pkgod-residual.json','minimal-run/pkgod-final.json','minimal-run/pkgod-excel-data.json','minimal-run/remediation-results.json','queue.json']) {
  let j;
  try { j = JSON.parse(fs.readFileSync(dir + f, 'utf8')); } catch (e) { console.log('=== ' + f + ' ERR ' + e.message); continue; }
  let arr = Array.isArray(j) ? j : null;
  let holder = f;
  if (!arr) {
    for (const k of Object.keys(j)) {
      if (Array.isArray(j[k])) { arr = j[k]; holder = f + '#' + k; break; }
      if (j[k] && typeof j[k] === 'object' && JSON.stringify(j[k]).includes(ID)) {
        console.log('=== ' + f + ' key=' + k + ' (nested):');
        console.log(JSON.stringify(j[k]).slice(0, 2000));
        arr = null;
        break;
      }
    }
    if (!arr) { console.log('=== ' + f + ' (no matching array)'); continue; }
  }
  const rec = arr.find(x => String(x.id || x.product_id || '') === ID);
  console.log('=== ' + holder);
  if (rec) console.log(JSON.stringify(rec).slice(0, 2500));
  else console.log('  (ID not in array)');
}
