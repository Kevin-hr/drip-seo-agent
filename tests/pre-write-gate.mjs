// ---------------------------------------------------------------------------
// Phase 8.1 pre-write gate
//
// Produces the two artifacts a first live write must be signed off against:
//   1. the safe-write plan (URL, canonical and publish state untouched)
//   2. the rollback baseline with its completeness gates evaluated
//
// Nothing here mutates production. The bridge must be in --mode simulate.
//
//   node pre-write-gate.mjs
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BRIDGE_BASE_URL ?? "http://127.0.0.1:8811";
const TOKEN = process.env.LOCAL_AGENT_TOKEN ?? "test-token-local-bridge";
const REPO = path.resolve(import.meta.dirname, "..");
const SANDBOX = process.env.BRIDGE_SANDBOX
  ? path.resolve(process.env.BRIDGE_SANDBOX)
  : path.join(REPO, ".sandbox");
const OUT = path.join(REPO, "reports", "evidence", "pre-write-gate");
const EXPECTED_HASH =
  process.env.EXPECTED_STANDARD_SHA256 ??
  "5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8";

const PRODUCT = process.env.TEST_PRODUCT_ID ?? "536027551768089";
const standard = { standard_version: "4.4", standard_hash: EXPECTED_HASH };

const ENTITY = {
  brand: "Thom Browne",
  model: "4-Bar Stripe Jersey Stitch Tee",
  product_type: "T-Shirt",
  colorway: "Brown",
  collaboration_or_collection: null,
};

const FACTS = {
  consumer_product_name: "Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown",
  decision_sentence:
    "This Thom Browne knit tee comes in a deep brown colourway with the signature white 4-Bar stripe on the left sleeve.",
  brand_internal_url: "https://www.dripsneakers.org/Thom-Browne/",
  product_details_fifth: { label: "Graphic", value: "White 4-Bar Stripe On Left Sleeve" },
  keep_existing_slug: true,
};

const OMIT = {
  verdict: "SKU_OMIT",
  exact_entity: ENTITY,
  sku: null,
  evidence: [{
    tier: 8,
    source_name: "Drip product photography (visual identification)",
    url: "",
    exact_entity_match: true,
  }],
  conflicts: [],
  decision_note:
    "Exact entity visually identified; no Tier 1-4 source attaches a SKU, omit per V4.4 §5.",
};

