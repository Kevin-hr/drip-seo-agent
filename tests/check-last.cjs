const fs = require('fs');
const r = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/bulk-nosku-1790196495326-exec/execution-results.json','utf8'));
const f = r.filter(x=>!x.success).pop();
console.log(JSON.stringify(f, null, 2).slice(0, 2500));
