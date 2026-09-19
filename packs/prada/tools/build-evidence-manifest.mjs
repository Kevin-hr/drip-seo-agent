#!/usr/bin/env node
/**
 * Prada evidence manifest builder.
 *
 * The Prada evidence lives only in the workspace and is not tracked by any git
 * repository (see reports/prada/evidence-availability-report.md). Copying it
 * into the repository is a separate decision that requires explicit
 * authorization, so this tool does the next best thing: it pins every evidence
 * file by size and sha256 so that loss or silent modification becomes
 * detectable.
 *
 * READ-ONLY with respect to the workspace. It never writes there.
 *
 * Usage:
 *   node packs/prada/tools/build-evidence-manifest.mjs [--workspace <path>] [--out <file>]
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
const out = arg("out", path.join(repoRoot, "reports", "prada", "evidence-manifest.json"));

const RUN_ID = "2026-09-02T14-30-31+08-00-prada-78";
const EMPTY_RUN_ID = "2026-09-02T14-30-09+08-00-prada-78";

const roots = [
  `audit/${RUN_ID}`,
  `audit/${EMPTY_RUN_ID}`,
  "shipping-audit/raw_products.json",
  "scripts/build-prada-78-manifest.cjs",
  "scripts/validate-prada-seo-pdp-3.cjs",
  "scripts/inventory-prada.ps1",
  "scripts/audit-public-prada.ps1",
  "scripts/compare-public-prada-images.cjs",
  "scripts/prada-visual-dedupe.cjs",
  "check-prada.js",
];

function sha256(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function walk(target, acc) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    acc.push({ path: target, bytes: stat.size });
    return acc;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    walk(path.join(target, entry.name), acc);
  }
  return acc;
}

const entries = [];
const missing = [];
for (const rel of roots) {
  const full = path.join(workspace, rel);
  if (!fs.existsSync(full)) { missing.push(rel); continue; }
  for (const file of walk(full, [])) {
    entries.push({
      path: path.relative(workspace, file.path).replace(/\\/g, "/"),
      bytes: file.bytes,
      sha256: sha256(file.path),
    });
  }
}

entries.sort((a, b) => a.path.localeCompare(b.path));

const zeroByte = entries.filter((e) => e.bytes === 0).map((e) => e.path);
const totalBytes = entries.reduce((sum, e) => sum + e.bytes, 0);

const manifest = {
  schema: "evidence-manifest-v1",
  pack: "prada",
  generated: new Date().toISOString(),
  purpose: "Pin the untracked Prada evidence by size and sha256 so loss or modification is detectable.",
  tracked_by_git: false,
  workspace_root_name: path.basename(workspace),
  verification: "node packs/prada/tools/verify-evidence-manifest.mjs",
  scope: {
    run_id: RUN_ID,
    empty_run_id: EMPTY_RUN_ID,
    note: "The 2026-09-02T14-30-09 run directory contains an empty evidence/ folder only and must not be cited as a run.",
  },
  totals: {
    files: entries.length,
    bytes: totalBytes,
    zero_byte_files: zeroByte.length,
  },
  zero_byte_files: zeroByte,
  missing_roots: missing,
  files: entries,
};

fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`manifest written: ${out}`);
console.log(`  files          : ${manifest.totals.files}`);
console.log(`  bytes          : ${manifest.totals.bytes}`);
console.log(`  zero-byte      : ${manifest.totals.zero_byte_files} ${JSON.stringify(zeroByte)}`);
console.log(`  missing roots  : ${missing.length ? JSON.stringify(missing) : "none"}`);
