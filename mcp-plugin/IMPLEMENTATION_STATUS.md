# Implementation status — Drip ChatGPT SEO Plugin v0.1.0

## Standard (authoritative)

- **Sole active SEO-PDP standard:** `Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md`
- **SHA-256:** `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8`
- SEO/PDP 3.2 and the superseded V4.4 `STANDARD_FINAL` are historical execution
  records only. Both are rejected outright; the superseded copies are parked in
  `rules/_superseded/` and `skills/drip-seo-executor/references/_superseded/`.
- The hash is computed at startup and travels with every tool result as
  `standard_version` / `standard_status` / `standard_hash` / `standard_file`.
  Set `STANDARD_EXPECTED_SHA256` to make startup fail closed on drift.

## Completed

- Streamable HTTP MCP endpoint at `/mcp` plus `/health` (which now reports the
  standard identity).
- 12 ChatGPT-facing product/category/batch tools.
- `get_product_images` returns real MCP image content for vision-based Exact
  Entity verification.
- Server-side SKU gate: rejects the 15-digit MrShopPlus Product ID, supplier /
  listing ID shapes, URL suffixes, image filenames, generated codes and the
  placeholders `N/A` / `Unknown` / `Pending` / `Not verified`.
- `VERIFIED_SKU` requires a Tier 1–4 record with `exact_entity_match=true` whose
  SKU equals the submitted SKU. `SKU_OMIT` requires `sku=null`. `HOLD` requires
  at least one identity-critical conflict and can never produce a plan.
- Write tools accept only `product_id + plan_id`. There is no
  `update_product(fields...)` surface anywhere.
- No delete tool is exposed.
- `src/standard.ts` pins the canonical document and refuses to load a
  historical standard.
- Local Agent bridge contract and mock Agent.
- Verification tooling under `verification/`: `verify-mcp.mjs` (tool surface +
  SKU gate), `verify-ssrf.mjs` (14 SSRF cases), `e2e-mcp.mjs` (30 assertions
  against the real DripOps bridge).

## Local Bridge (implemented in DripOps)

The bridge now exists as `DripOps serve`. See `dripops/README.md` §8.

- 6 PDP routes implemented; the 5 category routes are deliberately deferred.
- Decision layer is a new V4.4 rules package
  (`Rules/V44/V44Standard.cs`, `V44Composer.cs`, `V44Validator.cs`,
  `V44SkuGate.cs`, `V44FrontendAuditor.cs`). It shares no rules with the 3.2
  `SeoPdpComposer` / `SeoPdpValidator`, because 3.2 mandates a verified SKU
  while V4.4 §5/§5A permits publishing with the SKU omitted.
- Reuses the existing, already-proven execution path:
  `ChromeController` → `MrshopplusClient.WriteAndSaveAsync` / `ReadSeoAsync` →
  `FrontendVerifier`, extended by `V44FrontendAuditor` for V4.4 placement checks.
- Immutable plans in `data/bridge/plans/`. Execute re-verifies product match,
  plan existence, not-yet-executed, validation PASS, `standard_hash` unchanged
  and `snapshot_hash` unchanged.
- `prepare` writes only to `data/bridge/`. It leaves `data/runs` byte-identical,
  which the acceptance tests assert.
- `--mode simulate` exercises the entire guard chain without contacting
  MrShopPlus and labels the result `SIMULATED` so it cannot be mistaken for a
  real write.

## Verification performed

- `npm run typecheck` — PASS
- `npm test` — 19/19 PASS
- `npm run check-package` — PASS (12 tools, canonical hash verified)
- `dotnet build` — 0 warnings, 0 errors
- `DripOps self-test` — PASS (no regression to the existing CLI)
- Bridge acceptance over a copy of real run data, simulate mode — 54/54 PASS
- MCP → Bridge end-to-end — 30/30 PASS

## Not yet done

- **A live single-product `execute` has not been run.** It would publish
  fabricated test facts to the live store, so it is intentionally withheld. See
  the acceptance report for the exact preconditions.
- Category routes (`search_categories` through `verify_category_seo`) are
  proxied but the bridge has no implementation behind them yet.
- `mcp.json` still contains the placeholder host; a public HTTPS endpoint (or a
  Secure MCP Tunnel for development) is required before ChatGPT can connect.
