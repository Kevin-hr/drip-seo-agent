/**
 * SEO PDP Intelligence Core v1 - engine.
 *
 * Stages 01..05 as importable, dependency-free functions so that a brand pack
 * can plug into the Core instead of copying it.
 *
 * Authority: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
 * sha256    965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
 *
 * Design invariants
 * - PASS is evaluated by code. No stage accepts a verdict supplied as prose.
 * - A pack may NARROW the Core's permissions. A pack may never WIDEN them.
 * - Stages 02 and 03 are always evaluated so one HOLD report lists every gap,
 *   but their outputs are never used by stage 05 unless the whole chain passes.
 * - Nothing is generated unless the whole chain passes.
 */

export const STANDARD_VERSION = "4.4";
export const STANDARD_HASH =
  "965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7";
export const STORE_ORIGIN = "https://www.dripsneakers.org";

/** The Core's permission set. A pack may only take values away from this list. */
export const CORE_ACCEPTED_SKU_TYPES = Object.freeze([
  "official_brand_code",
  "authorized_retailer_code",
  "stockx_code",
  "goat_code",
]);

export const FORBIDDEN_PLACEHOLDERS = [
  /^unknown$/i, /^n\/?a$/i, /^pending$/i, /^not\s+verified$/i, /^unverified$/i,
  /^none$/i, /^null$/i, /^undefined$/i, /^tbd$/i, /^todo$/i, /^-+$/,
];

export const FORBIDDEN_STRUCTURES = [
  /^536\d{12}$/, /^\d{12,}$/, /^https?:\/\//, /[/?#&=:%]/,
  /\.(?:jpe?g|png|webp|gif|avif)$/i, /^(?:gen|code|id|ref)[-_]?\d+$/i,
];

const IDENTITY_KEY_FIELDS = ["brand", "model", "product_type", "colorway"];

export function forbiddenShapeReason(value) {
  if (typeof value !== "string" || value.length === 0) return "SKU-STRUCT-REJECTED";
  if (FORBIDDEN_PLACEHOLDERS.some((re) => re.test(value))) return "SKU-STRUCT-REJECTED";
  if (FORBIDDEN_STRUCTURES.some((re) => re.test(value))) return "SKU-STRUCT-REJECTED";
  return null;
}

/* ------------------------------------------------------------ pack boundary */

/**
 * A pack may narrow the Core's accepted SKU source types and may declare extra
 * rejected values. Anything that attempts to widen a Core permission is a
 * violation and stops the run: brand knowledge must never relax the system.
 */
export function applyPackConstraints(pack) {
  const accepted = new Set(CORE_ACCEPTED_SKU_TYPES);
  const violations = [];
  const extraRejected = new Set();

  if (!pack) return { accepted, extraRejected, violations };

  const declared = pack?.sku?.accepted_source_types;
  if (Array.isArray(declared)) {
    for (const type of declared) {
      if (!accepted.has(type)) violations.push(`PACK-WIDENS-SKU-TYPE:${type}`);
    }
    for (const type of [...accepted]) {
      if (!declared.includes(type)) accepted.delete(type);
    }
  }
  for (const value of pack?.sku?.always_rejected_values ?? []) extraRejected.add(value);

  return { accepted, extraRejected, violations };
}

/* ------------------------------------------------------------------ stage 01 */

export function stageProductIdentity(identity) {
  const codes = [];
  const push = (code) => { if (!codes.includes(code)) codes.push(code); };

  if (!identity) {
    push("ID-FIELD-MISSING");
    return { codes, identity_status: "HOLD" };
  }
  if (identity.field_missing === true) push("ID-FIELD-MISSING");
  for (const field of IDENTITY_KEY_FIELDS) {
    if (!identity[field]) push("ID-FIELD-MISSING");
  }
  if (identity.official_name_matched !== true) push("ID-NAME-UNMATCHED");
  if (identity.collection_unverifiable === true) push("ID-COLLECTION-UNKNOWN");
  if (identity.colorway_has_tier14 !== true) push("ID-COLORWAY-UNVERIFIED");
  if (identity.multiple_candidates === true) push("ID-MULTI-CANDIDATE");

  return { codes, identity_status: codes.length === 0 ? "PASS" : "HOLD" };
}

