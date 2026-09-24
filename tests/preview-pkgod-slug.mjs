import fs from 'node:fs';

const scan = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/all-products-scan.json','utf8')).filter(x=>!x.error);
const used = new Set(scan.map(p=>(p.urlValue||'').trim()).filter(Boolean));

function dec(s){
  return (s||'')
    .replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/&#(\d+);/g,(m,d)=>String.fromCodePoint(+d))
    .replace(/\u200b/g,'').trim();
}
function slug(n){
  let s=dec(n);
  s=s.replace(/^\[[^\]]*\]\s*/,'').replace(/^Top-Quality-?\s*/i,'').replace(/^OWF\s*/i,'')
    .replace(/^Special\s*Sale\s*&\s*/i,'').replace(/^Batch\s+Sneaker\s*&\s*/i,'');
  s=s.replace(/[^A-Za-z0-9&']+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  s=s.replace(/&/g,'and').replace(/'/g,'');
  return s;
}

const excel = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/minimal-run/pkgod-excel-data.json','utf8'));
const p0ids = new Set(excel.p0.map(r=>r.id));
const pkgod = scan.filter(p=>/pkgod/i.test(p.urlValue||''));
const p0 = pkgod.filter(p=>p0ids.has(p.id));

let dup=0, empty=0;
const seen = new Map();
for (const p of p0){
  const sl = slug(p.name);
  if(!sl){empty++;console.log('EMPTY:',p.id,p.name);continue;}
  if(used.has(sl) && sl!==(p.urlValue||'').trim()){dup++;console.log('USED-COLLIDE:',p.id,sl,'<-',p.name,'old=',p.urlValue);}
  if(seen.has(sl)){dup++;console.log('SELF-COLLIDE:',p.id,sl,'<-',p.name,'vs',seen.get(sl));}
  seen.set(sl,p.id);
}
console.log('pkgod total:',pkgod.length,'p0:',p0.length,'collisions:',dup,'empty:',empty);
console.log('--- sample new slugs ---');
for (const p of p0.slice(0,15)) console.log(p.id,'|',dec(p.name).slice(0,55),'->',slug(p.name));
