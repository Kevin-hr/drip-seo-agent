import fs from 'node:fs';
const p = 'data/runs/v45-batch-2026-09-23/nosku-batch-043-plans.json';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('\u201dPS5\u201d', '\u201dPS5\u2033');
fs.writeFileSync(p, s, 'utf8');
console.log('fixed');
