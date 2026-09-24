const fs = require('fs');
const raw = fs.readFileSync('./_timeout.log', 'utf8');
const m = raw.indexOf('{\n  "commit"');
const j = JSON.parse(raw.slice(m));
const ok = j.per_id.filter((x) => x.ok);
const bad = j.per_id.filter((x) => !x.ok);
// Among "bad", the ones actually published despite a drift flag:
const publishedButFlagged = bad.filter((x) => x.isShow === true);
const trulyFailed = bad.filter((x) => x.isShow !== true);
console.log('total', j.total, 'clean-ok', ok.length);
console.log('flagged-but-published', publishedButFlagged.length);
console.log('truly-failed', trulyFailed.length);
console.log('--- truly-failed:');
trulyFailed.forEach((b) => console.log(b.id, '|', b.err));
console.log('--- flagged drift fields:');
publishedButFlagged.forEach((b) => console.log(b.id, '|', (b.drift || []).join(','), '| isShow=', b.isShow));
