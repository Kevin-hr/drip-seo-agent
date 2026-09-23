import fs from 'node:fs/promises';
import path from 'node:path';

const runDir = path.resolve('data/runs/v45-batch-2026-09-23');
const details = JSON.parse(await fs.readFile(path.join(runDir, 'batch-detail-read.json'), 'utf8'));
const imgDir = path.join(runDir, 'batch-images');
await fs.mkdir(imgDir, { recursive: true });

for (const d of details) {
  if (!d.firstImage) continue;
  try {
    const res = await fetch(d.firstImage);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(path.join(imgDir, `${d.id}.jpg`), buf);
    console.log(`downloaded ${d.id} (${buf.length} bytes)`);
  } catch (e) {
    console.log(`FAIL ${d.id}: ${e.message}`);
  }
}
console.log('Done');
