import { execSync } from 'node:child_process';
const TOTAL = Number(process.env.BULK_TOTAL || 300);
const SCAN = Number(process.env.BULK_SCAN || 200); // how many targets to scan per batch
let batches = 0;
let emptyStreak = 0;
while (batches < TOTAL) {
  console.log(`\n=== BATCH #${batches} (scan=${SCAN}) ===`);
  let planned = 0, outDir = '';
  try {
    const out = execSync(`node tests/v45-bulk-nosku.mjs`, {
      env: { ...process.env, BULK_BATCH: String(SCAN), BULK_OFFSET: '0' },
      stdio: ['ignore', 'pipe', 'inherit']
    }).toString();
    const m = out.match(/Generated (\d+) plans in (.+)/);
    planned = m ? Number(m[1]) : 0;
    outDir = m ? m[2].trim() : '';
    console.log(out);
  } catch (e) {
    console.log(`Plan build at batch ${batches} had failures, continuing...`);
  }
  if (planned === 0 || !outDir) {
    emptyStreak++;
    console.log(`No plans generated (empty streak ${emptyStreak}/3).`);
    if (emptyStreak >= 3) { console.log('\nNo more products to process. Done.'); break; }
    batches++;
    continue;
  }
  emptyStreak = 0;
  try {
    execSync(`node tests/execute-v45-batch.mjs ${outDir}/plans.json ${outDir}/decisions.json ${outDir} --commit`, {
      stdio: 'inherit'
    });
  } catch (e) {
    console.log(`Execution at batch ${batches} had failures, continuing...`);
  }
  batches++;
}
console.log(`\nDone. Ran ${batches} batches.`);
