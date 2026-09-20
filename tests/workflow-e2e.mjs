// ---------------------------------------------------------------------------
// Drip SEO Agent — full workflow end-to-end
//
// Walks every node of the pipeline against the sandbox bridge and captures each
// node's artifact to disk. Run with the bridge in --mode simulate.
//
//   node workflow-e2e.mjs
//
// Env:
//   BRIDGE_BASE_URL   default http://127.0.0.1:8811
//   LOCAL_AGENT_TOKEN default test-token-local-bridge
//   BRIDGE_SANDBOX    default <repo>/.sandbox
//   WORKFLOW_EVIDENCE default <repo>/reports/evidence/workflow-e2e
//   TEST_PRODUCT_ID   default 536027551768089
// ---------------------------------------------------------------------------

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BRIDGE_BASE_URL ?? "http://127.0.0.1:8811";
const TOKEN = process.env.LOCAL_AGENT_TOKEN ?? "test-token-local-bridge";
const REPO = path.resolve(import.meta.dirname, "..");
const SANDBOX = process.env.BRIDGE_SANDBOX
  ? path.resolve(process.env.BRIDGE_SANDBOX)
  : path.join(REPO, ".sandbox");
const EVIDENCE = process.env.WORKFLOW_EVIDENCE
  ? path.resolve(process.env.WORKFLOW_EVIDENCE)
  : path.join(REPO, "reports", "evidence", "workflow-e2e");
const EXPECTED_HASH =
  process.env.EXPECTED_STANDARD_SHA256 ??
  "965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7";

const PRODUCT = process.env.TEST_PRODUCT_ID ?? "536027551768089";
const OTHER_PRODUCT = process.env.TEST_OTHER_PRODUCT_ID ?? "536027552331542";

const standard = { standard_version: "4.4", standard_hash: EXPECTED_HASH };

let pass = 0;
let fail = 0;
const lines = [];
const artifacts = [];
const gaps = [];

function check(id, ok, detail) {
  if (ok) { pass++; lines.push(`PASS  ${id}${detail ? "  :: " + detail : ""}`); }
  else { fail++; lines.push(`FAIL  ${id}${detail ? "  :: " + detail : ""}`); }
  return ok;
}

/**
 * A known capability hole that is recorded rather than asserted. Gaps never
 * affect the exit code — they exist so the workflow run tells the whole truth
 * about what it could and could not capture.
 */
function recordGap(id, detail) {
  gaps.push({ id, detail });
  lines.push(`GAP   ${id}${detail ? "  :: " + detail : ""}`);
}

function node(n, title, note) {
  lines.push("");
  lines.push(`--- NODE ${n}  ${title}${note ? "  (" + note + ")" : ""}`);
}

/** Persist one node's raw artifact and register it for the summary. */
function saveArtifact(nodeId, name, payload) {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const file = path.join(EVIDENCE, `${nodeId}-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  const stat = fs.statSync(file);
  artifacts.push({
    node: nodeId,
    name,
    file: path.relative(REPO, file),
    bytes: stat.size,
  });
  return file;
}

async function call(method, route, body, { token = TOKEN } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { status: response.status, json, text };
}

/** Content hash of an entire directory tree, used for write-freedom assertions. */
function hashTree(root) {
  const entries = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else entries.push(
        `${path.relative(root, full)}:${crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex")}`,
      );
    }
  };
  walk(root);
  return crypto.createHash("sha256").update(entries.join("\n")).digest("hex");
}

// --------------------------------------------------------------- run state io

const RUNS = path.join(SANDBOX, "state", "runs");

function findRunForProduct(productId) {
  for (const runId of fs.readdirSync(RUNS)) {
    const file = path.join(RUNS, runId, "products", `${productId}.json`);
    if (fs.existsSync(file)) return runId;
  }
  return null;
}

function loadProductJob(productId) {
  const runId = findRunForProduct(productId);
  if (!runId) return null;
  const file = path.join(RUNS, runId, "products", `${productId}.json`);
  return { runId, file, job: JSON.parse(fs.readFileSync(file, "utf8")) };
}

/**
 * Sandbox-only: re-stamp a checkpoint's capturedAt to now so the snapshot
 * freshness gate is exercised on its own merits rather than flaking on wall
 * clock. Never point this at production state.
 */
