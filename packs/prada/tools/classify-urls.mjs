#!/usr/bin/env node
/**
 * Prada legacy URL classifier.
 *
 * Governance tool, not a test. It reads the frozen Prada run evidence and runs
 * every existing-product URL through the Core's own URL policy
 * (seo-core/engine.mjs -> evaluateUrlPolicy), so that Phase 3 of the Prada
 * production-readiness work is derived from the engine rather than from
 * someone's opinion.
 *
 * Usage:
 *   node packs/prada/tools/classify-urls.mjs [--workspace <path>] [--json <out.json>]
 *
 * Default workspace is the Drip Sneakers workspace that holds the untracked
 * evidence. This script is READ-ONLY: it never writes to the workspace and it
 * never touches the backend.
 */

import fs from "node:fs";
import path from "node:path";
import { evaluateUrlPolicy } from "../../../seo-core/engine.mjs";

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const workspace = arg("workspace", "C:\\Users\\Administrator\\Documents\\01_Projects\\dripsneakers");
const jsonOut = arg("json", null);
const runDir = path.join(workspace, "audit", "2026-09-02T14-30-31+08-00-prada-78");
const identityPath = path.join(runDir, "identity-audit.json");

if (!fs.existsSync(identityPath)) {
  console.error(`EVIDENCE_MISSING: ${identityPath}`);
  console.error("Cannot classify URLs without the frozen identity audit. Stop.");
  process.exit(2);
}

const identity = JSON.parse(fs.readFileSync(identityPath, "utf8"));
const products = identity.existing_source_products ?? [];

const rows = [];
for (const product of products) {
  const url = product.current_public_url ?? "";
  const decision = evaluateUrlPolicy(url, []);
  rows.push({
    product_id: product.product_id,
    source_key: product.source_key,
    manifest_status: product.current_status,
    manifest_public_url: url,
    target_title: product.target_title,
    url_action: decision.action,
    url_reason: decision.reason,
    url_warnings: decision.warnings,
  });
}

const tally = rows.reduce((acc, r) => { acc[r.url_action] = (acc[r.url_action] ?? 0) + 1; return acc; }, {});

console.log("=== Prada legacy URL classification (derived from the Core engine) ===");
console.log(`evidence : ${identityPath}`);
console.log(`products : ${rows.length}`);
console.log("");
for (const r of [...rows].sort((a, b) => a.url_action.localeCompare(b.url_action))) {
  console.log(`${r.url_action.padEnd(8)} ${r.product_id}  ${String(r.manifest_status).padEnd(28)} ${r.manifest_public_url}`);
  if (r.url_warnings.length > 0) console.log(`${" ".repeat(8)} warnings: ${r.url_warnings.join(", ")}`);
}
console.log("");
console.log("tally:", JSON.stringify(tally));

if (jsonOut) {
  fs.writeFileSync(jsonOut, JSON.stringify({ generated_from: identityPath, tally, rows }, null, 2), "utf8");
  console.log(`written: ${jsonOut}`);
}