/* ------------------------------------------------------------------ stage 02 */

export function stageSkuVerification(candidates, policy, constraints) {
  const acceptedTypes = constraints?.accepted ?? new Set(CORE_ACCEPTED_SKU_TYPES);
  const extraRejected = constraints?.extraRejected ?? new Set();
  const list = Array.isArray(candidates) ? candidates : [];
  const rejections = [];
  const accepted = [];

  for (const candidate of list) {
    const value = candidate?.value;
    if (value !== undefined && extraRejected.has(value)) {
      rejections.push({ value, reason: "SKU-PACK-REJECTED" });
      continue;
    }
    if (!acceptedTypes.has(candidate?.sku_type)) {
      rejections.push({ value: value ?? "", reason: "SKU-TYPE-REJECTED" });
      continue;
    }
    const shape = forbiddenShapeReason(value);
    if (shape) {
      rejections.push({ value: value ?? "", reason: "SKU-STRUCT-REJECTED" });
      continue;
    }
    const attached = (candidate.evidence ?? []).some(
      (e) => Number(e?.tier) <= 4 && e?.exact_entity_match === true && e?.sku === value,
    );
    if (attached) accepted.push(candidate);
    else rejections.push({ value: value ?? "", reason: "SKU-UNATTACHED" });
  }

  // A code that identifies two entities identifies neither.
  const byValue = new Map();
  for (const candidate of accepted) {
    const key = candidate.value;
    if (!byValue.has(key)) byValue.set(key, new Set());
    byValue.get(key).add(candidate.entity_ref ?? "<unnamed>");
  }
  for (const [value, entities] of byValue) {
    if (entities.size > 1) {
      return {
        sku_verdict: "HOLD",
        sku: null,
        reason_code: "SKU-CONFLICT",
        conflicts: ["SKU-CONFLICT"],
        rejections,
        conflicted_values: [value],
      };
    }
  }

  if (accepted.length > 0) {
    return {
      sku_verdict: "VERIFIED_SKU",
      sku: accepted[0].value,
      reason_code: "SKU-OK",
      conflicts: [],
      rejections,
    };
  }

  if (policy === "strict_require_verified") {
    return {
      sku_verdict: "HOLD",
      sku: null,
      reason_code: "SKU-POLICY-STRICT",
      conflicts: ["SKU-POLICY-STRICT"],
      rejections,
    };
  }

  return {
    sku_verdict: "SKU_OMIT",
    sku: null,
    reason_code: `SKU-ABSENT-${rejections.length}`,
    conflicts: [],
    rejections,
  };
}

/* ------------------------------------------------------------------ stage 03 */

export function evaluateEvidencePass(record) {
  const codes = [];
  if (!record?.official_source) codes.push("EVD-EMPTY");
  if (record?.confidence === "low") codes.push("EVD-LOW-CONFIDENCE");
  if ((record?.gaps ?? []).length > 0) codes.push("EVD-GAPS-PRESENT");
  if (record?.rejected_recorded_as_missing === true) codes.push("EVD-REJECTED-AS-MISSING");
  return { evidence_status: codes.length === 0 ? "PASS" : "HOLD", codes };
}

export function buildEvidenceRecord(identity, sku, evidence, pack) {
  return {
    product: composeProductName(identity, pack),
    product_id: identity?.product_id ?? "",
    official_source: evidence?.official_source ?? "",
    source_tier: Number(evidence?.source_tier ?? 0),
    sku: sku?.sku ?? null,
    sku_verdict: sku?.sku_verdict ?? "HOLD",
    evidence: evidence?.claim ?? "",
    confidence: evidence?.confidence ?? "low",
    status: "PASS",
    standard_version: STANDARD_VERSION,
    standard_hash: STANDARD_HASH,
    observed_at: evidence?.observed_at ?? "",
    verified_by: evidence?.verified_by ?? "conformance-runner",
    verification_chain: evidence?.verification_chain ?? {
      save_readback: "NOT_RUN",
      publish_readback: "NOT_RUN",
      storefront: "NOT_RUN",
    },
    gaps: [...(evidence?.gaps ?? [])],
    pack_id: pack?.pack_id ?? null,
  };
}

/* ------------------------------------------------------------------ stage 04 */

