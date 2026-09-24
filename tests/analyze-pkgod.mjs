import fs from 'node:fs/promises';

const all = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/minimal-run/all-products-scan.json', 'utf8'));
const clean = all.filter(x => !x.error);

// 1. Products with -Pkgod- residual in URL fields
const pkgod = clean.filter(x => /pkgod/i.test(x.urlValue) || /pkgod/i.test(x.url) || /pkgod/i.test(x.oldUrlValue));
console.log(`=== Products with -Pkgod- residual: ${pkgod.length} / ${clean.length} ===`);
console.log('UrlValue cases:');
const byField = { urlValue: 0, urlOnly: 0, oldOnly: 0 };
for (const p of pkgod) {
  if (/pkgod/i.test(p.urlValue)) byField.urlValue++;
  else if (/pkgod/i.test(p.url)) byField.urlOnly++;
  else byField.oldOnly++;
}
console.log('  UrlValue contains:', byField.urlValue, '| Url only:', byField.urlOnly, '| OldUrlValue only:', byField.oldOnly);

// 2. Parse order ranking list
const txt = await fs.readFile('D:/下单排行榜.txt', 'utf8');
const lines = txt.split(/\r?\n/).filter(l => l.trim());
const rankNames = [];
for (const line of lines) {
  const m = line.match(/^\s*\d+\.\s*(.+)$/);
  if (m) rankNames.push(m[1].trim());
  else if (line.trim()) rankNames.push(line.trim());
}
console.log(`\n=== Order ranking names: ${rankNames.length} ===`);

// 3. Match P0: products in ranking list that still have -Pkgod- residual
const norm = s => s.toLowerCase().replace(/&amp;/g, '&').replace(/&#39;|'/g, "'").replace(/\s+/g, ' ').trim();
const normNames = rankNames.map(norm);
const matched = [];
for (const p of pkgod) {
  const pn = norm(p.name);
  const idx = normNames.findIndex(n => n === pn || n.includes(pn) || pn.includes(n));
  if (idx >= 0) matched.push({ ...p, rank: idx + 1, rankName: rankNames[idx] });
}
console.log(`\n=== Pkgod-residual products matching ranking list: ${matched.length} ===`);

// Save all data for Excel build
const out = {
  pkgodTotal: pkgod.length,
  pkgod: pkgod.map(p => ({ id: p.id, name: p.name, isShow: p.isShow, urlValue: p.urlValue, url: p.url, oldUrlValue: p.oldUrlValue, seoTitle: p.seoTitle, seoKeyword: p.seoKeyword, seoDesc: p.seoDesc })),
  matchedP0: matched.map(m => ({ id: m.id, name: m.name, rank: m.rank, rankName: m.rankName, urlValue: m.urlValue, url: m.url })),
  rankCount: rankNames.length
};
await fs.writeFile('data/runs/v45-batch-2026-09-23/minimal-run/pkgod-residual.json', JSON.stringify(out, null, 2));
console.log('\nSaved to pkgod-residual.json');
console.log('\nP0 matched list:');
for (const m of matched) console.log(`  #${m.rank} [${m.id}] ${m.name} -> ${m.urlValue}`);