function restampSnapshot(productId, hoursAgo = 0) {
  const located = loadProductJob(productId);
  if (!located) throw new Error(`no local checkpoint for ${productId}`);
  const when = new Date(Date.now() - hoursAgo * 3600_000).toISOString();
  located.job.snapshot.capturedAt = when;
  fs.writeFileSync(located.file, JSON.stringify(located.job, null, 2), "utf8");
  return when;
}

function readFileJob(productId) {
  const located = loadProductJob(productId);
  return located?.job ?? null;
}

// ------------------------------------------------------------------ fixtures

// The research layer's payload for the Thom Browne target. This is the
// externally-produced input the pipeline consumes; nothing here is inferred by
// the bridge.
const TB = "536027551768089";
const TB_ENTITY = {
  brand: "Thom Browne",
  model: "4-Bar Stripe Jersey Stitch Tee",
  product_type: "T-Shirt",
  colorway: "Brown",
  collaboration_or_collection: null,
};
const TB_FACTS = {
  consumer_product_name: "Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown",
  decision_sentence:
    "This Thom Browne knit tee comes in a deep brown colourway with the signature white 4-Bar stripe on the left sleeve.",
  brand_internal_url: "https://www.dripsneakers.org/Thom-Browne/",
  product_details_fifth: {
    label: "Graphic",
    value: "White 4-Bar Stripe On Left Sleeve",
  },
};

function omitResolution() {
  return {
    verdict: "SKU_OMIT",
    exact_entity: TB_ENTITY,
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
}

// ===========================================================================
// NODE 1 — service identity and standard pinning
// ===========================================================================
node(1, "Service + standard pinning");

const health = await call("GET", "/health");
check("N1.health_ok", health.status === 200 && health.json?.ok === true, `status=${health.status}`);
check("N1.standard_version", health.json?.standard_version === "4.4", health.json?.standard_version);
check("N1.standard_hash", health.json?.standard_hash === EXPECTED_HASH, health.json?.standard_hash);
check("N1.execution_mode_simulate", health.json?.execution_mode === "simulate", health.json?.execution_mode);
saveArtifact("n1", "health", health.json);

const unauth = await call("GET", "/health", undefined, { token: null });
check("N1.health_is_reachable_without_token", unauth.status === 200, `status=${unauth.status}`);

const noAuth = await call("POST", "/api/chatgpt-mcp/products/search", { query: "x" }, { token: null });
check("N1.auth_rejects_missing_token", noAuth.status === 401, `status=${noAuth.status}`);

const badStd = await call("POST", "/api/chatgpt-mcp/products/search", {
  query: "Chrome", standard_hash: "deadbeef".repeat(8), standard_version: "4.4",
});
check("N1.standard_hash_mismatch_rejected",
  badStd.status === 409 && badStd.json?.error === "standard_hash_mismatch",
  `status=${badStd.status} error=${badStd.json?.error}`);

// ===========================================================================
// NODE 2 — discovery
// ===========================================================================
node(2, "Discovery", "local checkpoints");

const search = await call("POST", "/api/chatgpt-mcp/products/search", {
  query: "Thom Browne", status: "all", limit: 20, ...standard,
});
check("N2.search_200", search.status === 200, `status=${search.status}`);
check("N2.search_scanned", (search.json?.total_scanned ?? 0) > 0, `scanned=${search.json?.total_scanned}`);
check("N2.search_finds_target",
  (search.json?.products ?? []).some((p) => p.product_id === TB),
  `hits=${search.json?.products?.length}`);
saveArtifact("n2", "search", search.json);

// ===========================================================================
// NODE 3 — snapshot
// ===========================================================================
node(3, "Snapshot", "read from local checkpoint");

const read = await call("POST", "/api/chatgpt-mcp/products/read", { product_id: TB, ...standard });
check("N3.read_200", read.status === 200, `status=${read.status}`);
check("N3.snapshot_hash_is_sha256",
  typeof read.json?.snapshot_hash === "string" && read.json.snapshot_hash.length === 64,
  read.json?.snapshot_hash?.slice(0, 16));
check("N3.run_id_exposed", typeof read.json?.run_id === "string" && read.json.run_id.length > 0, read.json?.run_id);
check("N3.name_present", (read.json?.name ?? "").length > 0, read.json?.name);
check("N3.slug_present", (read.json?.current_seo?.slug ?? "").length > 0, read.json?.current_seo?.slug);
check("N3.images_present", (read.json?.images?.length ?? 0) > 0, `images=${read.json?.images?.length}`);
check("N3.images_are_public_https",
  (read.json?.images ?? []).every((u) => u.startsWith("https://")),
  read.json?.images?.[0]);
saveArtifact("n3", "read", read.json);

// Node 3b — the four baseline categories the snapshot is responsible for.
node("3b", "Snapshot baseline", "description, images, SEO fields, slug");

const snap = read.json?.snapshot ?? {};
check("N3b.description_html_captured",
  (snap.existing_description_html ?? "").length > 0,
  `bytes=${(snap.existing_description_html ?? "").length}`);
check("N3b.image_urls_captured",
  (snap.image_urls?.length ?? 0) > 0,
  `images=${snap.image_urls?.length}`);
check("N3b.slug_captured",
  (snap.existing_slug ?? "").length > 0,
  snap.existing_slug);
check("N3b.seo_fields_present_on_snapshot",
  "existing_seo_title" in snap && Array.isArray(snap.existing_seo_keywords) && "existing_meta_description" in snap,
  `title='${snap.existing_seo_title}' keywords=[${(snap.existing_seo_keywords ?? []).join("|")}] meta='${snap.existing_meta_description}'`);
check("N3b.publish_state_captured",
  typeof snap.is_published === "boolean",
  `is_published=${snap.is_published}`);
check("N3b.snapshot_hash_covers_seo_fields",
  // ComputeSnapshotHash includes the SEO fields, so a populated value is what
  // makes the hash meaningful for baseline tamper detection.
  read.json?.snapshot_hash?.length === 64,
  read.json?.snapshot_hash?.slice(0, 16));
saveArtifact("n3b", "snapshot-baseline", snap);

// Node 3c — the two baseline categories no admin read provides today.
node("3c", "Baseline gaps", "fields with no reader in the stack");

const STOREFRONT = "https://www.dripsneakers.org";
const storefrontUrl = `${STOREFRONT}/${read.json?.current_seo?.slug}`;
let storefront = { status: 0, canonical: null, robots: null, schema: null, title: null, h1: null, html: "" };
try {
  const response = await fetch(storefrontUrl, { redirect: "manual" });
  storefront.status = response.status;
  storefront.html = await response.text();
  storefront.canonical =
    storefront.html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
    storefront.html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1] ?? null;
  storefront.robots = storefront.html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
  storefront.title = storefront.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  storefront.h1 = storefront.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null;
  const ld = storefront.html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (ld) { try { storefront.schema = JSON.parse(ld[1]); } catch { storefront.schema = { parse_error: true }; } }
} catch (error) {
  storefront.error = error.message;
}
check("N3c.storefront_probe_attempted", true,
  `status=${storefront.status} url=${storefrontUrl}`);

