import fs from 'node:fs/promises';

const [inputPath, outputPath] = process.argv.slice(2);
const apiKey = process.env.TYPESAFE_API_KEY;
if (!inputPath || !outputPath) throw new Error('Usage: node tests/typesafe-v45-batch.mjs input.json output.json');
if (!apiKey) throw new Error('TYPESAFE_API_KEY is required');

const inputs = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const thresholds = { exact_entity_min: 0.9, sku_same_entity_min: 0.9, image_conflict_max: 0.1, disposition_confidence_min: 0.7 };

const evaluate = async (input) => {
  const questions = {
    exact_entity: {
      type: 'noul',
      instructions: 'Probability that backend name, observed gallery fingerprint, SKU, colorway, silhouette and independent cited sources all identify one exact product entity.'
    },
    sku_same_entity: {
      type: 'noul',
      instructions: `Probability that ${input.sku} belongs to the exact backend entity, not a neighboring colorway or release.`
    },
    image_conflict: {
      type: 'noul',
      instructions: 'Probability that the described backend gallery fingerprint conflicts with the independently sourced colorway and silhouette.'
    },
    disposition: {
      type: 'choice',
      instructions: 'Choose the fail-closed V4.5 disposition before SEO generation or publication.',
      criteria: {
        PASS: 'Independent evidence supports exact entity and SKU and the image fingerprint does not conflict.',
        VERIFY: 'Plausible but evidence is incomplete or confidence is below threshold.',
        HOLD: 'Entity, SKU, image, or source conflict blocks publication.'
      }
    }
  };
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: JSON.stringify(input), model: 'jev-latest', questions })
  });
  if (!response.ok) throw new Error(`TypeSafe ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const raw = await response.json();
  const a = raw.answers || {};
  const normalized = {
    exact_entity: Number(a.exact_entity?.noul),
    sku_same_entity: Number(a.sku_same_entity?.noul),
    image_conflict: Number(a.image_conflict?.noul),
    disposition: a.disposition?.choice,
    disposition_confidence: Number(a.disposition?.confidence)
  };
  normalized.threshold_pass = normalized.disposition === 'PASS' &&
    normalized.disposition_confidence >= thresholds.disposition_confidence_min &&
    normalized.exact_entity >= thresholds.exact_entity_min &&
    normalized.sku_same_entity >= thresholds.sku_same_entity_min &&
    normalized.image_conflict <= thresholds.image_conflict_max;
  normalized.final_gate = normalized.threshold_pass ? 'PASS' : (normalized.disposition === 'HOLD' ? 'HOLD' : 'VERIFY');
  return { evaluated_at: new Date().toISOString(), product_id: input.product_id, model: raw.model || 'jev-latest', thresholds, normalized, raw };
};

const results = await Promise.all(inputs.map(evaluate));
await fs.writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.map((x) => ({ product_id: x.product_id, ...x.normalized }))));
if (results.some((x) => !x.normalized.threshold_pass)) process.exitCode = 2;
