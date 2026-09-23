import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultInput = path.resolve(here, '../reports/evidence/v45-canary-536027542763285/canary-input.json');
const defaultOutput = path.resolve(here, '../reports/evidence/v45-canary-536027542763285/typesafe-decision.json');
const inputPath = process.argv[2] || defaultInput;
const outputPath = process.argv[3] || defaultOutput;
const apiKey = process.env.TYPESAFE_API_KEY;

if (!apiKey) throw new Error('TYPESAFE_API_KEY is required');

const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const questions = {
  exact_entity: {
    type: 'noul',
    instructions:
      'Probability that the backend record and its observed product images are the exact candidate entity, not merely a similar Kobe 6 colorway. Treat a visual match only as non-disqualifying; require independent name, colorway, and identifier evidence.'
  },
  sku_same_entity: {
    type: 'noul',
    instructions:
      'Probability that SKU IQ9317-001 belongs to this exact Nike Kobe 6 Protro Kay Yow Think Pink 2026 entity. Reject evidence for the visually different 2021 DJ3596-600 product.'
  },
  image_conflict: {
    type: 'noul',
    instructions:
      'Probability that the observed backend image fingerprint materially conflicts with the verified 2026 IQ9317-001 entity. Pink upper, black Swoosh, and black heel are expected; a white Swoosh and silver heel indicate the 2021 DJ3596-600 entity.'
  },
  disposition: {
    type: 'choice',
    instructions: 'Choose the V4.5 entity-gate disposition before any SEO generation or publication.',
    criteria: {
      PASS: 'Independent evidence supports the exact entity and SKU, and the image fingerprint does not conflict.',
      VERIFY: 'The candidate is plausible but evidence is incomplete or confidence is below the publication threshold.',
      HOLD: 'There is an entity, SKU, image, or source conflict; publication must be blocked.'
    }
  }
};

const response = await fetch('https://api.typesafe.ai/v1/systemone', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ state: JSON.stringify(input), model: 'jev-latest', questions })
});

if (!response.ok) {
  throw new Error(`TypeSafe ${response.status}: ${(await response.text()).slice(0, 400)}`);
}

const raw = await response.json();
const answers = raw.answers || {};
const exactEntity = Number(answers.exact_entity?.noul);
const skuSameEntity = Number(answers.sku_same_entity?.noul);
const imageConflict = Number(answers.image_conflict?.noul);
const disposition = answers.disposition?.choice;
const dispositionConfidence = Number(answers.disposition?.confidence);
const thresholds = {
  exact_entity_min: 0.9,
  sku_same_entity_min: 0.9,
  image_conflict_max: 0.1,
  disposition_confidence_min: 0.7
};
const thresholdPass =
  disposition === 'PASS' &&
  dispositionConfidence >= thresholds.disposition_confidence_min &&
  exactEntity >= thresholds.exact_entity_min &&
  skuSameEntity >= thresholds.sku_same_entity_min &&
  imageConflict <= thresholds.image_conflict_max;

const output = {
  evaluated_at: new Date().toISOString(),
  product_id: input.product_id,
  model: raw.model || 'jev-latest',
  thresholds,
  normalized: {
    exact_entity: exactEntity,
    sku_same_entity: skuSameEntity,
    image_conflict: imageConflict,
    disposition,
    disposition_confidence: dispositionConfidence,
    threshold_pass: thresholdPass,
    final_gate: thresholdPass ? 'PASS' : 'HOLD'
  },
  raw
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(output.normalized));
if (!thresholdPass) process.exitCode = 2;
