import fs from 'node:fs/promises';
const plans = JSON.parse(await fs.readFile('data/runs/v45-batch-2026-09-23/nike-batch-005-plans.json', 'utf8'));

// Exact trimmed live names from backend query
const exactBaselines = {
  '536027416607254': 'Nike Kobe 8 Protro Lakers Home  HF9550-100',
  '536027415545881': 'Nike Kobe 8 Protro Lakers Away HF9550-001',
  '536027415611934': 'Nike Kobe 8 Protro College Navy HF9550-400',
  '536027422376722': 'Nike SB Dunk Low April Skateboards FD2562-400',
  '536027423276571': 'Nike Kobe 5 Protro Chaos CD4991-100',
  '536027423004436': 'Nike Kobe 5 Protro Year of the Mamba Eggplant IB4481-500',
  '536027416497938': 'Nike Zoom Kobe 6 Protro All-Star 2.0  FQ3546-100',
  '536027432841246': 'Nike Dunk Low Retro University Blue DV0833-113'
};

// Only the remaining 8 (first 6 already succeeded)
const remainingIds = Object.keys(exactBaselines);
const retryPlans = plans.filter(p => remainingIds.includes(p.product_id));
for (const p of retryPlans) {
  p.baseline_name_trimmed = exactBaselines[p.product_id];
}

await fs.writeFile('data/runs/v45-batch-2026-09-23/nike-batch-005-retry-plans.json', `${JSON.stringify(retryPlans, null, 2)}\n`);
console.log(`Wrote ${retryPlans.length} retry plans`);
