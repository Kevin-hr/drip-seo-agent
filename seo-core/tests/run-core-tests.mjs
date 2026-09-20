#!/usr/bin/env node
/**
 * SEO PDP Intelligence Core v1 - conformance runner.
 *
 * Runs seo-core/tests/test-cases-v1.json against the engine in seo-core/engine.mjs.
 * Any agent (ChatGPT / Trae / Claude / Qwen / MCP agent) is expected to
 * reproduce these outcomes before touching products.
 *
 * Run:  node seo-core/tests/run-core-tests.mjs
 * Exit: 0 = all cases passed, 1 = at least one mismatch or a structural violation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCore, STANDARD_HASH, STORE_ORIGIN } from "../engine.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const suitePath = path.join(here, "test-cases-v1.json");

let failures = 0;
let checks = 0;

function check(label, ok, detail) {
  checks += 1;
  if (ok) { console.log(`  PASS  ${label}  ${detail ?? ""}`); return; }
  failures += 1;
  console.log(`  FAIL  ${label}  ${detail ?? ""}`);
}

function sameArray(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
}

function assertExpectation(caseId, tag, expected, actual) {
  check(`${caseId}${tag} final_status`, actual.final_status === expected.final_status, `expected=${expected.final_status} actual=${actual.final_status}`);
  check(`${caseId}${tag} sku_verdict`, actual.sku_verdict === expected.sku_verdict, `expected=${expected.sku_verdict} actual=${actual.sku_verdict}`);
  check(`${caseId}${tag} hold_codes`, sameArray(actual.hold_codes, expected.hold_codes), `expected=${JSON.stringify(expected.hold_codes)} actual=${JSON.stringify(actual.hold_codes)}`);
  check(`${caseId}${tag} action_permission`, actual.action_permission === expected.action_permission, `expected=${expected.action_permission} actual=${actual.action_permission}`);

  if (expected.sku_rejections) {
    const got = actual.sku_rejections.map((r) => `${r.value}:${r.reason}`).sort();
    const want = expected.sku_rejections.map((r) => `${r.value}:${r.reason}`).sort();
    check(`${caseId}${tag} sku_rejections`, sameArray(got, want), `expected=${JSON.stringify(want)} actual=${JSON.stringify(got)}`);
  }

  // Invariant: nothing may be generated unless the whole chain passed.
  if (expected.final_status !== "PASS") {
    check(`${caseId}${tag} no-generation-on-non-pass`, actual.outputs === null, "outputs must be null");
  }
}

function assertGeneratorContract(caseId, result, expectSku) {
  const o = result.outputs;
  if (!o) { check(`${caseId} generator-output-present`, false, "outputs missing"); return; }
  check(`${caseId} gen h1-equals-product-name`, o.h1 === o.product_name, "");
  check(`${caseId} gen exactly-one-h2-product-details`, (o.key_description_html.match(/<h2>Product Details<\/h2>/g) ?? []).length === 1, "");
  check(`${caseId} gen exactly-five-li`, (o.key_description_html.match(/<li>/g) ?? []).length === 5, "");
  check(`${caseId} gen data-standard-4.4`, o.key_description_html.includes('data-standard="4.4"'), "");
  check(`${caseId} gen canonical`, o.canonical_url === `${STORE_ORIGIN}/${o.url_slug}`, o.canonical_url);
  if (expectSku) {
    check(`${caseId} gen sku-in-schema`, o.schema.sku !== undefined, JSON.stringify(o.schema.sku ?? null));
    check(`${caseId} gen sku-in-title`, o.seo_title.includes(expectSku), "");
    check(`${caseId} gen meta-has-sku`, o.meta_description.includes(`(${expectSku})`), "");
  } else {
    check(`${caseId} gen no-sku-key-in-schema`, o.schema.sku === undefined, "sku key must be omitted entirely");
    check(`${caseId} gen no-sku-in-title`, !o.seo_title.includes("  "), "");
    check(`${caseId} gen meta-no-sku-parens`, !o.meta_description.includes("("), "");
  }
  check(`${caseId} gen no-forbidden-meta-phrase`, !/(real QC photos|7\u201320 day delivery|authentic quality|1:1 guaranteed|best quality)/i.test(o.meta_description), "");
}

const suite = JSON.parse(fs.readFileSync(suitePath, "utf8"));

console.log("=== SEO PDP Intelligence Core v1 - conformance suite ===");
console.log(`suite    = ${suite.suite_id} v${suite.version}`);
console.log(`standard = ${suite.standard.file}`);
console.log(`engine   = seo-core/engine.mjs`);
console.log("");

check("META standard-hash-complete", /^[0-9a-f]{64}$/.test(suite.standard.sha256), "64 hex chars, not truncated");
check("META standard-hash-matches-core", suite.standard.sha256 === STANDARD_HASH, "suite and engine agree");
check("META case-count", suite.cases.length === 10, `cases=${suite.cases.length}`);

for (const testCase of suite.cases) {
  console.log("");
  console.log(`--- ${testCase.id}  ${testCase.title}`);
  const result = runCore(testCase.input, testCase.sku_policy ?? "v44_standard");
  assertExpectation(testCase.id, "", testCase.expect, result);

  if (testCase.expect_strict) {
    const strictResult = runCore(testCase.input, "strict_require_verified");
    assertExpectation(testCase.id, "/strict", testCase.expect_strict, strictResult);
  }

  if (testCase.expect.final_status === "PASS") {
    const expectSku = testCase.expect.sku_verdict === "VERIFIED_SKU" ? result.outputs?.schema?.sku : null;
    assertGeneratorContract(testCase.id, result, expectSku ?? null);
  }
}

console.log("");
console.log("=== SUMMARY ===");
console.log(`checks = ${checks}   failures = ${failures}`);
if (failures > 0) {
  console.log("CORE CONFORMANCE FAIL");
  process.exit(1);
}
console.log("CORE CONFORMANCE PASS - all 10 cases behave as specified.");
