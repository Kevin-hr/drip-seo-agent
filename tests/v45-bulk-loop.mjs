import { execSync } from 'node:child_process';
const BATCH = 15;
const TOTAL = Number(process.env.BULK_TOTAL || 300);
let batches = 0;
let emptyStreak = 0;
while (batches < TOTAL) {
  console.log(`\n=== BATCH #${batches} (offset=0) ===`);
  let planned = 0;
  try {
    const out = execSync(`node tests/v45-bulk-nosku.mjs`, {
      env: { ...process.env, BULK_BATCH: String(BATCH), BULK_OFFSET: '0' },
      stdio: ['ignore', 'pipe', 'inherit' ]
    }).toString();
    const m = out.match(/Generated (\d+) plans/);
    planned = m ? Number(m[1]) : 0;
    console.log(out);
  } catch (e) {
    console.log(`Plan build at batch ${batches} had failures, continuing...`);
  }
  if (planned === 0) {
    emptyStreak++;
    console.log(`No plans generated (empty streak ${emptyStreak}/3).`);
    if (emptyStreak >= 3) { console.log('\nNo more products to process. Done.'); break; }
    batches++;
    continue;
  }
  emptyStreak = 0;
  const outDir = `data/runs/v45-batch-2026-09-23/bulk-nosku-0000-exec`;
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
