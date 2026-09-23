import { execSync } from 'node:child_process';
const BATCH = 15;
const TOTAL = Number(process.env.BULK_TOTAL || 300);
let offset = 0;
let totalPublished = 0;
while (offset < TOTAL) {
  console.log(`\n=== BATCH offset=${offset} ===`);
  try {
    execSync(`node tests/v45-bulk-nosku.mjs`, {
      env: { ...process.env, BULK_BATCH: String(BATCH), BULK_OFFSET: String(offset) },
      stdio: 'inherit'
    });
    const outDir = `data/runs/v45-batch-2026-09-23/bulk-nosku-${String(offset).padStart(4,'0')}-exec`;
    execSync(`node tests/execute-v45-batch.mjs ${outDir}/plans.json ${outDir}/decisions.json ${outDir} --commit`, {
      stdio: 'inherit'
    });
    totalPublished += BATCH;
  } catch (e) {
    console.log(`Batch at offset ${offset} had failures, continuing...`);
  }
  offset += BATCH;
}
console.log(`\nDone. Processed up to offset ${offset}`);
