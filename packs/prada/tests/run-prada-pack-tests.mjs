#!/usr/bin/env node
/**
 * Prada pack conformance runner.
 *
 * Proves three things a pack must prove:
 *   1  it plugs into the Core (same engine, pack supplied as a parameter)
 *   2  it only narrows Core permissions
 *   3  its own brand knowledge changes outcomes in the documented direction
 *
 * Run:  node packs/prada/tests/run-prada-pack-tests.mjs
 * Exit: 0 = pass, 1 = mismatch or structural violation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCore, applyPackConstraints, evaluateUrlPolicy, STANDARD_HASH } from "../../../seo-core/engine.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");

let failures = 0;
let checks = 0;

function check(label, ok, detail) {
  checks += 1;
  if (ok) { console.log(`  PASS  ${label}  ${detail ?? ""}`); return; }
  failures += 1;
  console.log(`  FAIL  ${label}  ${detail ?? ""}`);
}

function sameArray(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

const packPath = path.join(repoRoot, "packs", "prada", "pack.json");
const casesPath = path.join(here, "prada-cases.json");
const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const suite = JSON.parse(fs.readFileSync(casesPath, "utf8"));

console.log("=== Prada pack conformance suite ===");
console.log(`pack     = ${pack.pack_id} v${pack.pack_version}`);
console.log(`suite    = ${suite.suite_id} v${suite.version}`);
console.log(`engine   = seo-core/engine.mjs`);
console.log("");

/* --------------------------------------------------- structural: pack completeness */

console.log("--- pack structure");
const REQUIRED_PACK_FIELDS = [
  "pack_id", "pack_version", "brand", "core_required", "standard",
  "evidence_status", "ready_for_production", "ready_blockers",
  "naming", "sku", "categories", "failure_taxonomy",
  "verified_success", "blocked", "provenance",
];
for (const field of REQUIRED_PACK_FIELDS) {
  check(`pack field ${field}`, pack[field] !== undefined && pack[field] !== null, "");
}
check("pack standard-hash matches engine", pack.standard.sha256 === STANDARD_HASH, pack.standard.sha256);
check("pack declares ready_for_production=false honestly", pack.ready_for_production === false, "not production ready");
check("pack lists ready_blockers", Array.isArray(pack.ready_blockers) && pack.ready_blockers.length > 0, `${pack.ready_blockers.length} blockers`);
check("pack has a verified_success with a claim_boundary", Boolean(pack.verified_success?.claim_boundary), "claim boundary present");
check("pack records blocked facts", Array.isArray(pack.blocked) && pack.blocked.length > 0, `${pack.blocked.length} blocked facts`);

/* --------------------------------------------------------------- pack boundary */

console.log("");
console.log("--- pack boundary (a pack may narrow, never widen)");
for (const boundaryCase of suite.pack_boundary_cases) {
  console.log(`--- ${boundaryCase.id}  ${boundaryCase.title}`);

  if (boundaryCase.pack_file) {
    const target = JSON.parse(fs.readFileSync(path.join(repoRoot, boundaryCase.pack_file), "utf8"));
    const constraints = applyPackConstraints(target);
    check(`${boundaryCase.id} no-violations`, sameArray(constraints.violations, boundaryCase.expect_violations), `violations=${JSON.stringify(constraints.violations)}`);
    check(`${boundaryCase.id} accepted-types-narrowed`, sameArray([...constraints.accepted], boundaryCase.expect_accepted_types), `accepted=${JSON.stringify([...constraints.accepted].sort())}`);
  }

  if (boundaryCase.pack_under_test) {
    const sourceCase = suite.pipeline_cases.find((c) => c.id === boundaryCase.use_pipeline_case);
    const result = runCore(sourceCase.input, sourceCase.sku_policy ?? "v44_standard", boundaryCase.pack_under_test);
    check(`${boundaryCase.id} final_status`, result.final_status === boundaryCase.expect.final_status, `expected=${boundaryCase.expect.final_status} actual=${result.final_status}`);
    check(`${boundaryCase.id} sku_verdict`, result.sku_verdict === boundaryCase.expect.sku_verdict, `expected=${boundaryCase.expect.sku_verdict} actual=${result.sku_verdict}`);
    check(`${boundaryCase.id} hold_codes`, sameArray(result.hold_codes, boundaryCase.expect.hold_codes), `expected=${JSON.stringify(boundaryCase.expect.hold_codes)} actual=${JSON.stringify(result.hold_codes)}`);
    check(`${boundaryCase.id} action_permission`, result.action_permission === boundaryCase.expect.action_permission, `expected=${boundaryCase.expect.action_permission} actual=${result.action_permission}`);
    check(`${boundaryCase.id} no-generation`, result.outputs === null, "outputs must be null");
  }
}

