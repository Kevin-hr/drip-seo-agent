# Production Read-Only Reconciliation — 2026-10-09

## Decision

**NO-GO. Do not start any new production batch writes.**

The deterministic repository baseline is healthy, but the live reconciliation found confirmed storefront reachability failures, field drift, systemic template defects, and an unreliable published-manifest selection rule.

Online writes performed by this audit: **0**.

## Evidence summary

### Repository baseline

- Canonical V4.4 SHA-256: PASS
- MCP tests: 19/19 PASS
- Core conformance: 93/93 PASS
- Prada pack conformance: 59/59 PASS
- DripOps build and self-test: PASS
- T-Shirts lessons regression: PASS
- Prada case regression: PASS

### Published-manifest integrity

- Raw records classified as `success === true`: 2,986
- Records missing a target URL: 1,536
- Records with a target URL, plan source, backend readback, and matching save receipt: 1,273
- Primary contamination source: `minimal-run/execution-results.json` (1,518 records without target URLs)

The raw `success === true` rule is not sufficient evidence that a product was published and verified.

### Live product verification

- Strict manifest: 1,273 products
- PASS: 1,227
- Deterministic field FAIL: 37
- Non-verifiable after the initial run and an isolated retry: 9
  - Stable HTTP 404: 7
  - Stable redirect loops: 2
- Successfully rendered pages: 1,264
- Product schema emits internal Product ID as SKU: 1,264/1,264
- More than one H1: 1,264/1,264

Failed-check totals among the 37 rendered failures:

- SEO title mismatch: 37
- Meta description mismatch: 37
- Canonical mismatch: 32
- H1 mismatch: 9

### Confirmed reachability failures

HTTP 404:

1. `536027310782224` — `/29-for-2nd-pair-a-bathing-ape-bape-sta-low-white-grey`
2. `536027310717727` — `/29-for-2nd-pair-a-bathing-ape-bape-sta-low-white-orange`
3. `536027310651676` — `/29-for-2nd-pair-a-bathing-ape-bape-sta-low-white`
4. `536027310538770` — `/29-for-2nd-pair-a-bathing-ape-bape-sta-low-black`
5. `536027310490650` — `/29-for-2nd-pair-a-bathing-ape-bape-sta-patent-leather-white-blue`
6. `536027310409752` — `/29-for-2nd-pair-a-bathing-ape-bape-sta-low-grey-black`
7. `536027310364177` — `/29-for-2nd-pair-a-bathing-ape-bape-sta-white-black`

Redirect loops:

1. `536027060726042` — `/nike-air-force-1-mid-flax`
2. `536027047677461` — `/nike-air-force-1-low-fragment-clot-white`

### Category reconciliation

- Sitemap categories: 188 (previously 187)
- ZERO: 38
- NONZERO: 150
- UNKNOWN: 0
- New category: `/Stussy/` with 186 results
- Categories whose count changed: 24
- Large observed shifts:
  - `/BEST-SELLERS/`: 123 → 2,280
  - `/Sneakers-Under-100/`: 2,620 → 1,344
  - `/New-Arrivals/`: 30 → 125

The 38 empty categories remain unresolved.

## Unique P0

**Restore or deliberately redirect the nine confirmed unreachable published URLs, then repeat backend and storefront readback before lifting the production freeze.**

Availability outranks metadata and structured-data quality. The 37 rendered field drifts, manifest rule defect, schema SKU defect, duplicate H1 defect, and category-count drift remain queued behind this P0.

## Exit criteria for P0

1. Each of the nine product IDs is reconciled against the current backend record.
2. Every intended live product resolves in one redirect or fewer to HTTP 200.
3. Final H1 and canonical identify the correct product.
4. Unintended/unpublished products have an explicit disposition instead of a redirect loop.
5. Browser verification returns 9/9 PASS with zero UNKNOWN.
6. No unrelated product fields are changed.