export function stageHoldDecision({ identity, sku, evidence, reconciliation, verification }) {
  const hold_codes = [...identity.codes, ...evidence.codes];

  if (sku.sku_verdict === "HOLD") hold_codes.push(...(sku.conflicts ?? []));
  if (reconciliation?.duplicate_same_slug === true) hold_codes.push("DUP-SAME-SLUG");

  const verificationChain = verification ?? {};
  const failed = Object.entries(verificationChain).filter(([, v]) => v === "FAIL");

  if (failed.length > 0) {
    const code = failed.some(([k]) => k === "storefront")
      ? "WR-STOREFRONT-FAILED"
      : "WR-STANDALONE-VERIFY-FAILED";
    return {
      final_status: "ROLLBACK",
      hold_codes: [...hold_codes, code],
      action_permission: "FORBID_UPDATE",
    };
  }

  const incomplete = ["save_readback", "publish_readback", "storefront"].filter(
    (k) => verificationChain[k] === undefined || verificationChain[k] === "NOT_RUN",
  );
  if (incomplete.length > 0 && hold_codes.length === 0) {
    return {
      final_status: "HOLD",
      hold_codes: ["WR-VERIFICATION-NOT-RUN"],
      action_permission: "FORBID_UPDATE",
    };
  }

  if (hold_codes.length > 0) {
    return { final_status: "HOLD", hold_codes, action_permission: "FORBID_UPDATE" };
  }

  return { final_status: "PASS", hold_codes: [], action_permission: "ALLOW_SEO_UPDATE" };
}

/* ------------------------------------------------------------------ stage 05 */