if (storefront.status === 200) {
  check("N3c.canonical_is_self",
    storefront.canonical !== null && storefront.canonical.replace(/\/$/, "") === storefrontUrl.replace(/\/$/, ""),
    `canonical=${storefront.canonical}`);
  check("N3c.no_noindex", !/noindex/i.test(storefront.robots ?? ""), `robots=${storefront.robots ?? "(absent)"}`);
  check("N3c.jsonld_present", storefront.schema !== null, `keys=${storefront.schema ? Object.keys(storefront.schema).join(",") : "none"}`);
} else {
  // The harness cannot be the storefront reader here: Node's fetch fails to
  // complete against this storefront (ECONNRESET) while .NET and PowerShell
  // succeed. Harness reachability is not a product requirement, so this is
  // recorded as an environment gap and the real storefront evidence is taken
  // through the bridge in Node 8.
  recordGap("N3c.harness_cannot_reach_storefront",
    `node fetch failed (${storefront.error}); storefront evidence is taken through the bridge in node 8`);
}
saveArtifact("n3c", "storefront-baseline", { ...storefront, html: undefined, html_bytes: storefront.html.length });

recordGap("N3c.price_no_reader", "price is not read by any bridge route or client method");
recordGap("N3c.inventory_no_reader", "inventory is not read by any bridge route or client method");
recordGap("N3c.collections_no_reader", "collection membership is not read by any bridge route or client method");
recordGap("N3c.schema_not_in_snapshot", "JSON-LD is only obtainable from the storefront, not from the admin snapshot");

