import fs from 'node:fs';

const scan = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/all-products-scan.json','utf8')).filter(x=>!x.error);
const res = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/url-remediation-all.json','utf8'));

function filled(p){
  const t = (p.seoTitle||'').trim(), k = (p.seoKeyword||'').trim(), d = (p.seoDesc||'').trim();
  let n = 0;
  if (t && !/^reps\s*\|/i.test(t)) n++;
  if (k) n++;
  if (d) n++;
  return n;
}

const remediated = new Set(res.map(r=>r.id));
const stats = { seo3: 0, seo2: 0, seo1: 0, seo0: 0, oldUrlSet: 0, pkgodOld: 0 };
for (const p of scan) {
  const n = filled(p);
  if (n >= 3) stats.seo3++; else if (n === 2) stats.seo2++; else if (n === 1) stats.seo1++; else stats.seo0++;
  if ((p.oldUrlValue||'').trim()) stats.oldUrlSet++;
  if (/pkgod/i.test(p.oldUrlValue||'')) stats.pkgodOld++;
}

console.log('=== SEO completeness (all 3029) ===');
console.log('3/3 fields:', stats.seo3);
console.log('2/3 fields:', stats.seo2);
console.log('1/3 fields:', stats.seo1);
console.log('0/3 fields:', stats.seo0);

console.log('\n=== 301 redirect fields ===');
console.log('OldUrlValue set:', stats.oldUrlSet);
console.log('OldUrlValue contains pkgod (old path preserved for 301):', stats.pkgodOld);

// check remediated products specifically
let rem = { seo3: 0, seo0: 0, old301: 0 };
for (const r of res) {
  const p = scan.find(x => x.id === r.id);
  if (!p) continue;
  const n = filled(p);
  if (n >= 3) rem.seo3++; else if (n === 0) rem.seo0++;
  if ((p.oldUrlValue||'').includes('Pkgod')) rem.old301++;
}
console.log('\n=== remediated 502 products ===');
console.log('SEO 3/3:', rem.seo3, '| SEO 0/3:', rem.seo0, '| OldUrlValue carries Pkgod (301 source):', rem.old301);

// front url sample
console.log('\n=== sample front URLs (remediated) ===');
for (const r of res.slice(0,8)) {
  const p = scan.find(x => x.id === r.id);
  console.log(p.id, '|', (p.url||'').slice(0,70), '| old301:', (p.oldUrlValue||'').slice(0,40));
}
