import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BRIDGE_BASE_URL ?? "http://127.0.0.1:8799";
const TOKEN = process.env.LOCAL_AGENT_TOKEN ?? "test-token-local-bridge";
const SANDBOX = process.env.BRIDGE_SANDBOX
  ? path.resolve(process.env.BRIDGE_SANDBOX)
  : path.resolve(import.meta.dirname, "..", ".sandbox");
const RUNS = path.join(SANDBOX, "state/runs");
const EXPECTED_HASH =
  process.env.EXPECTED_STANDARD_SHA256 ??
  "5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8";

const PRODUCT = process.env.TEST_PRODUCT_ID ?? "536027552331542";
const OTHER_PRODUCT = process.env.TEST_OTHER_PRODUCT_ID ?? "536027552056603";

let pass = 0;
let fail = 0;
const results = [];

function check(id, ok, detail) {
  if (ok) { pass++; results.push(`PASS  ${id}${detail ? " :: " + detail : ""}`); }
  else { fail++; results.push(`FAIL  ${id}${detail ? " :: " + detail : ""}`); }
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

function hashTree(root) {
  const entries = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else entries.push(`${path.relative(root, full)}:${crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex")}`);
    }
  };
  walk(root);
  return entries.join("\n");
}

const standard = { standard_version: "4.4", standard_hash: EXPECTED_HASH };

// ------------------------------------------------------------------ 0. health
const health = await call("GET", "/health");
check("health.standard_hash", health.json?.standard_hash === EXPECTED_HASH, health.json?.standard_hash);
check("health.execution_mode", health.json?.execution_mode === "simulate", health.json?.execution_mode);

// ------------------------------------------------------------------ 1. auth
const noAuth = await call("POST", "/api/chatgpt-mcp/products/search", { query: "x" }, { token: null });
check("auth.rejects_missing_token", noAuth.status === 401, `status=${noAuth.status}`);
const badAuth = await call("POST", "/api/chatgpt-mcp/products/search", { query: "x" }, { token: "wrong" });
check("auth.rejects_wrong_token", badAuth.status === 401, `status=${badAuth.status}`);

// ------------------------------------------------------- 2. standard pinning
const badStd = await call("POST", "/api/chatgpt-mcp/products/search", {
  query: "Chrome", standard_hash: "deadbeef".repeat(8), standard_version: "4.4",
});
check("standard.hash_mismatch_rejected", badStd.status === 409 && badStd.json?.error === "standard_hash_mismatch", `status=${badStd.status} error=${badStd.json?.error}`);

// --------------------------------------------------------- 3. search_products
const search = await call("POST", "/api/chatgpt-mcp/products/search", { query: "Chrome Hearts", status: "all", limit: 10, ...standard });
check("route.search.status_200", search.status === 200, `status=${search.status}`);
check("route.search.scanned_products", (search.json?.total_scanned ?? 0) > 0, `scanned=${search.json?.total_scanned}`);
check("route.search.returns_hits", (search.json?.products?.length ?? 0) > 0, `hits=${search.json?.products?.length}`);

// ------------------------------------------------- 4. get_product_context
const read = await call("POST", "/api/chatgpt-mcp/products/read", { product_id: PRODUCT, ...standard });
check("route.read.status_200", read.status === 200, `status=${read.status}`);
check("route.read.has_snapshot_hash", typeof read.json?.snapshot_hash === "string" && read.json.snapshot_hash.length === 64, read.json?.snapshot_hash?.slice(0, 12));
check("route.read.exposes_image_urls", Array.isArray(read.json?.images) && read.json.images.length > 0, `images=${read.json?.images?.length}`);
check("route.read.image_urls_are_public_https", (read.json?.images ?? []).every((u) => u.startsWith("https://")), read.json?.images?.[0]);

// -------------------------------------- 5. prepare: forbidden SKU (internal ID)
const forbiddenSku = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: PRODUCT,
  operation: "auto",
  sku_resolution: {
    verdict: "VERIFIED_SKU",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: "536027557118233",
    evidence: [{ tier: 1, source_name: "Brand", url: "https://example.com/p", sku: "536027557118233", exact_entity_match: true }],
    conflicts: [], decision_note: "attempt to smuggle the internal Product ID as a SKU",
  },
  ...standard,
});
check("sku.internal_product_id_rejected", forbiddenSku.status === 400 && forbiddenSku.json?.error === "sku_gate_failed", `status=${forbiddenSku.status} error=${forbiddenSku.json?.error}`);
check("sku.no_plan_created_for_rejected_sku", !("plan_id" in (forbiddenSku.json ?? {})), JSON.stringify(forbiddenSku.json?.gate_errors ?? []));