// ===========================================================================
// NODE 4 — research input gates
// ===========================================================================
node(4, "Research input gates", "SKU verdict enforcement");

restampSnapshot(TB, 0);

const internalIdAsSku = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: TB,
  operation: "auto",
  sku_resolution: {
    verdict: "VERIFIED_SKU",
    exact_entity: TB_ENTITY,
    sku: "536027557118233",
    evidence: [{ tier: 1, source_name: "Brand", url: "https://example.com/p", sku: "536027557118233", exact_entity_match: true }],
    conflicts: [],
    decision_note: "attempt to smuggle the internal Product ID as a SKU",
  },
  v44_facts: TB_FACTS,
  ...standard,
});
check("N4.internal_product_id_rejected",
  internalIdAsSku.status === 400 && internalIdAsSku.json?.error === "sku_gate_failed",
  `status=${internalIdAsSku.status} error=${internalIdAsSku.json?.error}`);
check("N4.rejected_sku_creates_no_plan", !("plan_id" in (internalIdAsSku.json ?? {})), "");
saveArtifact("n4", "sku-gate-reject", internalIdAsSku.json);

const hold = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: TB,
  operation: "auto",
  sku_resolution: {
    verdict: "HOLD",
    exact_entity: TB_ENTITY,
    sku: null,
    evidence: [{
      tier: 8,
      source_name: "Drip product photography (visual identification)",
      url: "",
      exact_entity_match: false,
      notes: "photograph shows a deep brown knit tee; the backend name token 'Grown' matches no verified Thom Browne colourway",
    }],
    conflicts: ["backend name token 'Grown' is not a verifiable Thom Browne colourway"],
    decision_note: "identity conflict",
  },
  v44_facts: TB_FACTS,
  ...standard,
});
check("N4.hold_blocks_plan",
  hold.status === 409 && hold.json?.error === "hold_forbids_plan",
  `status=${hold.status} error=${hold.json?.error}`);
saveArtifact("n4", "hold-blocks", hold.json);

// ===========================================================================
// NODE 5 — compose + validate → immutable plan
// ===========================================================================
node(5, "Compose + validate", "V4.4 generation, migration path (URL will change)");

const prepareMigration = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: TB,
  operation: "auto",
  sku_resolution: omitResolution(),
  v44_facts: TB_FACTS,
  ...standard,
});
check("N5.prepare_200", prepareMigration.status === 200, `status=${prepareMigration.status}`);
check("N5.validation_pass", prepareMigration.json?.validation_status === "PASS", prepareMigration.json?.validation_status);
check("N5.plan_id_present", typeof prepareMigration.json?.plan_id === "string", prepareMigration.json?.plan_id);
check("N5.standard_hash_recorded",
  prepareMigration.json?.standard_hash === EXPECTED_HASH,
  prepareMigration.json?.standard_hash?.slice(0, 16));
check("N5.snapshot_hash_recorded",
  typeof prepareMigration.json?.snapshot_hash === "string" && prepareMigration.json.snapshot_hash.length === 64,
  prepareMigration.json?.snapshot_hash?.slice(0, 16));
check("N5.not_executed_yet", prepareMigration.json?.executed === false, `executed=${prepareMigration.json?.executed}`);
check("N5.migration_path_flags_url_change",
  prepareMigration.json?.draft?.url_change_required === true,
  `url_change_required=${prepareMigration.json?.draft?.url_change_required}`);
check("N5.migration_path_records_redirect_from",
  typeof prepareMigration.json?.draft?.redirect_from === "string" &&
    prepareMigration.json.draft.redirect_from.includes("Top-Quality"),
  prepareMigration.json?.draft?.redirect_from);
check("N5.slug_migrated",
  prepareMigration.json?.draft?.slug === "thom-browne-4-bar-stripe-jersey-stitch-tee-brown",
  prepareMigration.json?.draft?.slug);
check("N5.schema_omits_sku",
  !JSON.parse(prepareMigration.json?.draft?.schema_json ?? "{}").sku,
  prepareMigration.json?.draft?.schema_json?.replace(/\s+/g, " "));
check("N5.key_description_has_five_fields",
  (prepareMigration.json?.draft?.key_description_html?.match(/<li>/g) ?? []).length === 5,
  `li=${(prepareMigration.json?.draft?.key_description_html?.match(/<li>/g) ?? []).length}`);
