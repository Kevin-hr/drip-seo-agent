# FINAL P0 REMEDIATION REPORT

**Date:** 2026-09-18
**Branch:** `main` @ `b503d47` (no commit made — changes are in the working tree)
**Scope:** Phase 7 — resolve the P0 blockers from `PRODUCTION_READINESS_REPORT.md`
before the first live MrShopPlus write.

**No live execute. No production mutation. No commit.**

---

## 1. Verdict

# P0 BLOCKERS RESOLVED

| ID | Blocker | Status |
|---|---|---|
| P0-1 | URL stability — silent replacement of an indexed production URL | **FIXED** |
| P0-2 | Snapshot freshness — planning against arbitrarily old data | **FIXED** |
| P0-3 | Live execution safety check — browser path never exercised | **READ PATH VERIFIED, WRITE PATH MAPPED** (cannot be more without a write) |

The URL blocker is removed: a URL change on an existing product can no longer be
reported as requiring no change. It is now always explicit, always carries a
recorded redirect source, and always raises a warning.

---

## 2. Changed files

### Modified

| File | Change |
|---|---|
| `dripops/src/DripOps/Rules/V44/V44Composer.cs` | `DecideSlug` rewritten — the published flag is no longer consulted; an existing non-harmful slug is kept verbatim; a differing slug always forces `UrlChangeRequired = true`. Added `IsSameSlug` and `HasHarmfulSlugToken`. |
| `dripops/src/DripOps/Bridge/BridgeServer.cs` | Snapshot-age guard (`409 stale_snapshot_requires_refresh`); `live: true` now forces a backend refresh on both `read` and `prepare`, failing with `502 live_read_failed` rather than falling back to a stale checkpoint; `URL-10` / `URL-11` warnings. |
| `dripops/src/DripOps/Configuration/DripOpsConfig.cs` | New `SnapshotMaxAgeHours` (default 24, `0` disables). |
| `dripops/config/dripops.json` | `"snapshotMaxAgeHours": 24`. |
| `dripops/config/dripops.example.json` | `"snapshotMaxAgeHours": 24`. |
| `tests/bridge-acceptance.mjs` | Re-stamps its sandbox fixtures as freshly captured so the new freshness guard is satisfied. Sandbox only. |

### Added

| File | Purpose |
|---|---|
| `tests/p0-remediation.mjs` | 17 assertions covering P0-1 (4 cases) and P0-2 (6 assertions). |

### Report files (untracked)

`P0-1_URL_STABILITY_REPORT.md`, `P0-2_SNAPSHOT_FRESHNESS_REPORT.md`,
`LIVE_EXECUTION_READINESS_CHECK.md`, `FINAL_P0_REMEDIATION_REPORT.md`.

**No production logic outside the two P0 fixes was touched.** No V5 migration, no
unrelated refactor.

---

## 3. Tests added

`tests/p0-remediation.mjs` — 17 assertions, all passing.

### P0-1 — URL stability (4 cases, 11 assertions)

| Case | Input | Expected | Result |
|---|---|---|---|
| CASE-1 | real product with a harmful existing slug (`Top-Quality-…`) | change flagged, `redirectFrom` = old URL, `URL-10` present | PASS |
| CASE-2 | controlled clean slug, no migrate flag | slug kept verbatim, no change, no redirect | PASS |
| CASE-3 | controlled clean slug, `migrate_url: true` | change flagged, `redirectFrom` = old URL | PASS |
| CASE-4 | invariant over all three plans | differs ⇒ flagged; identical ⇒ not flagged | PASS (0 violations) |

### P0-2 — Snapshot freshness (6 assertions)

| Assertion | Result |
|---|---|
| Aged snapshot (384 h) refused with `409 stale_snapshot_requires_refresh` | PASS |
| Aged snapshot produces no plan | PASS |
| Refusal message states the measured age | PASS |
| Fresh snapshot allowed | PASS |
| Fresh snapshot creates a plan | PASS |
| New PDPs with no storefront URL are not age-gated | PASS |

### Regression — everything else still green

| Suite | Result |
|---|---|
| `dotnet build` | 0 warnings, 0 errors |
| `DripOps self-test` | `{"ok": true, "failures": []}` |
| `npm run typecheck` | exit 0 |
| `npm test` | 19 / 19 |
| `npm run check-package` | PASS |
| `tests/bridge-acceptance.mjs` | 54 / 54 |
| `tests/e2e-mcp.mjs` | 30 / 30 |
| `tests/p0-remediation.mjs` | 17 / 17 |

---

## 4. Before / after behaviour

### P0-1 — same product, same input