async function post(route, body, timeoutMs = 240000) {
  const response = await fetch(`${BASE}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { status: response.status, json, text };
}

function save(name, payload) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  return path.relative(REPO, file);
}

const report = { generated_at: new Date().toISOString(), product_id: PRODUCT, steps: {} };

// ---------------------------------------------------------- step 1: snapshots
const local = await post("/api/chatgpt-mcp/products/read", { product_id: PRODUCT, ...standard });
report.steps.local_read = { status: local.status, run_id: local.json?.run_id, snapshot_hash: local.json?.snapshot_hash };
save("01-local-snapshot.json", local.json);

const live = await post("/api/chatgpt-mcp/products/read", { product_id: PRODUCT, live: true, ...standard });
report.steps.live_read = live.status === 200
  ? { status: 200, snapshot_hash: live.json?.snapshot_hash, captured_at: live.json?.snapshot?.captured_at, available: true }
  : { status: live.status, available: false, cause: live.json?.detail };
save("01-live-snapshot.json", live.json ?? { status: live.status, detail: live.json?.detail });

// The plan must be built on the freshest snapshot obtainable. If the live read is
// blocked, that is recorded and the build falls back to the local checkpoint.
const buildOnLive = live.status === 200;
const basisLabel = buildOnLive ? "live" : "local-checkpoint";

// ---------------------------------------------------------- step 2: the plan
const prepare = await post("/api/chatgpt-mcp/products/prepare-v44", {
  product_id: PRODUCT,
  operation: "auto",
  sku_resolution: OMIT,
  v44_facts: FACTS,
  live: buildOnLive,
  ...standard,
});
report.steps.prepare = {
  status: prepare.status,
  basis: basisLabel,
  plan_id: prepare.json?.plan_id,
  validation_status: prepare.json?.validation_status,
  error: prepare.json?.error,
  checks: prepare.json?.checks,
};
save("02-plan.json", prepare.json);

if (prepare.status !== 200) {
  console.log("prepare failed:", prepare.status, prepare.json?.error, prepare.json?.detail);
  console.log(JSON.stringify(prepare.json?.checks ?? [], null, 2));
  save("99-gate-result.json", report);
  process.exit(1);
}

const plan = prepare.json;
const draft = plan.draft;

// ------------------------------------------------- step 3: storefront evidence
let verify = { status: 0, json: null };
let schemaFound = null;
if (plan.plan_id) {
  const exec = await post("/api/chatgpt-mcp/products/execute-v44", {
    product_id: PRODUCT, plan_id: plan.plan_id, ...standard,
  });
  report.steps.execute = { status: exec.status, save_status: exec.json?.execution?.save_status };
  save("03-execute-simulated.json", exec.json);

  verify = await post("/api/chatgpt-mcp/products/verify-v44", {
    product_id: PRODUCT, plan_id: plan.plan_id, ...standard,
  });
  const codes = (verify.json?.checks ?? []).map((c) => c.code);
  schemaFound = !codes.includes("SCHEMA-01 PRODUCT_SCHEMA_NOT_FOUND");
  report.steps.verify = { status: verify.status, codes, schema_found: schemaFound };
  save("04-verify.json", verify.json);
}

// ------------------------------------------- step 4: rollback baseline + gates
const snap = local.json?.snapshot ?? {};
const seoIsInSnapshot = "existing_seo_title" in snap;

const categories = [
  { key: "product_identity", fields: ["existing_name", "existing_subtitle", "product_id"], weight: 10,
    captured: Boolean(snap.existing_name) && Boolean(snap.product_id), source: "admin snapshot" },
  { key: "url", fields: ["existing_slug"], weight: 10,
    captured: Boolean(snap.existing_slug), source: "admin snapshot" },
  { key: "description", fields: ["existing_description_html"], weight: 15,
    captured: (snap.existing_description_html ?? "").length > 0, source: "admin snapshot" },
  { key: "images", fields: ["image_urls"], weight: 10,
    captured: (snap.image_urls?.length ?? 0) > 0, source: "admin snapshot" },
  { key: "seo_fields", fields: ["existing_seo_title", "existing_seo_keywords", "existing_meta_description"], weight: 15,
    captured: seoIsInSnapshot, source: "admin snapshot (SEO dialog)" },
  { key: "publish_state", fields: ["is_published"], weight: 5,
    captured: typeof snap.is_published === "boolean", source: "admin snapshot" },
  { key: "price", fields: ["price"], weight: 10, captured: false, source: "NO READER" },
  { key: "inventory", fields: ["inventory"], weight: 10, captured: false, source: "NO READER" },
  { key: "collections", fields: ["collections"], weight: 10, captured: false, source: "NO READER" },
  { key: "schema", fields: ["json_ld"], weight: 5,
    captured: schemaFound === true, source: schemaFound ? "storefront (via bridge verify)" : "not captured" },
];

const score = categories.filter((c) => c.captured).reduce((sum, c) => sum + c.weight, 0);
const g1 = score >= 90;

// G2: every field this plan will write must have a pre-write value available.
const writeTargets = [
  { field: "product_name", baseline: snap.existing_name, ok: Boolean(snap.existing_name) },
  { field: "description_html", baseline: snap.existing_description_html, ok: (snap.existing_description_html ?? "").length > 0 },
  { field: "seo_title", baseline: snap.existing_seo_title, ok: seoIsInSnapshot },
  { field: "meta_description", baseline: snap.existing_meta_description, ok: seoIsInSnapshot },
  { field: "keywords", baseline: snap.existing_seo_keywords, ok: seoIsInSnapshot },
  { field: "image_alts", baseline: `${snap.image_urls?.length ?? 0} image urls`, ok: (snap.image_urls?.length ?? 0) > 0 },
  { field: "json_ld", baseline: schemaFound ? "storefront JSON-LD captured" : null, ok: schemaFound === true },
];
const g2 = writeTargets.every((t) => t.ok);

report.baseline = {
  basis: basisLabel,
  categories,
  score,
  gate_g1_pass: g1,
  gate_g2_pass: g2,
  write_targets: writeTargets,
  verdict: g1 && g2 ? "GO" : "NO-GO",
};

const planContract = {
  plan_id: plan.plan_id,
  slug: draft.slug,
  canonical_url: draft.canonical_url,
  url_change_required: draft.url_change_required,
  redirect_from: draft.redirect_from,
  product_name: draft.product_name,
  seo_title: draft.seo_title,
  keywords: draft.keywords,
  meta_description: draft.meta_description,
  key_description_li_count: (draft.key_description_html?.match(/<li>/g) ?? []).length,
  image_alt_count: draft.image_alts?.length,
  schema: JSON.parse(draft.schema_json ?? "{}"),
  validation_status: plan.validation_status,
  warnings: (plan.checks ?? []).filter((c) => c.severity === "WARN").map((c) => `${c.code}: ${c.message}`),
  errors: (plan.checks ?? []).filter((c) => c.severity === "ERROR").map((c) => `${c.code}: ${c.message}`),
};
report.plan_contract = planContract;

save("05-baseline-and-gates.json", report.baseline);
save("06-plan-contract.json", planContract);
save("99-gate-result.json", report);

console.log(`live read available : ${buildOnLive}${buildOnLive ? "" : "  (" + (live.json?.detail ?? "?") + ")"}`);
console.log(`plan basis          : ${basisLabel}`);
console.log(`plan_id             : ${plan.plan_id}`);
console.log(`validation          : ${plan.validation_status}`);
console.log(`slug                : ${draft.slug}`);
console.log(`url_change_required : ${draft.url_change_required}`);
console.log(`rollback score      : ${score} / 100`);
console.log(`G1 (>=90)           : ${g1 ? "PASS" : "FAIL"}`);
console.log(`G2 (write coverage) : ${g2 ? "PASS" : "FAIL"}`);
console.log(`VERDICT             : ${report.baseline.verdict}`);
console.log("");
console.log("uncaptured categories :", categories.filter((c) => !c.captured).map((c) => `${c.key}(${c.weight}) [${c.source}]`).join(", ") || "none");
console.log("evidence              :", path.relative(REPO, OUT));