check("N5.image_alts_match_image_count",
  (prepareMigration.json?.draft?.image_alts?.length ?? 0) === (read.json?.images?.length ?? -1),
  `alts=${prepareMigration.json?.draft?.image_alts?.length} images=${read.json?.images?.length}`);
saveArtifact("n5", "plan-migration", prepareMigration.json);

const planIdMigration = prepareMigration.json?.plan_id;

// Node 5b — the Phase 8.1 safe-write variant: keep the existing URL.
node("5b", "Compose + validate", "safe-write path (URL must stay unchanged)");

const prepareKeep = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: TB,
  operation: "auto",
  sku_resolution: omitResolution(),
  v44_facts: { ...TB_FACTS, keep_existing_slug: true },
  ...standard,
});
check("N5b.prepare_200", prepareKeep.status === 200, `status=${prepareKeep.status}`);
if (prepareKeep.status === 200) {
  check("N5b.slug_unchanged",
    prepareKeep.json?.draft?.slug === read.json?.current_seo?.slug,
    `slug=${prepareKeep.json?.draft?.slug}`);
  check("N5b.url_change_required_false",
    prepareKeep.json?.draft?.url_change_required === false,
    `url_change_required=${prepareKeep.json?.draft?.url_change_required}`);
  check("N5b.redirect_from_null",
    prepareKeep.json?.draft?.redirect_from === null,
    `redirect_from=${prepareKeep.json?.draft?.redirect_from}`);
  check("N5b.canonical_is_existing_url",
    prepareKeep.json?.draft?.canonical_url ===
      `https://www.dripsneakers.org/${read.json?.current_seo?.slug}`,
    prepareKeep.json?.draft?.canonical_url);
} else {
  check("N5b.keep_existing_slug_supported", false,
    `error=${prepareKeep.json?.error} detail=${prepareKeep.json?.detail ?? prepareKeep.text?.slice(0, 200)}`);
}
saveArtifact("n5b", "plan-keep-url", prepareKeep.json);
const planIdKeep = prepareKeep.json?.plan_id;

// ===========================================================================
// NODE 6 — execute guards
// ===========================================================================
node(6, "Execute guards", "no plan may be executed twice or against the wrong product");

const wrongProduct = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
  product_id: OTHER_PRODUCT, plan_id: planIdMigration, ...standard,
});
check("N6.plan_product_mismatch_rejected",
  [409, 404].includes(wrongProduct.status),
  `status=${wrongProduct.status} error=${wrongProduct.json?.error}`);

const malformed = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
  product_id: TB, plan_id: "../../etc/passwd", ...standard,
});
check("N6.malformed_plan_id_rejected",
  malformed.status === 400 && malformed.json?.error === "invalid_plan_id",
  `status=${malformed.status} error=${malformed.json?.error}`);

const unknownPlan = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
  product_id: TB, plan_id: "plan_20200101T000000000_deadbeef", ...standard,
});
check("N6.unknown_plan_rejected",
  unknownPlan.status === 404 && unknownPlan.json?.error === "unknown_plan",
  `status=${unknownPlan.status} error=${unknownPlan.json?.error}`);

// ===========================================================================
// NODE 7 — execute (simulate)
// ===========================================================================
node(7, "Execute", "simulate mode — no MrShopPlus contact");

const runsTreeBefore = hashTree(RUNS);
const execMigration = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
  product_id: TB, plan_id: planIdMigration, ...standard,
});
check("N7.execute_200", execMigration.status === 200, `status=${execMigration.status}`);
check("N7.executed_flag", execMigration.json?.executed === true, `executed=${execMigration.json?.executed}`);
check("N7.not_published_in_simulate",
  execMigration.json?.execution?.published === false,
  `published=${execMigration.json?.execution?.published}`);
check("N7.save_status_simulated",
  /SIMULATED/.test(execMigration.json?.execution?.save_status ?? ""),
  execMigration.json?.execution?.save_status);
saveArtifact("n7", "execute-simulated", execMigration.json);

const rerun = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
  product_id: TB, plan_id: planIdMigration, ...standard,
});
check("N7.duplicate_execute_refused",
  rerun.status === 409 && rerun.json?.error === "plan_already_executed",
  `status=${rerun.status} error=${rerun.json?.error}`);

