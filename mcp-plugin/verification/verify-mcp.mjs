import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL("http://127.0.0.1:8000/mcp");
const client = new Client({ name: "drip-verify", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(url);

await client.connect(transport);

const listed = await client.listTools();
const names = listed.tools.map((t) => t.name).sort();
console.log("TOOL_COUNT=" + names.length);
console.log("TOOLS=" + names.join(","));

const destructive = listed.tools.filter((t) => t.annotations?.destructiveHint === true).map((t) => t.name);
console.log("DESTRUCTIVE=" + destructive.join(","));

// 1. read-only search
const search = await client.callTool({ name: "search_products", arguments: { query: "LV Footprint", status: "all", limit: 10 } });
console.log("SEARCH_isError=" + search.isError);
console.log("SEARCH_text=" + search.content?.[0]?.text);

// 2. SKU gate: forbidden internal Product ID
const gate = await client.callTool({
  name: "prepare_product_v44",
  arguments: {
    product_id: "536027557118233",
    sku_resolution: {
      verdict: "VERIFIED_SKU",
      exact_entity: { brand: "Louis Vuitton", model: "LV Footprint Soccer", product_type: "Sneaker", colorway: "Blue", collaboration_or_collection: null },
      sku: "536027557118233",
      evidence: [{ tier: 1, source_name: "Louis Vuitton", url: "https://example.com/lv", sku: "536027557118233", exact_entity_match: true }],
      conflicts: [],
      decision_note: "attempt to smuggle internal Product ID as SKU",
    },
  },
});
console.log("GATE_isError=" + gate.isError);
console.log("GATE_text=" + gate.content?.[0]?.text);
console.log("GATE_errors=" + JSON.stringify(gate.structuredContent?.data?.errors));

// 3. placeholder SKU
const gate2 = await client.callTool({
  name: "prepare_product_v44",
  arguments: {
    product_id: "536027557118233",
    sku_resolution: {
      verdict: "VERIFIED_SKU",
      exact_entity: { brand: "Nike", model: "AJ4", product_type: "Sneaker", colorway: "X", collaboration_or_collection: null },
      sku: "N/A",
      evidence: [{ tier: 1, source_name: "Brand", url: "https://example.com/p", sku: "N/A", exact_entity_match: true }],
      conflicts: [],
      decision_note: "placeholder",
    },
  },
});
console.log("GATE2_isError=" + gate2.isError + " errors=" + JSON.stringify(gate2.structuredContent?.data?.errors));

// 4. legit SKU -> should reach the local agent (mock)
const ok = await client.callTool({
  name: "prepare_product_v44",
  arguments: {
    product_id: "536027557118233",
    sku_resolution: {
      verdict: "VERIFIED_SKU",
      exact_entity: { brand: "Louis Vuitton", model: "LV Footprint Soccer", product_type: "Sneaker", colorway: "Blue", collaboration_or_collection: null },
      sku: "1A9DZK",
      evidence: [{ tier: 2, source_name: "StockX", url: "https://stockx.com/x", sku: "1A9DZK", exact_entity_match: true }],
      conflicts: [],
      decision_note: "same exact entity, tier-2 evidence carries identical sku",
    },
  },
});
console.log("PREPARE_isError=" + ok.isError);
console.log("PREPARE_data=" + JSON.stringify(ok.structuredContent?.data));

// 5. execute with unknown plan
const bad = await client.callTool({ name: "execute_product_v44", arguments: { product_id: "536027557118233", plan_id: "plan_does_not_exist" } });
console.log("EXEC_UNKNOWN_isError=" + bad.isError + " text=" + bad.content?.[0]?.text);

// 6. image loading (URL points to example.com, real fetch attempt)
const imgs = await client.callTool({ name: "get_product_images", arguments: { product_id: "536027557118233", max_images: 3 } });
console.log("IMAGES_isError=" + imgs.isError);
console.log("IMAGES_types=" + JSON.stringify(imgs.content.map((c) => c.type)));
console.log("IMAGES_text=" + imgs.content?.[0]?.text);
console.log("IMAGES_failures=" + JSON.stringify(imgs.structuredContent?.data?.failures ?? imgs.structuredContent?.data));

// 7. verify + run status passthrough
const verify = await client.callTool({ name: "verify_product_v44", arguments: { product_id: "536027557118233" } });
console.log("VERIFY_isError=" + verify.isError + " data=" + JSON.stringify(verify.structuredContent?.data));

// 8. delete tool must not exist
console.log("HAS_DELETE=" + names.some((n) => n.includes("delete")));

await client.close();
