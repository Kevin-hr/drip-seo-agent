import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const evidence = JSON.parse(fs.readFileSync(path.join(root, "reports", "evidence", "t-shirts-v3", "verified-baseline.json"), "utf8"));
const lessons = fs.readFileSync(path.join(root, "docs", "operations", "T_SHIRTS_V3_LESSONS_TO_V4.4.md"), "utf8");
const ids = evidence.products.map((product) => product.product_id);

assert.equal(evidence.counts.distinct_products, 11);
assert.equal(evidence.counts.pdp_3_1_1, 9);
assert.equal(evidence.counts.pdp_3_2, 2);
assert.equal(evidence.counts.v4_4_verified, 0);
assert.equal(evidence.products.length, 11);
assert.equal(new Set(ids).size, 11);
assert.ok(evidence.products.every((product) =>
  product.stage === "FrontendVerified" &&
  product.release_status === "Verified" &&
  product.validation_is_valid === true &&
  product.sku_verified === true
));
assert.match(lessons, /does \*\*not\*\* claim that the 30-product objective was completed/i);
assert.match(lessons, /11 historical V3 terminal successes, 0 independently re-accepted under V4\.4/i);
assert.match(lessons, /single-item\/set gate/i);
assert.match(lessons, /Description image-only PASS/i);

console.log("T-SHIRTS V3 LESSONS CHECK PASS — 11 distinct historical successes; V4.4 carry-forward is fail-closed.");

