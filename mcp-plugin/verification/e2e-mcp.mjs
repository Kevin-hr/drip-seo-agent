import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const EXPECTED_HASH = "965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7";
const PRODUCT = "536027552331542";

let pass = 0;
let fail = 0;
const lines = [];
const check = (id, ok, detail) => {
  ok ? pass++ : fail++;
  lines.push(`${ok ? "PASS" : "FAIL"}  ${id}${detail ? " :: " + detail : ""}`);
};

const client = new Client({ name: "drip-e2e", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:8001/mcp")));

const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  return { isError: result.isError === true, text: result.content?.[0]?.text, content: result.content ?? [], data: result.structuredContent };
};

// E. MCP tool discovery
const listed = await client.listTools();
const names = listed.tools.map((t) => t.name).sort();
check("E.mcp.tool_count_12", names.length === 12, `count=${names.length}`);
check("E.mcp.no_delete_tool", !names.some((n) => n.includes("delete")), names.filter((n) => n.includes("delete")).join(",") || "none");

// bridge connectivity + standard identity passthrough
const search = await call("search_products", { query: "Chrome Hearts", status: "all", limit: 5 });
check("D1.search_products", !search.isError, search.text);
check("D1.search_products.standard_hash", search.data?.standard_hash === EXPECTED_HASH, search.data?.standard_hash?.slice(0, 12));
check("D1.search_products.bridge_data", Array.isArray(search.data?.data?.products), `hits=${search.data?.data?.products?.length}`);

const context = await call("get_product_context", { product_id: PRODUCT });
check("D2.get_product_context", !context.isError, context.text);
check("D2.get_product_context.snapshot_hash", typeof context.data?.data?.snapshot_hash === "string", context.data?.data?.snapshot_hash?.slice(0, 12));
check("D2.get_product_context.image_urls", (context.data?.data?.images?.length ?? 0) > 0, `images=${context.data?.data?.images?.length}`);

const images = await call("get_product_images", { product_id: PRODUCT, max_images: 3 });
const imageParts = (images.content ?? []).filter((c) => c.type === "image");
check("D3.get_product_images", !images.isError, images.text);
check("D3.get_product_images.returns_mcp_image_content", imageParts.length > 0, `${imageParts.length} image content block(s)`);
check("D3.get_product_images.mime_types", imageParts.every((c) => String(c.mimeType).startsWith("image/")), imageParts.map((c) => c.mimeType).join(","));
check("D3.get_product_images.standard_hash", images.data?.standard_hash === EXPECTED_HASH, images.data?.standard_hash?.slice(0, 12));

// F. SKU gate, all three verdicts
const badSku = await call("prepare_product_v44", {
  product_id: PRODUCT,
  sku_resolution: {
    verdict: "VERIFIED_SKU",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: "536027557118233",
    evidence: [{ tier: 1, source_name: "Brand", url: "https://example.com/p", sku: "536027557118233", exact_entity_match: true }],
    conflicts: [], decision_note: "internal Product ID smuggled as SKU",
  },
});
check("F1.verified_sku.internal_id_rejected", badSku.isError === true, badSku.text);

const holdCase = await call("prepare_product_v44", {
  product_id: PRODUCT,
  sku_resolution: {
    verdict: "HOLD",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: null,
    evidence: [{ tier: 1, source_name: "Brand", url: "https://example.com/p", exact_entity_match: false }],
    conflicts: ["backend name and main image disagree on the colorway"],
    decision_note: "identity-critical conflict",
  },
});
check("F2.hold.rejected_before_bridge", holdCase.isError === true, holdCase.text);

const omit = await call("prepare_product_v44", {
  product_id: PRODUCT,
  operation: "auto",
  v44_facts: {
    consumer_product_name: "Chrome Hearts T-Shirt Black",
    decision_sentence: "This Chrome Hearts T-shirt comes in black with the cross logo on the front.",
    brand_internal_url: "https://www.dripsneakers.org/Chrome-Hearts-T-Shirts/",
    product_details_fifth: { label: "Graphic", value: "Cross Logo Front Print" },
  },
  sku_resolution: {
    verdict: "SKU_OMIT",
    exact_entity: { brand: "Chrome Hearts", model: "T-Shirt", product_type: "T-Shirt", colorway: "Black", collaboration_or_collection: null },
    sku: null,
    evidence: [{ tier: 1, source_name: "Chrome Hearts official", url: "https://example.com/ch", exact_entity_match: true }],
    conflicts: [],
    decision_note: "Exact Entity PASS; no Tier 1-4 source attaches an official SKU, omit per V4.4 §5",
  },
});
check("F3.sku_omit.prepare_ok", !omit.isError, omit.text);
const planId = omit.data?.data?.plan_id;
check("F3.sku_omit.plan_id_returned", typeof planId === "string", planId ?? `data=${JSON.stringify(omit.data?.data)?.slice(0, 200)}`);
check("F3.sku_omit.standard_hash_passthrough", omit.data?.data?.standard_hash === EXPECTED_HASH, omit.data?.data?.standard_hash?.slice(0, 12));
check("F3.sku_omit.validation_pass", omit.data?.data?.validation_status === "PASS", omit.data?.data?.validation_status);
check("F3.sku_omit.title_excludes_sku", omit.data?.data?.draft?.seo_title === "Chrome Hearts T-Shirt Black Reps | Drip Sneakers", omit.data?.data?.draft?.seo_title);

// G. prepare performed no write
check("G.prepare.not_executed", omit.data?.data?.executed !== true, `executed=${omit.data?.data?.executed}`);

// H. plan tamper guards through MCP
const badPlan = await call("execute_product_v44", { product_id: PRODUCT, plan_id: "plan_0000000000000000000000000000_deadbeef" });
check("H1.unknown_plan_rejected", badPlan.isError === true, badPlan.text);

const crossPlan = await call("execute_product_v44", { product_id: "536027552056603", plan_id: planId });
check("H2.cross_product_rejected", crossPlan.isError === true, crossPlan.text);

const exec = await call("execute_product_v44", { product_id: PRODUCT, plan_id: planId });
check("I1.execute_ok", !exec.isError, exec.text);
check("I1.execute_executed_flag", exec.data?.data?.executed === true, `executed=${exec.data?.data?.executed}`);
check("I1.execute_simulate_labelled", String(exec.data?.data?.execution?.save_status ?? "").includes("SIMULATED"), exec.data?.data?.execution?.save_status);

const duplicate = await call("execute_product_v44", { product_id: PRODUCT, plan_id: planId });
check("H3.duplicate_execute_rejected", duplicate.isError === true, duplicate.text);

const verify = await call("verify_product_v44", { product_id: PRODUCT, plan_id: planId });
check("I2.verify_ok", !verify.isError, verify.text);
check("I2.verify_reports_checks", Array.isArray(verify.data?.data?.checks), `checks=${verify.data?.data?.checks?.length}`);

const runStatus = await call("get_run_status", { run_id: "t-shirts-first-30-2026-09-01" });
check("D4.get_run_status", !runStatus.isError, runStatus.text);
check("D4.run_status_totals", (runStatus.data?.data?.total ?? 0) > 0, `total=${runStatus.data?.data?.total} published=${runStatus.data?.data?.published}`);

await client.close();

console.log(lines.join("\n"));
console.log(`\n# ${pass} passed, ${fail} failed, ${pass + fail} total`);
process.exit(fail === 0 ? 0 : 1);