// ------------------------------------------------------ 6. prepare: HOLD blocks
const hold = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: PRODUCT,
  operation: "auto",
  sku_resolution: {
    verdict: "HOLD",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: null,
    evidence: [{ tier: 1, source_name: "Brand", url: "https://example.com/p", exact_entity_match: false }],
    conflicts: ["backend name and main image disagree on the colorway"],
    decision_note: "identity-critical conflict unresolved",
  },
  ...standard,
});
check("sku.hold_forbids_plan", hold.status === 409 && hold.json?.error === "hold_forbids_plan", `status=${hold.status} error=${hold.json?.error}`);

// --------------------------------------------- 7. prepare: SKU_OMIT (valid)
const beforeTree = hashTree(RUNS);

const omitPrepare = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: PRODUCT,
  operation: "auto",
  sku_resolution: {
    verdict: "SKU_OMIT",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: null,
    evidence: [{ tier: 1, source_name: "Chrome Hearts official", url: "https://example.com/ch", exact_entity_match: true, notes: "exact entity confirmed" }],
    conflicts: [],
    decision_note: "Exact Entity PASS; no Tier 1-4 source attaches an official SKU to this entity, so SKU is omitted per V4.4 §5",
  },
  v44_facts: {
    consumer_product_name: "Chrome Hearts T-Shirt Black",
    decision_sentence: "This Chrome Hearts T-shirt comes in black with the cross logo on the front.",
    brand_internal_url: "https://www.dripsneakers.org/Chrome-Hearts-T-Shirts/",
    product_details_fifth: { label: "Graphic", value: "Cross Logo Front Print" },
  },
  ...standard,
});
check("prepare.sku_omit.status_200", omitPrepare.status === 200, `status=${omitPrepare.status} ${JSON.stringify(omitPrepare.json?.checks?.filter(c=>c.severity==="ERROR") ?? omitPrepare.json?.detail ?? "")}`);
check("prepare.sku_omit.validation_PASS", omitPrepare.json?.validation_status === "PASS", omitPrepare.json?.validation_status);
check("prepare.sku_omit.returns_plan_id", typeof omitPrepare.json?.plan_id === "string" && omitPrepare.json.plan_id.startsWith("plan_"), omitPrepare.json?.plan_id);
check("prepare.sku_omit.no_sku_anywhere", !JSON.stringify(omitPrepare.json?.draft ?? {}).match(/\b536\d{12}\b/), "no internal ID leak");
check("prepare.sku_omit.seo_title_no_sku", omitPrepare.json?.draft?.seo_title === "Chrome Hearts T-Shirt Black Reps | Drip Sneakers", omitPrepare.json?.draft?.seo_title);
check("prepare.sku_omit.meta_template", omitPrepare.json?.draft?.meta_description === "Shop Chrome Hearts T-Shirt Black reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.", omitPrepare.json?.draft?.meta_description);
check("prepare.records_standard_identity", omitPrepare.json?.standard_version === "4.4" && omitPrepare.json?.standard_hash === EXPECTED_HASH, `${omitPrepare.json?.standard_version}/${omitPrepare.json?.standard_hash?.slice(0,12)}`);
check("prepare.records_snapshot_hash", omitPrepare.json?.snapshot_hash === read.json?.snapshot_hash, omitPrepare.json?.snapshot_hash?.slice(0, 12));

// --------------------------------------------------- 8. prepare wrote nothing
const afterTree = hashTree(RUNS);
check("prepare.no_write_to_shop_state", beforeTree === afterTree, "state/runs tree unchanged (byte-identical)");
const omitRunId = omitPrepare.json?.run_id ?? read.json?.run_id;
check("prepare.records_run_id", typeof omitPrepare.json?.run_id === "string" && omitPrepare.json.run_id.length > 0, omitPrepare.json?.run_id);
const planFiles = fs.readdirSync(path.join(SANDBOX, "bridge/plans"));
check("prepare.plan_persisted_immutably", planFiles.includes(`${omitPrepare.json?.plan_id}.json`), `${planFiles.length} plan file(s)`);
check("prepare.mrshopplus_not_contacted", omitPrepare.json?.execution == null && omitPrepare.json?.executed !== true, "no execution recorded");

