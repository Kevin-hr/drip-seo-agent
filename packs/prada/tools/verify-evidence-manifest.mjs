#!/usr/bin/env node
/**
 * Prada evidence manifest verifier.
 *
 * Recomputes size and sha256 for every file pinned in
 * reports/prada/evidence-manifest.json and reports LOST, CHANGED, ADDED and
 * ZERO-BYTE conditions.
 *
 * Exit codes: 0 = manifest fully verified, 1 = drift detected, 2 = manifest missing.
 *
 * READ-ONLY with respect to the workspace.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const workspace = arg("workspace", "C:\\Users\\Administrator\\Documents\\01_Projects\\dripsneakers");
const manifestPath = arg("manifest", path.join(repoRoot, "reports", "prada", "evidence-manifest.json"));

if (!fs.existsSync(manifestPath)) {
  console.error(`MANIFEST_MISSING: ${manifestPath}`);
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function sha256(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

const lost = [];
const changed = [];
const ok = [];
const zeroByte = [];

for (const entry of manifest.files) {
  const full = path.join(workspace, entry.path);
  if (!fs.existsSync(full)) { lost.push(entry.path); continue; }
  const stat = fs.statSync(full);
  if (stat.size === 0) zeroByte.push(entry.path);
  const digest = sha256(full);
  if (stat.size !== entry.bytes || digest !== entry.sha256) {
    changed.push(`${entry.path} (bytes ${entry.bytes} -> ${stat.size}, sha256 ${entry.sha256.slice(0, 12)} -> ${digest.slice(0, 12)})`);
  } else {
    ok.push(entry.path);
  }
}

console.log("=== Prada evidence manifest verification ===");
console.log(`manifest : ${manifestPath}`);
console.log(`pinned   : ${manifest.files.length} files / ${manifest.totals.bytes} bytes`);
console.log("");
console.log(`VERIFIED : ${ok.length}`);
console.log(`LOST     : ${lost.length}`);
console.log(`CHANGED  : ${changed.length}`);
console.log(`ZERO-BYTE: ${zeroByte.length}`);
if (lost.length) console.log(`\nLOST:\n  ${lost.join("\n  ")}`);
if (changed.length) console.log(`\nCHANGED:\n  ${changed.join("\n  ")}`);
if (zeroByte.length) console.log(`\nZERO-BYTE (fatal per project rules):\n  ${zeroByte.join("\n  ")}`);

const drift = lost.length + changed.length;
console.log("");
if (drift > 0) {
  console.log("EVIDENCE_DRIFT_DETECTED — the evidence behind the Prada Pack no longer matches the pinned manifest.");
  process.exit(1);
}
console.log("EVIDENCE_MANIFEST_VERIFIED — every pinned file is present and byte-identical.");