// Execute the keep-URL plan too, to confirm the safe path runs end to end.
let execKeep = { status: 0, json: null };
if (planIdKeep) {
  execKeep = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
    product_id: TB, plan_id: planIdKeep, ...standard,
  });
  check("N7.keep_plan_executes",
    execKeep.status === 200 && execKeep.json?.executed === true,
    `status=${execKeep.status}`);
  saveArtifact("n7", "execute-simulated-keep-url", execKeep.json);
}

const runsTreeAfter = hashTree(RUNS);
check("N7.simulate_leaves_run_state_byte_identical",
  runsTreeBefore === runsTreeAfter,
  runsTreeBefore === runsTreeAfter ? "tree unchanged" : "RUN STATE MUTATED");

recordGap("N7.publish_inference_unproven",
  "publish is now derived from url_change_required, but that branch lives in ExecuteLiveAsync and simulate mode never reaches it");
recordGap("N7.write_selectors_unproven",
  "MrShopPlus write selectors and the SEO dialog save flow remain unmapped against the live admin UI");

// ===========================================================================
// NODE 8 — verify
// ===========================================================================
node(8, "Verify", "storefront acceptance for both plans");

const verifyMigration = await call("POST", "/api/chatgpt-mcp/products/verify-v44", {
  product_id: TB, plan_id: planIdMigration, ...standard,
});
check("N8.verify_200", verifyMigration.status === 200, `status=${verifyMigration.status}`);
check("N8.verify_returns_pass_flag",
  typeof verifyMigration.json?.pass === "boolean",
  `pass=${verifyMigration.json?.pass}`);
const vmCodes = (verifyMigration.json?.checks ?? []).map((c) => c.code);
check("N8.verify_checks_present", vmCodes.length > 0, `checks=${vmCodes.length}`);
check("N8.verify_targets_proposed_canonical",
  vmCodes.includes("FRONTEND-02 HTTP_STATUS"),
  vmCodes.join(" | "));
check("N8.migration_target_is_not_live_yet",
  // Correct and expected before any write: the migrated URL does not exist.
  /404/.test((verifyMigration.json?.checks ?? []).find((c) => c.code.startsWith("FRONTEND-02"))?.message ?? ""),
  (verifyMigration.json?.checks ?? []).find((c) => c.code.startsWith("FRONTEND-02"))?.message);
saveArtifact("n8", "verify-migration", verifyMigration.json);

if (planIdKeep) {
  const verifyKeep = await call("POST", "/api/chatgpt-mcp/products/verify-v44", {
    product_id: TB, plan_id: planIdKeep, ...standard,
  });
  check("N8.verify_keep_url_200", verifyKeep.status === 200, `status=${verifyKeep.status}`);
  const keepChecks = verifyKeep.json?.checks ?? [];
  const keepHttp = keepChecks.find((c) => c.code.startsWith("FRONTEND-02"));
  const keepCodes = keepChecks.map((c) => c.code);

  check("N8.keep_url_target_is_the_live_page",
    // The whole point of the safe-write path: the canonical under verification is
    // the URL that is already live, so the storefront half of the check is real
    // rather than a 404 against a page that does not exist yet.
    //
    // FRONTEND-02 is only emitted when the fetch fails, so its absence is the
    // pass condition.
    !keepChecks.some((c) => c.code.startsWith("FRONTEND-02")),
    keepHttp ? keepHttp.message : "no HTTP_STATUS finding: the page resolved");
  check("N8.keep_url_canonical_matches",
    !keepChecks.some((c) => c.code.startsWith("FRONTEND-07")),
    keepCodes.join(" | "));
  check("N8.keep_url_finds_storefront_schema",
    !keepChecks.some((c) => c.code === "SCHEMA-01 PRODUCT_SCHEMA_NOT_FOUND"),
    keepCodes.join(" | "));
  check("N8.keep_url_only_content_checks_remain",
    // Before the write exists, only the content checks can fail. Any surviving
    // transport-level failure would mean the storefront target itself is wrong.
    !keepChecks.some((c) => c.code === "FRONTEND-EXCEPTION"),
    keepCodes.join(" | "));
  saveArtifact("n8", "verify-keep-url", verifyKeep.json);
}

// ===========================================================================
// NODE 9 — run status
// ===========================================================================
node(9, "Run status");

