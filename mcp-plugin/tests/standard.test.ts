import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_STANDARD_FILE,
  CANONICAL_STANDARD_PATH,
  FORBIDDEN_STANDARD_PATTERNS,
  getStandardInfo,
  standardEnvelope,
} from "../src/standard.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

/**
 * Regression pin. The canonical standard is a controlled artifact: if this test
 * fails, the reference document changed and every plan created earlier must be
 * treated as produced by a different standard.
 */
const PINNED_SHA256 =
  "965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7";

test("canonical standard is the V4.4 STANDARD_FINAL revision", () => {
  assert.equal(CANONICAL_STANDARD_FILE, "Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md");
  assert.ok(fs.existsSync(CANONICAL_STANDARD_PATH), "canonical standard file must exist");
});

test("SHA-256 of the canonical standard matches the pinned value", () => {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(CANONICAL_STANDARD_PATH)).digest("hex");
  assert.equal(actual, PINNED_SHA256);
});

test("standard identity is loaded and reported", () => {
  const info = getStandardInfo();
  assert.equal(info.standard_version, "4.4");
  assert.equal(info.standard_status, "FINAL");
  assert.equal(info.standard_hash, PINNED_SHA256);
  assert.equal(info.standard_file, CANONICAL_STANDARD_FILE);
});

test("every tool result envelope carries standard_version and standard_hash", () => {
  const envelope = standardEnvelope();
  assert.equal(envelope.standard_version, "4.4");
  assert.equal(envelope.standard_hash, PINNED_SHA256);
  assert.ok(envelope.standard_file.length > 0);
});

test("historical 3.2 and superseded V4.4 revisions are recognised as forbidden", () => {
  const forbidden = [
    "standards/SEO-PDP-3.2.json",
    "SEO-PDP_3.2.md",
    "Drip_Sneakers_SEO-PDP_V4.4_STANDARD.md",
    "Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md",
  ];
  for (const candidate of forbidden) {
    assert.ok(
      FORBIDDEN_STANDARD_PATTERNS.some((pattern) => pattern.test(candidate)),
      `expected ${candidate} to be recognised as a forbidden historical standard`,
    );
  }
  assert.equal(
    FORBIDDEN_STANDARD_PATTERNS.some((pattern) => pattern.test(CANONICAL_STANDARD_FILE)),
    false,
    "the canonical standard must not match any forbidden pattern",
  );
});

test("bundled copies of the canonical standard are byte-identical", () => {
  const copies = [
    path.join(root, "rules", CANONICAL_STANDARD_FILE),
    path.join(root, "skills", "drip-seo-executor", "references", CANONICAL_STANDARD_FILE),
  ];
  const hashes = copies.map((file) =>
    crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
  );
  assert.deepEqual(hashes, [PINNED_SHA256, PINNED_SHA256]);
});

test("superseded copies are parked outside the active reference directory", () => {
  const activeRules = fs
    .readdirSync(path.join(root, "rules"), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  const activeRefs = fs
    .readdirSync(path.join(root, "skills", "drip-seo-executor", "references"), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  for (const name of [...activeRules, ...activeRefs]) {
    assert.equal(
      FORBIDDEN_STANDARD_PATTERNS.some((pattern) => pattern.test(name)),
      false,
      `${name} must not be active`,
    );
  }
  assert.ok(
    fs.existsSync(path.join(root, "rules", "_superseded", "Drip_Sneakers_SEO-PDP_V4.4_STANDARD.md")),
    "a superseded V4.4 revision must be retained under _superseded/",
  );
});
