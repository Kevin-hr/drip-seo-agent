import fs from 'node:fs/promises';

const [inputPath, outputPath] = process.argv.slice(2);
const apiKey = process.env.TYPESAFE_API_KEY;
if (!inputPath || !outputPath) throw new Error('Usage: node tests/typesafe-v45-nosku.mjs input.json output.json');
if (!apiKey) throw new Error('TYPESAFE_API_KEY is required');

const inputs = JSON.parse(await fs.readFile(inputPath, 'utf8'));
// SKU_OMIT thresholds: name-based verification instead of SKU matching
const thresholds = { exact_entity_min: 0.80, name_entity_min: 0.85, image_conflict_max: 0.18, disposition_confidence_min: 0.75 };

const evaluate = async (input) => {
  const questions = {
    exact_entity: {
      type: 'noul',
      instructions: 'Probability that backend name, observed gallery fingerprint, product category and independent cited sources all identify one exact real product entity.'
    },
    name_entity: {
      type: 'noul',
      instructions: `Probability that the backend name "${input.backend_name}" accurately describes a real, identifiable product from a known brand, not a generic placeholder or ambiguous listing.`
    },
    image_conflict: {
      type: 'noul',
      instructions: 'Probability that the backend gallery fingerprint conflicts with the independently sourced product description, brand, and category.'
    },
    disposition: {
      type: 'choice',
      instructions: 'Choose the fail-closed V4.5 disposition for a no-SKU (SKU_OMIT) apparel/accessory product before SEO generation or publication.',
      criteria: {
        PASS: 'Independent evidence supports the product identity, name is specific (not generic placeholder), and images do not conflict.',
        VERIFY: 'Plausible but evidence is incomplete or name is ambiguous.',
        HOLD: 'Name is generic/placeholder ("send pictures"), product identity is unverifiable, or images conflict.'
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
    name_entity: Number(a.name_entity?.noul),
    image_conflict: Number(a.image_conflict?.noul),
    disposition: a.disposition?.choice,
    disposition_confidence: Number(a.disposition?.confidence)
  };
  normalized.threshold_pass = normalized.disposition === 'PASS' &&
    normalized.disposition_confidence >= thresholds.disposition_confidence_min &&
    normalized.exact_entity >= thresholds.exact_entity_min &&
    normalized.name_entity >= thresholds.name_entity_min &&
    normalized.image_conflict <= thresholds.image_conflict_max;
  normalized.final_gate = normalized.threshold_pass ? 'PASS' : (normalized.disposition === 'HOLD' ? 'HOLD' : 'VERIFY');
  return { evaluated_at: new Date().toISOString(), product_id: input.product_id, model: raw.model || 'jev-latest', thresholds, normalized, raw };
};

const results = await Promise.all(inputs.map(evaluate));
await fs.writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.map((x) => ({ product_id: x.product_id, ...x.normalized }))));
if (results.some((x) => !x.normalized.threshold_pass)) process.exitCode = 2;
