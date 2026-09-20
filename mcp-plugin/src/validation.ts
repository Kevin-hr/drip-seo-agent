import type { SkuResolution } from "./contracts.js";

/**
 * SKU gate — V4.4 STANDARD_FINAL §5.
 *
 * V4.4 allows exactly three verdicts:
 *   VERIFIED_SKU — a Tier 1-4 source attaches the same SKU to the exact entity.
 *   SKU_OMIT     — Exact Entity PASS, but no independently verifiable SKU. Publishing continues.
 *   HOLD         — identity-critical evidence conflict. No plan, no write.
 *
 * §5 explicitly forbids using these as a SKU:
 *   Drip product ID, supplier number, URL suffix, image filename,
 *   listing ID, size, generated code — plus the literal placeholders
 *   "Not verified" / "Unknown" / "Pending" / "N/A".
 */

/** Literal placeholders that are never a SKU. */
const forbiddenPlaceholders: RegExp[] = [
  /^unknown$/i,
  /^n\/?a$/i,
  /^pending$/i,
  /^not\s+verified$/i,
  /^unverified$/i,
  /^none$/i,
  /^null$/i,
  /^undefined$/i,
  /^tbd$/i,
  /^todo$/i,
  /^-+$/,
];

/** Structurally invalid values: internal IDs, listing/supplier numbers, URLs, filenames. */
const forbiddenStructures: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^536\d{12}$/, reason: "MrShopPlus internal Product ID" },
  { pattern: /^\d{12,}$/, reason: "bare long numeric identifier (supplier / listing ID shape)" },
  { pattern: /^https?:\/\//i, reason: "URL" },
  { pattern: /[/?#&=:%]/, reason: "URL suffix or path fragment" },
  { pattern: /\.(?:jpe?g|png|webp|gif|avif)$/i, reason: "image filename" },
  { pattern: /^(?:gen|code|id|ref)[-_]?\d+$/i, reason: "generated code" },
];

/**
 * Deliberately NOT rejected: short pure-numeric values.
 *
 * Nike base style codes are frequently all digits (528895, 528895-153 — the
 * latter is a production-verified SKU for product 536027320168721). A bare
 * short number is structurally indistinguishable from a legitimate style code,
 * and V4.4 §5 already places the real burden on evidence: a SKU only counts
 * when a Tier 1-4 source attaches it to the same exact entity. Rejecting on
 * shape alone would reject real SKUs, so shape checks stop at the unambiguous
 * cases above.
 */

/** Returns the deterministic rejection reason, or null when the value is acceptable. */
export function skuRejectionReason(rawSku: string): string | null {
  const sku = rawSku.trim();

  if (sku.length === 0) return "empty SKU";
  if (forbiddenPlaceholders.some((pattern) => pattern.test(sku))) {
    return "placeholder value";
  }
  for (const { pattern, reason } of forbiddenStructures) {
    if (pattern.test(sku)) return reason;
  }
  return null;
}

export function validateSkuResolution(input: SkuResolution): string[] {
  const errors: string[] = [];
  const sku = input.sku?.trim() ?? null;

  if (input.verdict === "VERIFIED_SKU") {
    if (!sku) {
      errors.push("VERIFIED_SKU requires a non-empty sku.");
    } else {
      const reason = skuRejectionReason(sku);
      if (reason) {
        errors.push(`SKU looks like an internal/placeholder identifier and is not allowed (${reason}).`);
      }

      const strong = input.evidence.filter(
        (e) =>
          e.tier <= 4 &&
          e.exact_entity_match === true &&
          (e.sku?.trim() ?? null) === sku,
      );
      if (strong.length === 0) {
        errors.push(
          "VERIFIED_SKU requires at least one Tier 1-4 source that explicitly attaches the same SKU to the exact entity.",
        );
      }
    }
  }

  if (input.verdict === "SKU_OMIT" && input.sku !== null) {
    errors.push("SKU_OMIT requires sku=null.");
  }

  if (input.verdict === "HOLD" && input.conflicts.length === 0) {
    errors.push("HOLD requires at least one identity-critical conflict/reason.");
  }

  if (input.verdict !== "HOLD" && input.conflicts.length > 0) {
    errors.push("A non-HOLD resolution cannot carry unresolved identity-critical conflicts.");
  }

  return errors;
}
