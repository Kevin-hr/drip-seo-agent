const f = require('C:/Users/Administrator/Documents/drip-seo-agent/data/runs/v45-batch-2026-09-23/minimal-run/failing-ids.json');
const isFalse = f.filter(x => /IsShow false/.test(x.err));
const code3 = f.filter(x => x.err.includes('-3'));
console.log('total failing:', f.length);
console.log('IsShow-false:', isFalse.map(x => x.id).join(' '));
console.log('code-3:', code3.map(x => x.id).join(' '));
console.log('--- first 5 ---');
f.slice(0, 5).forEach(x => console.log(x.id, '::', x.err));