| | Before | After |
|---|---|---|
| existing slug | `Top-Quality-Thom-Browne-…-Grown` | same |
| proposed slug | `thom-browne-…-brown` | same |
| `url_change_required` | **`false`** | **`true`** |
| `redirect_from` | **`null`** | **`https://www.dripsneakers.org/Top-Quality-Thom-Browne-…-Grown`** |
| warnings | `[ALT-02]` | `[ALT-02, URL-10, URL-11]` |
| live outcome if executed | indexed URL replaced, no 301, undetected | change explicit, redirect source recorded, surfaced at the review gate |

### P0-2 — same product, aged snapshot

| | Before | After |
|---|---|---|
| 384-hour-old snapshot | accepted silently | **`409 stale_snapshot_requires_refresh`**, no plan |
| `live: true` with an existing checkpoint | ignored | forces a backend refresh; `502` if it fails |
| failure mode of a live read | n/a | refuses to fall back to stale data |

### P0-3 — browser path

| | Before | After |
|---|---|---|
| Chrome / CDP / login | unverified | **verified live** (read-only) |
| read selectors | unverified | **verified live** |
| write selectors | unverified | still unverified — cannot be tested without writing |

---

## 5. Simulation re-run after remediation

Target `536027551768089`, bridge in `--mode simulate`:

```text
prepare status      = 200
validation_status   = PASS
url_change_required = true
redirect_from       = https://www.dripsneakers.org/Top-Quality-Thom-Browne-…-Grown
seo_title           = Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown Reps | Drip Sneakers
warnings            = [ALT-02, URL-10, URL-11]
execute             = 200, "SIMULATED — MrShopPlus was NOT contacted"
```

**SIMULATED_SUCCESS, and the URL blocker is removed**: the plan no longer claims
that no URL change is required while changing the URL.

---

## 6. Remaining risks

| # | Risk | Severity | Status |
|---|---|---|---|
| R1 | **Write selectors unverified.** The first live run is also the first test of the MrShopPlus DOM contract. | Medium | Accepted. Fails closed — a missing selector throws and stops rather than clicking blindly. Mitigation: supervise the run, expect selector mismatch as the most likely failure. |
| R2 | **A URL migration needs a site-level 301.** The bridge records `redirectFrom`; nothing configures or verifies the redirect. | High if the migration is accepted | **Open — decision D2.** No component owns the 301 lifecycle. |
| R3 | **No rollback procedure.** Pre-write values are recorded in the plan and in `data/runs/`; the recovery steps are unwritten. | High | **Open.** P1, unchanged by this phase. |
| R4 | SKU gate has no supplier-code content detection beyond structural shapes. | Low | Unchanged. The V4.4 content validator catches known supplier tokens; the Tier 1–4 evidence rule remains the real control. |
| R5 | `snapshotMaxAgeHours` trusts the snapshot's own timestamp. | Low | Accepted. Signing snapshots is out of scope. |
| R6 | 187 products carry a harmful slug token and will now all raise `URL-10`. | Medium | By design — that is the fix. But it means the migration policy is now a portfolio decision, not a single-product one. |
| R7 | `mcp.json` still has a placeholder host. | Medium | Unchanged. Required before ChatGPT can connect at all. |
| R8 | Category routes declared but unimplemented. | Low | Unchanged, deliberate deferral. |

### R2 and R6 together are now the largest remaining item

P0-1 exposed that 187 products have migration-triggering slugs. The fix makes each
one explicit, but there is still no owner for the 301 lifecycle. Deciding D2 for
one product without a policy for the other 186 would create an inconsistent
storefront.

---

## 7. What must happen before the first live write

1. **Decide D1** — how to treat the unverifiable name token `Grown`.
2. **Decide D2** — keep the existing URL, or migrate with a 301. Note R2/R6: the
   portfolio implication should be considered together with the single-product
   case.
3. **Decide D3** — whether the write also corrects the Product Name.
4. **Run `prepare` with `live: true`** so the plan is built on a fresh snapshot.
5. **Complete the review gate** — check the plan field by field, confirm the
   `URL-10` warning is understood and the 301 position is agreed.
6. **Write down the rollback steps.**
7. **Execute one product, supervised.**
8. **Verify** — `verify-v44` plus backend read-back, plus confirmation that price,
   inventory, images, collections, status, SKU, supplier data and Product ID are
   unchanged. If the URL changed: old URL 301s directly to the new one, new URL
   returns 200, canonical equals the new URL, no redirect chain.

---

## 8. Constraints observed

| Constraint | Status |
|---|---|
| No live execute | **Observed** — bridge ran in `--mode simulate` throughout |
| No production mutation | **Observed** — all writes went to sandbox copies; the live read was read-only |
| No commit | **Observed** — HEAD is still `b503d47`; all changes are in the working tree |
| No V5 migration | **Observed** |
| No unrelated refactor | **Observed** — only the two P0 fixes, their config, and tests |
