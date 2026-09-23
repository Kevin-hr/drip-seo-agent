import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const runDir = 'data/runs/v45-batch-2026-09-23';
const failedFile = path.join(runDir, 'failed.json');
const loadFailed = () => { try { return new Set(JSON.parse(fs.readFileSync(failedFile, 'utf8'))); } catch { return new Set(); } };
const saveFailed = (s) => fs.writeFileSync(failedFile, JSON.stringify([...s], null, 2));

const TOTAL = Number(process.env.BULK_TOTAL || 300);
const SCAN = Number(process.env.BULK_SCAN || 200);
let batches = 0, emptyStreak = 0;
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
  // Collect failed products and add to failed.json so they're skipped next round
  try {
    const results = JSON.parse(fs.readFileSync(path.join(outDir, 'execution-results.json'), 'utf8'));
    const failed = loadFailed();
    let added = 0;
    for (const r of results) {
      if (!r.success && !failed.has(String(r.product_id))) { failed.add(String(r.product_id)); added++; }
    }
    if (added) { saveFailed(failed); console.log(`Added ${added} failed products to blocklist (total ${failed.size})`); }
  } catch {}
  batches++;
}
console.log(`\nDone. Ran ${batches} batches.`);
