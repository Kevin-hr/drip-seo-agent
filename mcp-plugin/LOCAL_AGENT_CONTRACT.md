# Local Agent bridge contract

> **Status: implemented.** The bridge ships as `DripOps serve`
> (`dripops/src/DripOps/Bridge/`). The 6 PDP routes below are live; the 5
> category routes are deferred until PDP is proven end to end.
> Run with `DripOps serve --config config/dripops.json --mode live`.
> Use `--mode simulate` to exercise every guard without contacting MrShopPlus.

The MCP server intentionally does **not** reimplement your existing MrShopPlus automation. It calls a narrow HTTP bridge on `LOCAL_AGENT_BASE_URL`.

All requests are JSON `POST` and include:

```http
Authorization: Bearer $LOCAL_AGENT_TOKEN
X-Drip-MCP-Version: 0.1.0
X-Drip-Standard-Version: 4.4
X-Drip-Standard-Hash: 5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8
Content-Type: application/json
```

Every body also carries `standard_version`, `standard_hash` and
`standard_file`. The bridge rejects the call with `409 standard_hash_mismatch`
if the declared hash differs from the standard it loaded, so a plan can never be
created or executed across two different standard revisions.

Map these default routes to the workflow you already have:

| Route | Required behavior |
|---|---|
| `/api/chatgpt-mcp/products/search` | Search Product ID/name/status. Read-only. |
| `/api/chatgpt-mcp/products/read` | Return complete product snapshot: name, images, URL, status, current SEO fields, supplier fields, local evidence. Read-only. |
| `/api/chatgpt-mcp/products/prepare-v44` | Consume ChatGPT Exact Entity/SKU verdict + evidence; run your current V4.4 generator/validator; create immutable `plan_id`; **do not write**. |
| `/api/chatgpt-mcp/products/execute-v44` | Accept only `product_id + plan_id`; re-check product/version/hash; run current MrShopPlus API/saveModify/publish flow. |
| `/api/chatgpt-mcp/products/verify-v44` | Run the same backend read-back + storefront acceptance checks already demonstrated in your LV Footprint Soccer run. |
| `/api/chatgpt-mcp/categories/*` | Equivalent category/collection read → prepare → execute → verify flow, using category rules instead of PDP-only V4.4 fields. |
| `/api/chatgpt-mcp/runs/status` | Return persisted batch progress/checkpoints from run.json/PROGRESS-style state. |

## Required prepare response

At minimum:

```json
{
  "plan_id": "plan_...",
  "product_id": "536...",
  "standard": "SEO-PDP V4.4",
  "validation": "PASS",
  "snapshot_hash": "sha256:...",
  "proposed_changes": {}
}
```

The local Agent should persist the exact plan payload. The execute route must reject unknown, expired, mismatched, or stale plans.

## Required execution rule

`execute-v44` must **not** accept arbitrary SEO fields. It accepts only an already-prepared `plan_id`. This is the principal server-side guardrail against ChatGPT/model drift.

## Existing acceptance behavior to preserve

Your current LV Footprint Soccer run already verifies HTTP 200, SEO title, H1, canonical, meta, Key Description block/5 items/brand link/one sentence, Description images + ALT, Schema name, forbidden/supplier noise, status and sitemap. Preserve those checks rather than creating a second verifier.
