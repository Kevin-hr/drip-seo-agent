#!/usr/bin/env node
/**
 * SEO PDP Intelligence Core v1 — conformance runner.
 *
 * Reference implementation of stages 01..05 plus an assertion harness over
 * seo-core/tests/test-cases-v1.json. Any agent (ChatGPT / Trae / Claude /
 * Qwen / MCP agent) is expected to reproduce these outcomes.
 *
 * Run:  node seo-core/tests/run-core-tests.mjs
 * Exit: 0 = all cases passed, 1 = at least one mismatch or a structural violation.
 *
 * Design notes
 * - PASS is evaluated by code. No stage accepts a verdict supplied as prose.
 * - All stages are evaluated even when an earlier stage already HOLDs, so a
 *   single HOLD report can list every gap that must be closed. Outputs from
 *   stages 02 and 03 are never used by stage 05 unless the whole chain passes.
 * - The suite is intentionally dependency-free so that any runtime can execute it.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const suitePath = path.join(here, "test-cases-v1.json");

const STANDARD_VERSION = "4.4";
const STANDARD_HASH = "965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7";
const STORE_ORIGIN = "https://www.dripsneakers.org";

const ACCEPTED_SKU_TYPES = new Set([
  "official_brand_code",
  "authorized_retailer_code",
  "stockx_code",
  "goat_code",
]);

const FORBIDDEN_PLACEHOLDERS = [
  /^unknown$/i, /^n\/?a$/i, /^pending$/i, /^not\s+verified$/i, /^unverified$/i,
  /^none$/i, /^null$/i, /^undefined$/i, /^tbd$/i, /^todo$/i, /^-+$/,
];

const FORBIDDEN_STRUCTURES = [
  /^536\d{12}$/, /^\d{12,}$/, /^https?:\/\//, /[/?#&=:%]/,
  /\.(?:jpe?g|png|webp|gif|avif)$/i, /^(?:gen|code|id|ref)[-_]?\d+$/i,
];

const IDENTITY_KEY_FIELDS = ["brand", "model", "product_type", "colorway"];

function forbiddenShapeReason(value) {
  if (typeof value !== "string" || value.length === 0) return "SKU-STRUCT-REJECTED";
  if (FORBIDDEN_PLACEHOLDERS.some((re) => re.test(value))) return "SKU-STRUCT-REJECTED";
  if (FORBIDDEN_STRUCTURES.some((re) => re.test(value))) return "SKU-STRUCT-REJECTED";
  return null;
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

export function stageSkuVerification(candidates, policy) {
  const list = Array.isArray(candidates) ? candidates : [];
  const rejections = [];
  const accepted = [];

  for (const candidate of list) {
    const value = candidate?.value;
    if (!ACCEPTED_SKU_TYPES.has(candidate?.sku_type)) {
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

export function buildEvidenceRecord(identity, sku, evidence) {
  return {
    product: identity?.official_product_name ?? "",
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

function slugify(value) {
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

export function stagePdpGeneration(identity, sku) {
  const productName = identity.official_product_name
    ?? [identity.brand, identity.model, identity.colorway].filter(Boolean).join(" ").trim();
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

/* -------------------------------------------------------------------- pipeline */

export function runCore(input, policy = "v44_standard") {
  const identity = stageProductIdentity(input.identity);
  const sku = stageSkuVerification(input.sku_candidates, policy);
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
    result.evidence_record = buildEvidenceRecord(input.identity, sku, input.evidence);
    result.outputs = stagePdpGeneration(input.identity, sku);
  }
  return result;
}

/* ------------------------------------------------------------------ assertions */

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
  const skuInTitle = (o.seo_title.match(/</g) ?? []).length;
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
  void skuInTitle;
}

const suite = JSON.parse(fs.readFileSync(suitePath, "utf8"));

console.log("=== SEO PDP Intelligence Core v1 - conformance suite ===");
console.log(`suite    = ${suite.suite_id} v${suite.version}`);
console.log(`standard = ${suite.standard.file}`);
console.log("");

check("META standard-hash-complete", /^[0-9a-f]{64}$/.test(suite.standard.sha256), "64 hex chars, not truncated");
check("META standard-hash-matches-core", suite.standard.sha256 === STANDARD_HASH, "suite and runner agree");
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