// --------------------------------------- 9. prepare: VERIFIED_SKU (valid path)
const verifiedPrepare = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: PRODUCT,
  operation: "auto",
  sku_resolution: {
    verdict: "VERIFIED_SKU",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: "CH-TS-BLK-001",
    evidence: [{ tier: 2, source_name: "StockX", url: "https://stockx.com/x", sku: "CH-TS-BLK-001", exact_entity_match: true }],
    conflicts: [],
    decision_note: "Tier-2 source attaches this SKU to the same exact entity",
  },
  v44_facts: {
    consumer_product_name: "Chrome Hearts T-Shirt Black",
    decision_sentence: "This Chrome Hearts T-shirt comes in black with the cross logo on the front.",
    brand_internal_url: "https://www.dripsneakers.org/Chrome-Hearts-T-Shirts/",
  },
  ...standard,
});
check("prepare.verified_sku.status_200", verifiedPrepare.status === 200, `status=${verifiedPrepare.status}`);
check("prepare.verified_sku.title_has_sku", verifiedPrepare.json?.draft?.seo_title === "Chrome Hearts T-Shirt Black CH-TS-BLK-001 Reps | Drip Sneakers", verifiedPrepare.json?.draft?.seo_title);
check("prepare.verified_sku.meta_has_sku", verifiedPrepare.json?.draft?.meta_description?.includes("(CH-TS-BLK-001)"), verifiedPrepare.json?.draft?.meta_description);
check("prepare.verified_sku.schema_has_sku", JSON.parse(verifiedPrepare.json?.draft?.schema_json ?? "{}").sku === "CH-TS-BLK-001", JSON.parse(verifiedPrepare.json?.draft?.schema_json ?? "{}").sku);
check("prepare.verified_sku.fifth_field_is_sku", verifiedPrepare.json?.draft?.key_description_html?.includes("<strong>SKU:</strong> CH-TS-BLK-001"), "fifth field");

const omitSchema = JSON.parse(omitPrepare.json?.draft?.schema_json ?? "{}");
check("prepare.sku_omit.schema_omits_sku", !("sku" in omitSchema), Object.keys(omitSchema).join(","));

// ------------------------------------------------------- 10. plan tamper tests
const unknownPlan = await call("POST", "/api/chatgpt-mcp/products/execute-v44", { product_id: PRODUCT, plan_id: "plan_does_not_exist_000000", ...standard });
check("execute.unknown_plan_rejected", unknownPlan.status === 404 && unknownPlan.json?.error === "unknown_plan", `status=${unknownPlan.status}`);

const crossProduct = await call("POST", "/api/chatgpt-mcp/products/execute-v44", { product_id: OTHER_PRODUCT, plan_id: omitPrepare.json?.plan_id, ...standard });
check("execute.cross_product_rejected", crossProduct.status === 409 && crossProduct.json?.error === "plan_product_mismatch", `status=${crossProduct.status} error=${crossProduct.json?.error}`);

const badFormat = await call("POST", "/api/chatgpt-mcp/products/execute-v44", { product_id: PRODUCT, plan_id: "../../escape", ...standard });
check("execute.path_traversal_plan_id_rejected", badFormat.status === 400 && badFormat.json?.error === "invalid_plan_id", `status=${badFormat.status} error=${badFormat.json?.error}`);

// Arbitrary SEO fields must be ignored: the write path can only consume the plan.
// This consumes the verified-SKU plan, so it is asserted against that plan's draft.
const arbitraryFields = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
  product_id: PRODUCT, plan_id: verifiedPrepare.json?.plan_id,
  seo_title: "INJECTED TITLE", meta_description: "INJECTED META", slug: "injected-slug", ...standard,
});
check("execute.ignores_arbitrary_seo_fields",
  arbitraryFields.status === 200 && arbitraryFields.json?.draft?.seo_title === verifiedPrepare.json?.draft?.seo_title,
  `status=${arbitraryFields.status} title='${arbitraryFields.json?.draft?.seo_title}'`);
check("execute.arbitrary_fields_did_not_change_slug",
  arbitraryFields.json?.draft?.slug !== "injected-slug", arbitraryFields.json?.draft?.slug);

// ------------------------------------------------ 11. execute (simulate mode)
const execute = await call("POST", "/api/chatgpt-mcp/products/execute-v44", { product_id: PRODUCT, plan_id: omitPrepare.json?.plan_id, ...standard });
check("execute.status_200", execute.status === 200, `status=${execute.status}`);
check("execute.marked_executed", execute.json?.executed === true, `executed=${execute.json?.executed}`);
check("execute.simulate_is_labelled", execute.json?.execution?.save_status?.includes("SIMULATED"), execute.json?.execution?.save_status);

const afterExecuteTree = hashTree(RUNS);
check("execute.simulate_did_not_touch_shop_state", beforeTree === afterExecuteTree, "state/runs still byte-identical");

// -------------------------------------------------- 12. duplicate execute
const duplicate = await call("POST", "/api/chatgpt-mcp/products/execute-v44", { product_id: PRODUCT, plan_id: omitPrepare.json?.plan_id, ...standard });
check("execute.duplicate_rejected", duplicate.status === 409 && duplicate.json?.error === "plan_already_executed", `status=${duplicate.status} error=${duplicate.json?.error}`);