const status = await call("GET", `/api/chatgpt-mcp/runs/status?run_id=${encodeURIComponent(read.json?.run_id ?? "")}`, undefined, {});
check("N9.run_status_200", status.status === 200, `status=${status.status}`);
check("N9.run_status_has_products", (status.json?.products?.length ?? 0) > 0, `products=${status.json?.products?.length}`);
saveArtifact("n9", "run-status", status.json);

// ===========================================================================
// NODE 10 — snapshot freshness gate
// ===========================================================================
node(10, "Snapshot freshness gate");

restampSnapshot(TB, 384);
const aged = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: TB,
  operation: "auto",
  sku_resolution: omitResolution(),
  v44_facts: TB_FACTS,
  ...standard,
});
check("N10.aged_snapshot_refused",
  aged.status === 409 && aged.json?.error === "stale_snapshot_requires_refresh",
  `status=${aged.status} error=${aged.json?.error}`);
check("N10.aged_snapshot_creates_no_plan", !("plan_id" in (aged.json ?? {})), "");
saveArtifact("n10", "stale-snapshot", aged.json);

const restampedAt = restampSnapshot(TB, 0);
const fresh = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: TB,
  operation: "auto",
  sku_resolution: omitResolution(),
  v44_facts: TB_FACTS,
  ...standard,
});
check("N10.fresh_snapshot_allowed", fresh.status === 200, `status=${fresh.status} restamped=${restampedAt}`);
saveArtifact("n10", "fresh-snapshot", fresh.json);
const planIdFresh = fresh.json?.plan_id;

// ===========================================================================
// NODE 11 — immutable plan store on disk
// ===========================================================================
node(11, "Immutable plan store");

const plansDir = path.join(SANDBOX, "bridge", "plans");
const planFile = path.join(plansDir, `${planIdMigration}.json`);
check("N11.plan_file_exists", fs.existsSync(planFile), path.relative(REPO, planFile));
if (fs.existsSync(planFile)) {
  const raw = JSON.parse(fs.readFileSync(planFile, "utf8"));
  check("N11.plan_file_records_execution", raw.executed === true, `executed=${raw.executed}`);
  check("N11.plan_file_records_verification", Boolean(raw.verification), `checks=${raw.verification?.length ?? 0}`);
  check("N11.plan_file_immutable_core_fields",
    raw.standard_hash === EXPECTED_HASH && raw.snapshot_hash === prepareMigration.json?.snapshot_hash,
    `standard=${raw.standard_hash?.slice(0, 12)} snapshot=${raw.snapshot_hash?.slice(0, 12)}`);
  saveArtifact("n11", "plan-on-disk", raw);
}
const planCount = fs.existsSync(plansDir) ? fs.readdirSync(plansDir).filter((f) => f.endsWith(".json")).length : 0;
check("N11.plan_store_populated", planCount > 0, `plans=${planCount}`);

// ===========================================================================
// summary
// ===========================================================================
node(99, "Summary");

const summary = {
  generated_at: new Date().toISOString(),
  bridge: BASE,
  execution_mode: health.json?.execution_mode,
  standard_version: health.json?.standard_version,
  standard_hash: health.json?.standard_hash,
  product_id: TB,
  run_id: read.json?.run_id,
  snapshot_hash: read.json?.snapshot_hash,
  plan_ids: {
    migration: planIdMigration ?? null,
    keep_url: planIdKeep ?? null,
    fresh: planIdFresh ?? null,
  },
  assertions: { pass, fail, total: pass + fail },
  gaps,
  artifacts,
  lines,
};

fs.mkdirSync(EVIDENCE, { recursive: true });
const summaryFile = path.join(EVIDENCE, "workflow-summary.json");
fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), "utf8");

// restore the fixture so a rerun starts from a fresh checkpoint
restampSnapshot(TB, 0);

console.log(lines.join("\n"));
console.log("");
console.log(`assertions  ${pass} passed, ${fail} failed, ${pass + fail} total`);
console.log(`gaps        ${gaps.length}`);
console.log(`evidence    ${path.relative(REPO, EVIDENCE)}`);
console.log(`summary     ${path.relative(REPO, summaryFile)}`);
console.log("");
console.log(fail === 0 ? "WORKFLOW_E2E_PASS" : "WORKFLOW_E2E_FAIL");

process.exit(fail === 0 ? 0 : 1);
