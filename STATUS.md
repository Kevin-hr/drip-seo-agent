# STATUS

**Last verified:** 2026-09-23
**Repository:** Drip SEO Agent
**Branch:** `main`

## Current truth

- V4.4 remains the bridge/runtime standard; SHA-256 `965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7`.
- The consolidated V4.5 standard is packaged and verified; SHA-256 `224429ed857dbaf909e9dcb6f0c615001d621d1c5e98cf5d1783aafbdb07dbb1`.
- Prada Phase 5, Prada P0 remediation, Prada preflight lessons, and the Hellstar V4.4 playbook are integrated into `main`.
- All remote development branches except the superseded V5.1 plan are ancestors of `main`.
- Offline verification is green: MCP 19/19, Core 93/93, Prada Pack 59/59, DripOps build/self-test, T-Shirts and Prada regressions.
- The first real MrShopPlus V4.5 Canary has been published, corrected and fully verified.
- Batch publication is user-authorized as of 2026-09-23, but only PASS products may be written; VERIFY and HOLD remain fail-closed.

## P0 remediation in this branch

- Added GitHub Actions CI for the deterministic offline suites.
- Changed the default execution mode to `simulate` and enforced complete snapshots.
- Added admin-form readers for price, inventory, collections, variants, SKU, supplier code, and category.
- Included the new rollback fields in the immutable snapshot hash and pre-write score.
- Replaced the MCP placeholder with the local development endpoint.
- Made zero-byte evidence fatal and removed the known empty non-evidence file from the pinned manifest.
- Recorded the historical V5.1 evidence-layer branch as superseded.

## External / live prerequisites

These cannot be claimed complete from repository tests:

1. Log into MrShopPlus in `dripops/data/chrome-profile`.
2. Perform a fresh live read and confirm all new form readers resolve the current UI.
3. Exercise the write selectors with one supervised canary.
4. Re-run the pre-write gate against that fresh live snapshot; require `GO`.
5. Verify backend read-back, storefront output, non-target fields, and rollback evidence.

The Canary is complete. Batch execution must start from a fresh live reconciliation,
preserve per-product backups, require single-target save receipts, and perform
backend/storefront readback before counting a product as delivered.

## Production safety maintenance

- The supervised first-write procedure is documented in
  [docs/operations/production-checklist.md](docs/operations/production-checklist.md).
- The scheduled `Daily maintenance health check` workflow verifies the canonical
  V4.4 SHA, clean checkout state, deterministic tests, and open issues.
- Canary evidence is recorded in
  [reports/V4.5_CANARY_536027542763285_REPORT.md](reports/V4.5_CANARY_536027542763285_REPORT.md).
- The V4.5 Description policy accepts only independent detail images; main-gallery
  URL overlap is a hard failure, and no independent detail images means an empty Description.