// -------------------------------------------------- 13. stale snapshot test
// A dedicated fresh plan, because the previous two plans have already been consumed.
const stalePrepare = await call("POST", "/api/chatgpt-mcp/products/prepare-v44", {
  product_id: PRODUCT,
  operation: "auto",
  sku_resolution: {
    verdict: "VERIFIED_SKU",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: "CH-TS-BLK-001",
    evidence: [{ tier: 2, source_name: "StockX", url: "https://stockx.com/x", sku: "CH-TS-BLK-001", exact_entity_match: true }],
    conflicts: [], decision_note: "fresh plan for the stale-snapshot guard test",
  },
  v44_facts: {
    consumer_product_name: "Chrome Hearts T-Shirt Black",
    decision_sentence: "This Chrome Hearts T-shirt comes in black with the cross logo on the front.",
    brand_internal_url: "https://www.dripsneakers.org/Chrome-Hearts-T-Shirts/",
  },
  ...standard,
});
check("stale.fresh_plan_available", stalePrepare.status === 200, `status=${stalePrepare.status}`);

const verifiedPlanId = stalePrepare.json?.plan_id;
let staleStatus = "skipped: no fresh plan";
let staleError = `prepare returned ${stalePrepare.status}`;
let planOnDisk = null;
let planDraftTitle = null;

if (verifiedPlanId) {
  const planFile = path.join(SANDBOX, "bridge/plans", `${verifiedPlanId}.json`);
  planOnDisk = JSON.parse(fs.readFileSync(planFile, "utf8"));

  const productsDir = path.join(RUNS, planOnDisk.run_id, "products");
  const checkpoint = fs.readdirSync(productsDir).find((f) => f.startsWith(PRODUCT));
  const checkpointPath = path.join(productsDir, checkpoint);
  const original = fs.readFileSync(checkpointPath, "utf8");
  const mutated = JSON.parse(original);
  mutated.snapshot.existingSeoTitle = "MUTATED BY TEST";
  fs.writeFileSync(checkpointPath, JSON.stringify(mutated, null, 2));

  const stale = await call("POST", "/api/chatgpt-mcp/products/execute-v44", { product_id: PRODUCT, plan_id: verifiedPlanId, ...standard });
  staleStatus = `status=${stale.status} error=${stale.json?.error}`;
  staleError = stale.json?.error;
  fs.writeFileSync(checkpointPath, original);

  planDraftTitle = planOnDisk.draft?.seo_title;
}

check("execute.stale_snapshot_rejected", staleStatus === "status=409 error=stale_plan", staleStatus + " | " + staleError);

// -------------------------------------------------- 14. standard hash guard
const stdGuard = await call("POST", "/api/chatgpt-mcp/products/execute-v44", {
  product_id: PRODUCT, plan_id: verifiedPrepare.json?.plan_id,
  standard_version: "4.4", standard_hash: "0".repeat(64),
});
check("execute.standard_hash_guard", stdGuard.status === 409 && stdGuard.json?.error === "standard_hash_mismatch", `status=${stdGuard.status} error=${stdGuard.json?.error}`);

// ------------------------------------------------- 15. plan immutability check
check("plan.draft_is_immutable_core", planDraftTitle === verifiedPrepare.json?.draft?.seo_title, planDraftTitle ?? "no plan");
check("plan.carries_standard_hash", planOnDisk?.standard_hash === EXPECTED_HASH, planOnDisk?.standard_hash?.slice(0, 12) ?? "no plan");
check("plan.carries_snapshot_hash", typeof planOnDisk?.snapshot_hash === "string" && planOnDisk.snapshot_hash.length === 64, planOnDisk?.snapshot_hash?.slice(0, 12) ?? "no plan");

// ------------------------------------------------------------- 16. verify
const verify = await call("POST", "/api/chatgpt-mcp/products/verify-v44", { product_id: PRODUCT, plan_id: omitPrepare.json?.plan_id, ...standard });
check("route.verify.status_200", verify.status === 200, `status=${verify.status}`);
check("route.verify.reports_no_plan", verify.json?.plan_id === omitPrepare.json?.plan_id, verify.json?.plan_id);
const noPlanVerify = await call("POST", "/api/chatgpt-mcp/products/verify-v44", { product_id: PRODUCT, ...standard });
check("route.verify.requires_plan", noPlanVerify.status === 409 && noPlanVerify.json?.error === "plan_required", `status=${noPlanVerify.status}`);

// ------------------------------------------------------------- 17. run status
const status = await call("GET", `/api/chatgpt-mcp/runs/status?run_id=${encodeURIComponent(verifiedPrepare.json?.run_id ?? "")}`);
check("route.runs_status.status_200", status.status === 200, `status=${status.status}`);
check("route.runs_status.counts", (status.json?.total ?? 0) > 0, `total=${status.json?.total} published=${status.json?.published} hold=${status.json?.hold}`);

// --------------------------------------------------------------------- output
console.log(results.join("\n"));
console.log(`\n# ${pass} passed, ${fail} failed, ${pass + fail} total`);
process.exit(fail === 0 ? 0 : 1);
