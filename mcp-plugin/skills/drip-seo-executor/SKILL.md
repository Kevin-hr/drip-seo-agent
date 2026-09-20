---
name: drip-seo-executor
description: Execute Drip Sneakers product PDP SEO and category-page SEO through the connected Drip SEO MCP app. For PDPs, resolve Exact Entity and SKU using ChatGPT web/image research before preparing a V4.4 plan; then execute only immutable validated plans and verify the result.
---

# Drip SEO Executor

Use the connected `drip-seo-executor` MCP tools as the execution layer. ChatGPT is the research/reasoning layer; the existing local Agent is the MrShopPlus execution and acceptance-test layer.

The authoritative PDP standard is `references/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`. Do not silently replace it with generic SEO advice.

Sole authority rule:

- `Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md` is the only active SEO-PDP standard.
- SEO/PDP 3.2 and the superseded V4.4 `CLEAN_CONSOLIDATED_2026-09-17` revision are historical execution records only. They must never be used as a decision layer, and 3.2 in particular contradicts V4.4 on SKU (3.2 requires a verified SKU; V4.4 allows `SKU_OMIT`).
- Every prepare / plan / execute / verify result carries `standard_version` and `standard_hash`. If the hash returned by the local bridge differs from the plugin's own hash, stop and report; do not execute.

## PDP workflow

1. Call `search_products` to locate the exact MrShopPlus candidate set. If observed counts differ from the user's expectation, report the measured set; do not invent or drop candidates.
2. Call `get_product_context` for each target. Treat MrShopPlus/Supplier Product ID, platform Schema `sku`, URL suffixes, image filenames, listing IDs, and supplier codes as internal identifiers unless independently verified as the exact public SKU/style code.
3. Call `get_product_images` whenever visual identity/colorway/graphics matter. Inspect the returned MCP image content; do not treat image filenames as identifiers.
4. Resolve Exact Entity before SEO. Use ChatGPT web search, image understanding, and high-authority evidence. Source order: brand/authorized retailer → StockX → GOAT → established structured retailer → vertical retailer → marketplace → supplier → image-only.
5. SKU verdict must be exactly one of:
   - `VERIFIED_SKU`: an explicit SKU/style code is attached to the same exact entity by strong evidence. Do not infer from sibling colorways or numbering patterns.
   - `SKU_OMIT`: exact entity can PASS but no exact SKU can be independently verified.
   - `HOLD`: identity-critical evidence conflicts or exact entity cannot be locked.
6. For `VERIFIED_SKU`, provide the same SKU in at least one Tier 1–4 evidence record with `exact_entity_match=true`. For `SKU_OMIT`, pass `sku=null`. For `HOLD`, do not prepare or execute a publish-ready PDP.
7. Call `prepare_product_v44`. This is a dry run. Inspect its validation result and proposed diff. Do not bypass it.
8. If the user requested execution and the plan PASSes, call `execute_product_v44` with the returned `plan_id` and matching `product_id`. Never send arbitrary fields directly to the write tool.
9. Call `verify_product_v44` after every write. A completed task requires backend read-back plus storefront acceptance, not merely a successful save response.
10. For batch work, use `get_run_status` and persisted run IDs/checkpoints. Do not rely on chat memory for completion counts.

## V4.4 hard rules relevant to research

- SEO starts only after Exact Entity PASS.
- Verified SKU exists → use it. Verified SKU does not exist → omit it completely.
- Never emit `SKU: Unknown`, `Pending`, `N/A`, or a supplier/internal identifier as SKU.
- Public SEO identity fields exclude supplier/batch wording and prohibited gender/sizing-class tokens unless a later explicit exception exists in the authoritative standard.
- Key Description = one concise verified sentence + exactly five Product Details fields; Brand carries a real verified internal link.
- Backend Description = product detail images only.
- Existing correct live URLs are stable by default; migrate only for identity/identifier/supplier-noise/ambiguity/broken-slug reasons defined by V4.4.

## Category/collection workflow

Category pages are not PDPs. Use `search_categories` → `get_category_context` → research → `prepare_category_seo` → `execute_category_seo` → `verify_category_seo`.

Do not force PDP-only fields such as product SKU, five Product Details, single-product colorway, or Product schema onto a category page. Keep page-type rules separate.

## Safety / anti-corruption rules

- Never use `execute_product_v44` or `execute_category_seo` without a plan returned by the matching prepare tool.
- Never substitute Product ID for SKU even if the storefront Schema currently exposes Product ID in an `sku` field.
- If exact entity or SKU evidence remains conflicting, HOLD that item and continue other independent items when appropriate.
- Do not delete products or categories. This plugin intentionally exposes no delete tool.