/* ------------------------------------------------------------- pipeline with pack */

console.log("");
console.log("--- pipeline cases (core engine + Prada pack)");
for (const testCase of suite.pipeline_cases) {
  console.log(`--- ${testCase.id}  ${testCase.title}`);
  const result = runCore(testCase.input, testCase.sku_policy ?? "v44_standard", pack);
  const expected = testCase.expect;

  check(`${testCase.id} final_status`, result.final_status === expected.final_status, `expected=${expected.final_status} actual=${result.final_status}`);
  check(`${testCase.id} sku_verdict`, result.sku_verdict === expected.sku_verdict, `expected=${expected.sku_verdict} actual=${result.sku_verdict}`);
  check(`${testCase.id} hold_codes`, sameArray(result.hold_codes, expected.hold_codes), `expected=${JSON.stringify(expected.hold_codes)} actual=${JSON.stringify(result.hold_codes)}`);
  check(`${testCase.id} action_permission`, result.action_permission === expected.action_permission, `expected=${expected.action_permission} actual=${result.action_permission}`);

  if (expected.sku_rejections) {
    const got = result.sku_rejections.map((r) => `${r.value}:${r.reason}`);
    const want = expected.sku_rejections.map((r) => `${r.value}:${r.reason}`);
    check(`${testCase.id} sku_rejections`, sameArray(got, want), `expected=${JSON.stringify(want)} actual=${JSON.stringify(got)}`);
  }

  if (testCase.expect_product_name) {
    check(`${testCase.id} pack-template-composed-name`, result.outputs?.product_name === testCase.expect_product_name, `expected="${testCase.expect_product_name}" actual="${result.outputs?.product_name}"`);
  }

  if (expected.final_status !== "PASS") {
    check(`${testCase.id} no-generation-on-non-pass`, result.outputs === null, "outputs must be null");
  }
}

/* ------------------------------------------------------------------- url policy */

console.log("");
console.log("--- url policy cases");
for (const urlCase of suite.url_policy_cases) {
  console.log(`--- ${urlCase.id}  ${urlCase.current_url || "<empty>"}`);
  const result = evaluateUrlPolicy(urlCase.current_url, urlCase.triggers);
  check(`${urlCase.id} action`, result.action === urlCase.expect.action, `expected=${urlCase.expect.action} actual=${result.action}`);
  check(`${urlCase.id} reason`, result.reason === urlCase.expect.reason, `expected=${urlCase.expect.reason} actual=${result.reason}`);
  if (urlCase.expect.warnings) {
    check(`${urlCase.id} warnings`, sameArray(result.warnings, urlCase.expect.warnings), `expected=${JSON.stringify(urlCase.expect.warnings)} actual=${JSON.stringify(result.warnings)}`);
  }
}

console.log("");
console.log("=== SUMMARY ===");
console.log(`checks = ${checks}   failures = ${failures}`);
if (failures > 0) {
  console.log("PRADA PACK CONFORMANCE FAIL");
  process.exit(1);
}
console.log("PRADA PACK CONFORMANCE PASS - pack plugs into the Core, narrows only, and cannot widen it.");
