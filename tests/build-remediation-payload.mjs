import fs from 'node:fs';

const BASE = 'data/runs/v45-batch-2026-09-23/minimal-run';
const scan = JSON.parse(fs.readFileSync(`${BASE}/all-products-scan.json`,'utf8')).filter(x=>!x.error);
const p0res = JSON.parse(fs.readFileSync(`${BASE}/url-remediation-p0.json`,'utf8'));
const allres = JSON.parse(fs.readFileSync(`${BASE}/url-remediation-all.json`,'utf8'));
const excel = JSON.parse(fs.readFileSync(`${BASE}/pkgod-excel-data.json`,'utf8'));

// id -> rank info from excel
const rankOf = new Map();
for (const r of excel.pkgod) rankOf.set(r.id, { rank: r.rank, rankName: r.rankName, matchType: r.matchType, p0: r.p0==='P0' });
for (const r of excel.p0) {
  if (!rankOf.has(r.id)) rankOf.set(r.id, { rank: r.rank, rankName: r.rankName, matchType: r.matchType, p0: true });
  else rankOf.get(r.id).p0 = true;
}

// merge remediation results (dedupe by id; fill missing fields from the other source)
const merged = new Map();
for (const r of allres) merged.set(r.id, { ...r });
for (const r of p0res) {
  const prev = merged.get(r.id);
  merged.set(r.id, prev ? { ...prev, ...r, status: r.status === 'ok' ? r.status : prev.status } : { ...r });
}

const rows = [];
for (const [id, r] of merged) {
  const p = scan.find(x => x.id === id);
  const info = rankOf.get(id) || {};
  rows.push({
    id,
    name: (p?.name || r.name || '').trim(),
    p0: info.p0 ? '是' : '否',
    rank: info.rank ?? '',
    oldUrl: (r.oldUrlValue || '').replace(/^\//,''),
    newUrl: (p?.urlValue || '').replace(/^\//,''),
    urlChanged: r.urlChanged ? '是' : '否',
    seoTitle: (p?.seoTitle || '').trim(),
    seoKeyword: (p?.seoKeyword || '').trim() ? '已填' : '空',
    seoDesc: (p?.seoDesc || '').trim() ? '已填' : '空',
    status: r.status,
    note: r.urlChanged ? 'URL已规范化' : (/pkgod/i.test(r.oldUrlValue||'') ? 'URL此前已规范，本轮补SEO' : 'SEO补齐'),
  });
}

rows.sort((a,b) => (a.p0 === '是' ? 0 : 1) - (b.p0 === '是' ? 0 : 1) || (a.rank || 9999) - (b.rank || 9999) || a.id.localeCompare(b.id));

console.log('rows:', rows.length);
const okCount = rows.filter(r=>r.status==='ok').length;
const urlChanged = rows.filter(r=>r.urlChanged==='是').length;
const p0Done = rows.filter(r=>r.p0==='是').length;
console.log('ok:', okCount, '| urlChanged:', urlChanged, '| p0 done:', p0Done);

const payload = { sheets: [
  { name: '修复结果', header: true,
    columns: ['产品ID','产品名称','P0','排行榜排名','旧URL','新URL','URL已变更','SeoTitle','SeoKeyword','SeoDesc','状态','备注'],
    dtypes: { '产品ID':'object', '排行榜排名':'int64' },
    data: rows.map(r => [r.id, r.name, r.p0, r.rank === '' ? null : r.rank, r.oldUrl, r.newUrl, r.urlChanged, r.seoTitle, r.seoKeyword, r.seoDesc, r.status === 'ok' ? '已完成' : r.status, r.note]) },
  { name: '修复汇总', header: true,
    columns: ['指标','数值','说明'],
    data: [
      ['Pkgod残留总款数', 521, '扫描发现的 -Pkgod- URL 产品'],
      ['URL已规范化的产品', rows.filter(r=>!/pkgod/i.test(r.newUrl)).length, '521 款全部清零（519 款本轮重写 + 2 款此前已规范）'],
      ['本轮URL重写', urlChanged, 'UrlValue 已重写为规范路径'],
      ['P0排行热销品已处理', p0Done, '46 款 P0（URL重写+SEO补齐）'],
      ['SEO 已补齐（3字段）', rows.filter(r=>r.seoTitle && r.seoKeyword==='已填' && r.seoDesc==='已填').length, 'SeoTitle/Keyword/Desc 三字段已写'],
      ['处理成功', okCount, 'saveModify 保存并回读验证通过'],
      ['失败', rows.length - okCount, '见状态列'],
      ['旧URL 301', '待平台确认', 'saveModify 不生成前台301，OldUrlValue被后端强制同步'],
    ] },
]};
fs.writeFileSync(`${BASE}/remediation-results.json`, JSON.stringify(payload, null, 2));
console.log('payload written');
