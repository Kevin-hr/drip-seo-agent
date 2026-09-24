import fs from 'node:fs/promises';

const all = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/minimal-run/all-products-scan.json', 'utf8'));
const clean = all.filter(x => !x.error);

// 1. Products with -Pkgod- residual
const pkgod = clean.filter(x => /pkgod/i.test(x.urlValue) || /pkgod/i.test(x.url) || /pkgod/i.test(x.oldUrlValue));
console.log(`Pkgod-residual: ${pkgod.length}/${clean.length}`);

// 2. Parse ranking list
const txt = await fs.readFile('D:/下单排行榜.txt', 'utf8');
const rankNames = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  .map(l => l.replace(/^\s*\d+\.\s*/, '').trim());

const norm = s => s.toLowerCase()
  .replace(/&amp;/g, '&').replace(/&#39;|&#8217;|’/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ').replace(/\u200b/g, '').trim();
const rankNorm = rankNames.map(norm);

// 3. Precise matching: exact > rankName is substring of productName (len>=10) > productName is substring of rankName (len>=10)
function matchRank(productName) {
  const pn = norm(productName);
  if (!pn) return null;
  // exact
  let idx = rankNorm.indexOf(pn);
  if (idx >= 0) return { rank: idx + 1, matchType: 'exact', rankName: rankNames[idx] };
  // rankName is substring of product name (short rank name like "adidas Ultra BOOST 20 CONSORTIUM")
  for (let i = 0; i < rankNorm.length; i++) {
    const rn = rankNorm[i];
    if (rn.length >= 12 && pn.includes(rn)) return { rank: i + 1, matchType: 'rank-in-product', rankName: rankNames[i] };
  }
  // productName is substring of rankName
  if (pn.length >= 12) {
    for (let i = 0; i < rankNorm.length; i++) {
      if (rankNorm[i].includes(pn)) return { rank: i + 1, matchType: 'product-in-rank', rankName: rankNames[i] };
    }
  }
  return null;
}

const matched = pkgod.map(p => ({ p, m: matchRank(p.name) })).filter(x => x.m);
const unmatchedPkgod = pkgod.filter(p => !matchRank(p.name));
console.log(`Pkgod-residual matched to ranking: ${matched.length} | unmatched: ${unmatchedPkgod.length}`);

// 4. Check SEO status of matched products
const seoBad = matched.filter(x => !x.p.seoTitle && !x.p.seoKeyword && !x.p.seoDesc);
console.log(`Matched with empty SEO (all 3 fields): ${seoBad.length}`);

// 5. Build full Excel dataset: ALL pkgod-residual products with P0 flag
const rows = pkgod.map(p => {
  const m = matchRank(p.name);
  return {
    productId: p.id,
    productName: p.name,
    isShow: p.isShow ? '是' : '否',
    urlValue: p.urlValue,
    url: p.url,
    oldUrlValue: p.oldUrlValue,
    seoTitle: p.seoTitle,
    seoKeyword: p.seoKeyword,
    seoDesc: p.seoDesc,
    p0: m ? 'P0' : '',
    rank: m ? m.rank : '',
    rankName: m ? m.rankName : '',
    matchType: m ? m.matchType : ''
  };
}).sort((a, b) => (b.p0 === 'P0') - (a.p0 === 'P0') || (a.rank || 99999) - (b.rank || 99999));

await fs.writeFile('data/runs/v45-batch-2026-09-23/minimal-run/pkgod-final.json', JSON.stringify({ total: rows.length, rows }, null, 2));
console.log(`Saved ${rows.length} rows. P0 count: ${rows.filter(r => r.p0).length}`);
console.log('\nP0 list (ranked):');
for (const r of rows.filter(r => r.p0)) console.log(`  #${r.rank} [${r.productId}] ${r.productName} | ${r.urlValue}`);
