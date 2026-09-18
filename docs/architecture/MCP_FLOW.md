# MCP Tool Flow

The plugin exposes exactly **12 tools**. Two are marked destructive; there is no
delete tool.

## 1. PDP flow (implemented end to end)

```text
search_products
      ↓
get_product_context
      ↓
get_product_images          ← real MCP image content, for vision
      ↓
[ ChatGPT: web + image research ]
      ↓
Exact Entity + SKU verdict  (VERIFIED_SKU | SKU_OMIT | HOLD)
      ↓
prepare_product_v44         ← dry run, no write, returns plan_id
      ↓
[ human approval gate ]
      ↓
execute_product_v44         ← accepts only product_id + plan_id
      ↓
verify_product_v44          ← backend read-back + storefront acceptance
```

## 2. Tool reference

### Product / PDP — 6 tools

| Tool | Access | Bridge route | Purpose |
|---|---|---|---|
| `search_products` | read-only | `POST /api/chatgpt-mcp/products/search` | Find candidate products by name, model or Product ID. Product IDs returned here are internal identifiers and are never a public SKU. |
| `get_product_context` | read-only | `POST /api/chatgpt-mcp/products/read` | Full product snapshot: name, images, URL, status, current SEO fields, local evidence, `snapshot_hash`. |
| `get_product_images` | read-only | `POST /api/chatgpt-mcp/products/read` | Loads the actual product images and returns them as MCP image content so ChatGPT can verify colorway, graphics and collaboration details. |
| `prepare_product_v44` | read-only | `POST /api/chatgpt-mcp/products/prepare-v44` | Validates the SKU verdict, composes and validates the V4.4 draft, and returns an immutable `plan_id`. Does not write. |
| `execute_product_v44` | **write** | `POST /api/chatgpt-mcp/products/execute-v44` | Applies one prepared plan. Accepts only `product_id` and `plan_id` — arbitrary SEO fields are structurally impossible to send. |
| `verify_product_v44` | read-only | `POST /api/chatgpt-mcp/products/verify-v44` | Runs the existing frontend verifier plus the V4.4 placement audit. Requires the `plan_id` that produced the write. |

### Category / collection — 5 tools

| Tool | Bridge route | Status |
|---|---|---|
| `search_categories` | `/api/chatgpt-mcp/categories/search` | declared, **bridge deferred** |
| `get_category_context` | `/api/chatgpt-mcp/categories/read` | declared, **bridge deferred** |
| `prepare_category_seo` | `/api/chatgpt-mcp/categories/prepare-seo` | declared, **bridge deferred** |
| `execute_category_seo` | `/api/chatgpt-mcp/categories/execute-seo` | declared, **bridge deferred** |
| `verify_category_seo` | `/api/chatgpt-mcp/categories/verify-seo` | declared, **bridge deferred** |

Category pages are not PDPs. PDP-only rules (SKU, five Product Details, Product
schema) must not be forced onto them. The five routes are deferred until the PDP
path is proven in production; calling them currently returns 404 from the bridge.

### Batch — 1 tool

| Tool | Bridge route | Purpose |
|---|---|---|
| `get_run_status` | `GET /api/chatgpt-mcp/runs/status` | Persisted run progress, per-product stage, PASS / HOLD / failed counts. Use this for resumable jobs instead of relying on chat memory. |

## 3. Response envelope

Every tool result — success or failure — carries the standard identity:

```json
{
  "ok": true,
  "message": "…",
  "standard_version": "4.4",
  "standard_status": "FINAL — CONSOLIDATED 2026-09-17",
  "standard_hash": "5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8",
  "standard_file": "Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md",
  "data": {}
}
```

If the bridge reports a different `standard_hash`, stop: a plan created under one
standard revision must never be executed under another.

## 4. `prepare_product_v44` input shape

```json
{
  "product_id": "536027551768089",
  "sku_resolution": {
    "verdict": "SKU_OMIT",
    "exact_entity": {
      "brand": "Thom Browne",
      "model": "4-Bar Stripe Jersey Stitch Tee",
      "product_type": "T-Shirt",
      "colorway": "…",
      "collaboration_or_collection": null
    },
    "sku": null,
    "evidence": [
      { "tier": 1, "source_name": "…", "url": "https://…", "sku": null, "exact_entity_match": true, "notes": "…" }
    ],
    "conflicts": [],
    "decision_note": "…"
  },
  "v44_facts": {
    "consumer_product_name": "…",
    "decision_sentence": "…",
    "brand_internal_url": "https://www.dripsneakers.org/…",
    "product_details_fifth": { "label": "Graphic", "value": "…" }
  },
  "operation": "auto"
}
```

`v44_facts` is required whenever the deterministic composer cannot derive the
value on its own. A missing required field produces an explicit validation
failure — the bridge never guesses.

## 5. `execute_product_v44` guards

In order. The first failure stops the call.

```text
1. plan_id format valid                     → else 400 invalid_plan_id
2. plan exists                              → else 404 unknown_plan
3. plan.product_id == product_id            → else 409 plan_product_mismatch
4. plan not already executed                → else 409 plan_already_executed
5. plan.validation_status == PASS           → else 409 plan_not_validated
6. plan.standard_hash == active standard    → else 409 standard_hash_changed
7. declared standard_hash matches           → else 409 standard_hash_mismatch
8. recomputed snapshot_hash == plan value   → else 409 stale_plan
```

Only then does it call `MrshopplusClient.WriteAndSaveAsync`, followed by
`ReadSeoAsync` read-back and storefront verification.