export function slugify(value) {
  return String(value)
    .toLowerCase()
    // Apostrophes are dropped, not converted to hyphens: the live site uses
    // "Prada-Americas-Cup-...", never "prada-america-s-cup-...".
    .replace(/['\u2019\u02bc`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Pack-aware product name composition.
 * Priority: an explicit official name always wins; then a pack naming series
 * template; then a plain brand + model + colorway join.
 */
export function composeProductName(identity, pack) {
  if (!identity) return "";
  if (identity.official_product_name) return identity.official_product_name;

  const series = (pack?.naming?.series ?? []).find(
    (s) => s.collection && s.collection === identity.collection,
  );
  if (series?.template) {
    return series.template
      .replace(/\{brand\}/g, identity.brand ?? "")
      .replace(/\{descriptor\}/g, identity.descriptor ?? "")
      .replace(/\{model\}/g, identity.model ?? "")
      .replace(/\{colorway\}/g, identity.colorway ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return [identity.brand, identity.model, identity.colorway].filter(Boolean).join(" ").trim();
}

export function stagePdpGeneration(identity, sku, pack) {
  const productName = composeProductName(identity, pack);
  const skuValue = sku.sku;

  const seoTitle = skuValue
    ? `${productName} ${skuValue} Reps | Drip Sneakers`
    : `${productName} Reps | Drip Sneakers`;

  const metaDescription = skuValue
    ? `Shop ${productName} reps (${skuValue}) at Drip Sneakers with QC photos, 30-day returns and 7\u201320 day shipping.`
    : `Shop ${productName} reps at Drip Sneakers with QC photos, 30-day returns and 7\u201320 day shipping.`;

  const slug = skuValue
    ? `${slugify(productName)}-${slugify(skuValue)}`
    : slugify(productName);

  const fifth = skuValue
    ? { label: "SKU", value: skuValue }
    : { label: "Signature Detail", value: identity.fifth_field_fact ?? "" };

  const keyDescriptionHtml =
    `<section class="ds-pdp-key-description" data-standard="4.4">` +
    `<p>${htmlEscape(identity.decision_sentence ?? "")}</p>` +
    `<h2>Product Details</h2><ul>` +
    `<li><strong>Brand:</strong> <a href="${htmlEscape(identity.brand_internal_url ?? "")}"><strong>${htmlEscape(identity.brand)}</strong></a></li>` +
    `<li><strong>Product Type:</strong> ${htmlEscape(identity.product_type)}</li>` +
    `<li><strong>Model:</strong> ${htmlEscape(identity.model)}</li>` +
    `<li><strong>Colorway:</strong> ${htmlEscape(identity.colorway)}</li>` +
    `<li><strong>${htmlEscape(fifth.label)}:</strong> ${htmlEscape(fifth.value)}</li>` +
    `</ul></section>`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    brand: { "@type": "Brand", name: identity.brand },
    category: identity.product_type,
    color: identity.colorway,
  };
  if (skuValue) schema.sku = skuValue;

  return {
    product_name: productName,
    h1: productName,
    seo_title: seoTitle,
    seo_keywords: [],
    meta_description: metaDescription,
    url_slug: slug,
    canonical_url: `${STORE_ORIGIN}/${slug}`,
    key_description_html: keyDescriptionHtml,
    description_html: "",
    image_alt: [],
    schema,
  };
}

/* -------------------------------------------------------------- url policy */

/**
 * Core 05 section 7 (GEN-07 / GEN-08): an already-correct live URL must be kept.
 * A migration is only allowed when a documented trigger exists, and it must be
 * a single 301 hop to one final URL.
 *
 * Deliberate asymmetry, learned from the Prada evidence:
 *   STRUCTURAL BREAKAGE (empty path, leading/trailing hyphen, malformed) -> MIGRATE
 *   CONVENTION DRIFT    (existing slug is not lower-case)               -> WARN only
 * The live Prada page is /Prada-Americas-Cup-... and was correctly KEPT, so
 * case style must never be treated as a migration trigger for an existing URL.
 * Core check URL-01 downgrades a non-conforming existing slug to WARN for the
 * same reason.
 */
export function evaluateUrlPolicy(currentUrl, triggers = []) {
  const firedTriggers = [];
  const warnings = [];

  if (!currentUrl) {
    return { action: "NEW", reason: "URL-NOT-YET-EXISTS", triggers: [], warnings: [] };
  }

  let pathname = "";
  try {
    pathname = new URL(currentUrl).pathname;
  } catch {
    return { action: "MIGRATE", reason: "URL-MIGRATION-TRIGGER:MALFORMED-URL", triggers: ["MALFORMED-URL"], warnings: [] };
  }

  const segments = pathname.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) firedTriggers.push("EMPTY-PATH");
  for (const segment of segments) {
    if (segment.startsWith("-") || segment.endsWith("-")) firedTriggers.push("LEADING-OR-TRAILING-HYPHEN");
    if (segment !== segment.toLowerCase()) warnings.push("URL-01-EXISTING-SLUG-NOT-LOWERCASE");
  }
  for (const trigger of triggers) firedTriggers.push(trigger);

  const uniqueTriggers = [...new Set(firedTriggers)];
  const uniqueWarnings = [...new Set(warnings)];

  if (uniqueTriggers.length === 0) {
    return { action: "KEEP", reason: "URL-ALREADY-CORRECT", triggers: [], warnings: uniqueWarnings };
  }
  return {
    action: "MIGRATE",
    reason: `URL-MIGRATION-TRIGGER:${uniqueTriggers[0]}`,
    triggers: uniqueTriggers,
    warnings: uniqueWarnings,
  };
}

/* -------------------------------------------------------------------- pipeline */

export function runCore(input, policy = "v44_standard", pack = null) {
  const constraints = applyPackConstraints(pack);

  if (constraints.violations.length > 0) {
    return {
      final_status: "HOLD",
      sku_verdict: "HOLD",
      sku_rejections: [],
      hold_codes: ["PACK-WIDENS-PERMISSION", ...constraints.violations],
      action_permission: "FORBID_UPDATE",
      outputs: null,
    };
  }

  const identity = stageProductIdentity(input.identity);
  const sku = stageSkuVerification(input.sku_candidates, policy, constraints);
  const evidence = evaluateEvidencePass(input.evidence);
  const hold = stageHoldDecision({
    identity,
    sku,
    evidence,
    reconciliation: input.reconciliation,
    verification: input.verification,
  });

  const result = {
    final_status: hold.final_status,
    sku_verdict: sku.sku_verdict,
    sku_rejections: sku.rejections,
    hold_codes: hold.hold_codes,
    action_permission: hold.action_permission,
    outputs: null,
  };

  if (hold.final_status === "PASS") {
    result.evidence_record = buildEvidenceRecord(input.identity, sku, input.evidence, pack);
    result.outputs = stagePdpGeneration(input.identity, sku, pack);
  }
  return result;
}
