import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Canonical SEO-PDP standard loader.
 *
 * Sole authority: Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
 *
 * SEO/PDP 3.2 and the superseded V4.4 STANDARD_FINAL are historical execution
 * records only. They must never be loaded, referenced, or used as a decision
 * layer by this plugin. The superseded copies are parked in `_superseded/`
 * precisely so they cannot be picked up accidentally.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");

export const CANONICAL_STANDARD_FILE =
  "Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md";

export const CANONICAL_STANDARD_PATH = path.join(
  packageRoot,
  "rules",
  CANONICAL_STANDARD_FILE,
);

/** Files that must never be active. Presence alone is not an error; loading is. */
export const FORBIDDEN_STANDARD_PATTERNS: RegExp[] = [
  /SEO-PDP[-_ ]?3\.2/i,
  /SEO-PDP_V4\.4_STANDARD(?!_CLEAN_CONSOLIDATED)/i,
  /V4\.4_STANDARD_FINAL/i,
];

export interface StandardInfo {
  /** "4.4" as declared in the canonical document */
  standard_version: string;
  /** "FINAL — CONSOLIDATED 2026-09-17" */
  standard_status: string;
  /** lower-case hex sha256 of the canonical document bytes */
  standard_hash: string;
  /** file name only, never an absolute path */
  standard_file: string;
}

function readCanonicalPath(): string {
  const override = process.env.STANDARD_PATH;
  if (!override) return CANONICAL_STANDARD_PATH;
  if (FORBIDDEN_STANDARD_PATTERNS.some((pattern) => pattern.test(override))) {
    throw new Error(
      `STANDARD_PATH points at a forbidden historical standard (${override}). ` +
        `Only ${CANONICAL_STANDARD_FILE} may be active.`,
    );
  }
  return path.resolve(override);
}

function parseField(document: string, key: string): string {
  const match = document.match(new RegExp(`^\\s*${key}:\\s*\`?([^\`\\n]+?)\`?\\s*$`, "m"));
  if (!match) throw new Error(`Canonical standard is missing the "${key}:" declaration.`);
  return match[1].trim();
}

function loadStandard(): StandardInfo {
  const standardPath = readCanonicalPath();

  if (!fs.existsSync(standardPath)) {
    throw new Error(`Canonical standard not found at ${standardPath}`);
  }

  const bytes = fs.readFileSync(standardPath);
  const standard_hash = createHash("sha256").update(bytes).digest("hex");
  const document = bytes.toString("utf8");

  const expected = process.env.STANDARD_EXPECTED_SHA256?.trim().toLowerCase();
  if (expected && expected !== standard_hash) {
    throw new Error(
      `Canonical standard hash mismatch. Expected ${expected} but computed ${standard_hash}. ` +
        `Refusing to start so that prepare/execute cannot run against an unknown standard.`,
    );
  }

  const standard_version = parseField(document, "Version");
  const standard_status = parseField(document, "Status");

  if (standard_version !== "4.4") {
    throw new Error(`Canonical standard declares version ${standard_version}; expected 4.4.`);
  }

  return {
    standard_version,
    standard_status,
    standard_hash,
    standard_file: path.basename(standardPath),
  };
}

let cached: StandardInfo | null = null;

/** Loaded once at startup. Throws rather than degrading silently. */
export function getStandardInfo(): StandardInfo {
  if (!cached) cached = loadStandard();
  return cached;
}

/** Every tool response carries the standard identity that produced it. */
export function standardEnvelope(): { standard_version: string; standard_status: string; standard_hash: string; standard_file: string } {
  const info = getStandardInfo();
  return {
    standard_version: info.standard_version,
    standard_status: info.standard_status,
    standard_hash: info.standard_hash,
    standard_file: info.standard_file,
  };
}
