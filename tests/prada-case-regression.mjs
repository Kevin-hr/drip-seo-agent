import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const fixturePath = path.join(here, "fixtures", "prada", "preflight-summary.json");
const casePath = path.join(repo, "docs", "case-studies", "PRADA_78_PREFLIGHT_CASE.md");
const learningsPath = path.join(repo, "docs", "case-studies", "PRADA_BATCH_LEARNINGS.md");

const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const caseStudy = fs.readFileSync(casePath, "utf8");
const learnings = fs.readFileSync(learningsPath, "utf8");

assert.equal(fixture.source_products, 78);
assert.equal(fixture.source_images, 856);
assert.equal(
  fixture.category_partition.americas_cup + fixture.category_partition.prada_other,
  fixture.source_products,
  "category partition must cover every source product"
);
assert.equal(
  fixture.frozen_manifest_reconciliation.existing + fixture.frozen_manifest_reconciliation.create,
  fixture.source_products,
  "frozen reconciliation must cover every source product"
);
assert.equal(
  fixture.later_public_reconciliation.visible_source_products +
    fixture.later_public_reconciliation.absent_source_products,
  fixture.source_products,
  "public reconciliation must cover every source product"
);
assert.equal(fixture.live_batch_completion, "NOT_PROVEN");
assert.deepEqual(fixture.allowed_sku_verdicts, ["VERIFIED_SKU", "SKU_OMIT", "HOLD"]);

for (const required of [
  "verified preflight case",
  "not a claim that all 78 products were",
  "What is not proven",
  "VERIFIED_SKU",
  "SKU_OMIT",
  "HOLD"
]) {
  assert.ok(caseStudy.toLowerCase().includes(required.toLowerCase()), `case study must include: ${required}`);
}

for (const forbidden of [/cookie/i, /token\s*[:=]\s*[^\s]/i, /password/i]) {
  assert.equal(forbidden.test(JSON.stringify(fixture)), false, `fixture contains forbidden secret pattern: ${forbidden}`);
}

assert.ok(learnings.includes("Historical SEO/PDP 3.0 output is evidence only"));
assert.ok(learnings.includes("Internal catalogue codes never become public SKU values"));

console.log("PASS Prada case regression: evidence boundaries, counts and V4.4 learnings are intact.");
