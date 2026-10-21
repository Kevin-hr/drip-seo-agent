# Drip Sneakers SEO-PDP V5.0 Migration — Staged / Fail-Closed

Date: 2026-10-21
Target repository: `Kevin-hr/drip-seo-agent`
Base: `main`
Head: `codex/seo-pdp-v5-migration-20261021`
Status: DRAFT CANDIDATE; **no production V5 write routes activated**

## Objective

Add the V5.0 (V4.6-compatible) operational contract, offline/preview gates, a new pinned loader, a V5 DripOps validation layer, a preview Agent Skill, and regression tests; preserve the existing V4.4 live bridge and its SHA-pinned immutable plans.

## Exact source artifact

`standards/V5.0/Drip_Sneakers_SEO-PDP_V5.0_STANDARD_FINAL.md`
SHA-256 `72263e2cefb63e50de74be1bc0e40aa6a3ed06a3e7b55bc72eb9f4b662d6a172`.
Full V4.6 text is appended as a historical compatibility baseline. Its original SHA-256 is `af2269fa5a3d93561bb671ec05a9eb40e3958ddc4f055d69a809c1769c30a016`.

## Acceptance stages

| Stage | Scope | Release condition |
|---|---|---|
| M0 | Preserve main + record old V4.4 hash | No writes to main |
| M1 | Create feature branch + V5 document, read-only TS and C# loaders | SHA / source identity tests PASS |
| M2 | Implement preview gates for visual identity, set/sku, meta, slug, canonical, internal links | Negative regression tests PASS |
| M3 | Test V4.4 unchanged in CI, verify no V5 write tools enabled | Existing CI and new preview CI PASS |
| M4 | Engineer **V5-specific immutable plan schema**, prepare/execute/verify routes, snapshot/standard hashes; separate gated PR | Not implemented in this preview payload |
| M5 | Run simulation and single-product canary with readback and 360px/768px interactive checks | Await owner approval and evidence |
| M6 | Production activation | Separate explicit owner approval; never implicit merge |

## Why M4 is explicitly deferred

V4.4 production bridge accepts `product_id` + immutable `plan_id` and pins standard SHA. Replacing its loader with V5 documentation alone would cause mismatch/rejection or silently skip new rules. V5 requires new purchase-variant and evidence contracts, as well as frontend auditing. This preview cannot create a publish-ready V5 plan and **must not claim full production execution readiness**.

## Validation status (2026-10-21)

- The V4.4 production standard loader and its 4.4 regression tests remain unchanged.
- V5 is loaded independently and pinned to an exact document SHA; no historical standard or unreviewed modifications accepted.
- No V5 execute route or UI writes exist in this migration candidate.
- No SKU based on old URL/image filenames, no component SKU passed off as set SKU.
- `URL Slug` is slug-only; `Canonical` is full URL; brand link must be live-verified and relative (`/Chanel/` for Chanel).
- Key Description contains one sentence + exactly 5 Details, Description images-only after crawlability evidence.
- Validated `PASS` is a *preview result* and does not authorize publish.
- Local MCP validation passed: TypeScript typecheck, 32/32 repository tests (including 13 V5 preview regressions), and package check.
- Local DripOps validation passed on .NET 8: Release build with 0 warnings/0 errors, existing self-test, and 14 V5 acceptance assertions.
- All three bundled V5 standard copies match SHA-256 `72263e2cefb63e50de74be1bc0e40aa6a3ed06a3e7b55bc72eb9f4b662d6a172`; the appended V4.6 source matches its recorded SHA-256.
- `.gitattributes` pins all three V5 Markdown copies to LF so their SHA-256 identity is stable on Windows and Linux checkouts.
- Repository API authorization reports branch push and pull-request write access. Draft PR #4 was created successfully, and its two existing `CI / verify` checks plus the new `V5.0 migration preview / preview` check passed on 2026-10-21.

## Expected PR title

`draft: stage SEO-PDP V5.0 migration (V4.6 compatible; production V4.4 pinned)`

## Remaining promotion blockers

1. V5 immutable plan, write-path and storefront verifier migration require a separate reviewed follow-up PR.
2. Simulation and a single-product canary with backend readback plus storefront verification have not been run.
3. Explicit owner approval is required before merging this Draft PR or activating any V5 production path.
