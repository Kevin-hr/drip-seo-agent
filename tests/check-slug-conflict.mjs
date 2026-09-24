import fs from 'node:fs';

const scan = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/all-products-scan.json','utf8')).filter(x=>!x.error);
const used = new Map();
for (const p of scan) {
  const uv = (p.urlValue||'').trim();
  if (!uv) continue;
  if (!used.has(uv)) used.set(uv, []);
  used.get(uv).push(p.id);
}

const targets = ['CDG-Play-x-Converse-Chuck-Taylor-All-Star-70-OX','Nike-Dunk-Low-Medium-Curry'];
for (const t of targets) {
  const hits = scan.filter(p => (p.urlValue||'').trim() === t);
  console.log(`\n[${t}] exact hits:`, hits.length ? hits.map(h=>({id:h.id,name:h.name.slice(0,50)})) : 'NONE');
  const fuzzy = scan.filter(p => (p.urlValue||'').includes(t.replace(/-/g,'-').slice(0,30)));
  console.log(`[${t}] fuzzy contains (first 5):`);
  for (const f of fuzzy.slice(0,5)) console.log('   ', f.id, '|', f.urlValue.slice(0,80));
}

// overall stats
const pkgodLeft = scan.filter(p => /pkgod/i.test(p.urlValue||''));
console.log('\n=== overall ===');
console.log('pkgod remaining:', pkgodLeft.length);
console.log('isShow=false:', scan.filter(p=>p.isShow!==true).length);
console.log('dup urlValues:', [...used.entries()].filter(([k,v])=>v.length>1).length);
