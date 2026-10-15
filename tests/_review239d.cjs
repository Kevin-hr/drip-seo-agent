const fs = require('fs');
// 1. plain text of the content to see what sections are inside
const html = fs.readFileSync('./_dump_536027239001368_content.html', 'utf8');
const text = html
  .replace(/<img[^>]*>/g, '[IMG]')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();
console.log('=== Content plain text (' + text.length + ' chars) ===');
console.log(text);
console.log('\n=== img count ===', (html.match(/<img/g) || []).length);

// 2. what the Pkgod 残留 excel sheet demanded (mirror json)
const x = JSON.parse(fs.readFileSync('./data/runs/v45-batch-2026-09-23/minimal-run/pkgod-excel-data.json', 'utf8'));
console.log('\n=== pkgod-excel-data keys ===', Object.keys(x).join(','));
for (const k of Object.keys(x)) {
  if (Array.isArray(x[k])) console.log(k, 'len=', x[k].length, 'sample:', JSON.stringify(x[k].find(r => String(r.id) === '536027239001368') || x[k][0]).slice(0, 400));
}
