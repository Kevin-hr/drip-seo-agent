const fs = require('fs');
const ID = '536027239001368';
const run = './data/runs/v45-batch-2026-09-23/';
const j = JSON.parse(fs.readFileSync(run + 'minimal-run/remediation-results.json', 'utf8'));
console.log('remediation top keys:', Object.keys(j).join(','));
for (const k of Object.keys(j)) {
  if (!Array.isArray(j[k])) continue;
  console.log('---', k, 'len=', j[k].length);
  const recs = j[k].filter(x => JSON.stringify(x).includes(ID));
  recs.forEach(r => console.log(JSON.stringify(r, null, 1).slice(0, 1800)));
  if (!recs.length && j[k].length) console.log('sample[0]:', JSON.stringify(j[k][0]).slice(0, 300));
}
// url-remediation-all too
try {
  const u = JSON.parse(fs.readFileSync(run + 'minimal-run/url-remediation-all.json', 'utf8'));
  const arr = Array.isArray(u) ? u : (u.results || []);
  const rec = arr.find(x => String(x.id) === ID);
  console.log('\nurl-remediation-all entry:');
  console.log(JSON.stringify(rec, null, 1));
} catch (e) { console.log('url-remediation ERR', e.message); }
