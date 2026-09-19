# PRODUCTION READINESS REPORT

**Date:** 2026-09-18
**Repository:** `Kevin-hr/drip-seo-agent` @ `b503d47` (tag `v0.1.0`)
**Scope:** Phase 6 — final gate. Findings from the six preceding phases.

---

## System Status

# BLOCKED

The system is **not** ready for a live production write.

It is ready for a **human-approved single-product execution once three P0 items
are resolved**. Nothing in the verification found a safety control that failed;
the blockers are a URL-corruption hazard, a missing freshness guarantee, and one
unexercised code path.

---

## Completed

| Area | Evidence | Result |
|---|---|---|
| Repository freeze | `git status` clean, `main` @ `b503d47`, tag `v0.1.0` on the same commit, remote tracked, visibility PRIVATE | PASS |
| Standard pinning | canonical V4.4 hashes to the pinned value; both plugin and bridge compute it independently and agree | PASS |
| Standard negations | wrong hash → `409`; declared 3.2 → `409`; superseded document via `STANDARD_PATH` → **startup refused** | PASS |
| MCP tool surface | 12 tools, no delete, no field-update, no raw execute | PASS |
| Write boundary | execute accepts only `product_id` + `plan_id`; injected SEO fields ignored | PASS |
| SKU gate | internal Product ID, URL suffix, image filename, 15-digit numeric, `N/A`, `Unknown`, generated code all refused | PASS |
| HOLD verdict | `409 hold_forbids_plan`, no plan created | PASS |
| Plan immutability | tamper, cross-product, malformed id, duplicate, stale-snapshot, standard-hash guards all refuse | PASS |
| `prepare` write-freedom | sandbox tree byte-identical before/after | PASS |
| Simulated execute write-freedom | sandbox tree byte-identical; result labelled `SIMULATED` | PASS |
| DripOps build + self-test | 0 warnings, 0 errors; `{"ok": true, "failures": []}` | PASS |
| Bridge acceptance | 54 / 54 | PASS |
| MCP end-to-end | 30 / 30 | PASS |
| Plugin unit tests | 19 / 19 | PASS |
| Typecheck + package check | exit 0; PASS | PASS |
| Thom Browne simulation | full chain ran; payload valid; `SIMULATED_SUCCESS` | PASS (with blocker) |

---

## Failed

No test failed. Two items are **not verified** rather than failed:

| Item | Why | Consequence |
|---|---|---|
| Live browser execution path | This phase forbids a live write. `--mode simulate` never enters `ExecuteLiveAsync`. | The MrShopPlus DOM selectors are unverified against the current admin UI. A UI change will surface as a selector error on the first live run — the intended fail-safe behaviour, but unknown. |
| Category routes | Deliberately deferred until the PDP path is proven. | Five declared MCP tools return `404` from the bridge. |

Two **deviations** from the prescribed expectations were found and are recorded
rather than smoothed over:

1. SKU Case 2 (unsupported SKU assertion) was refused as `400 sku_gate_failed`
   instead of `HOLD`. The behaviour is stricter than prescribed and still refuses
   to write. Semantics need owner confirmation.
2. SKU Case 3 (supplier code) was refused for the tier reason, not because the
   gate recognised it as a supplier code. A follow-up probe showed the code passes
   the gate when backed by a Tier-2 record, and is then blocked by the V4.4
   content validator. Defence in depth held; the gate-level gap is real (P1-1).

One **test-harness defect** was found and is recorded: SKU Case 1 failed on its
first run because the probe paired a Nike entity with a Thom Browne product. The
validator correctly rejected it via `KD-06` (Brand anchor text must carry the real
brand name). The product was right; the test was wrong.

---

## Risks

| Risk | Likelihood | Impact | Mitigation status |
|---|---|---|---|
| **Live URL corrupted by a silent slug change** | High if executed as-is | High — indexed URL breaks, no 301 | **Unmitigated.** P0-1. |
| Snapshot agrees with itself but not with reality | Medium | Medium — plan built on stale data | **Unmitigated.** P0-2. |
| MrShopPlus DOM selector drift | Medium | Medium — first live run fails cleanly | Accepted; fails safe (P0-3). |
| A fabricated Tier 1–4 evidence record admits a bad SKU | Low | High — wrong SKU published | Partially mitigated; evidence rule is the control (P1-1). |
| A wrong write cannot be undone | Low | High | **Unmitigated.** No recovery procedure (P1-3). |
| Redirect never configured after a URL change | Medium | High | **Unmitigated.** No owner (P1-4). |

---

## Required Before Live Execute

### Blocking (all three must be closed)

1. **Resolve P0-1.** Either `prepare` with a fresh snapshot so the stability rule
   engages, **and/or** harden `DecideSlug` so an existing non-harmful slug is
   always treated as stable and any slug change forces `UrlChangeRequired = true`.
   Hardening is a code change and needs a separate, approved task.

2. **Resolve P0-2.** Define and enforce when a fresh live snapshot is mandatory
   before planning (recommended: always, for products whose storefront URL
   resolves).

3. **Fix the write scope decision for the target product** — see the checklist
   below. The plan cannot be approved while the URL decision is open.

### Recommended before the first write

4. Define a rollback procedure (the pre-write snapshot in `data/runs/` has the
   data; the steps are unwritten).
5. Assign ownership of the 301 lifecycle.
6. Confirm the `HOLD` vs `400` semantics for the unsupported-SKU case.

---

## Approval Checklist

Every line must be signed off before the first live execution.

### Decisions

- [ ] **D1. Colourway naming.** How to treat the unverifiable token `Grown`?
      (a) drop it, use the descriptive `Brown` · (b) `HOLD` the product ·
      (c) supply the official colourway name
- [ ] **D2. URL.** (a) keep the existing slug untouched · (b) migrate to a clean
      slug **with** a 301 planned at site level. Cannot be answered safely until
      P0-1 is closed.
- [ ] **D3. Write scope.** (a) SEO fields + Key Description + Schema only ·
      (b) also correct the Product Name (removes `Top Quality`)
- [ ] **D4. Harden the slug rule?** (a) yes, do it before executing ·
      (b) no, rely on a fresh snapshot plus human review
- [ ] **D5. Ratify Decision #006** (3.2 files retained inside the frozen codebase
      as build inputs for the historical CLI)

### Preconditions

- [ ] Target product confirmed: `536027551768089`
- [ ] `prepare` run with a **fresh live snapshot**; resulting `snapshot_hash`
      recorded
- [ ] Plan reviewed field by field against the simulation report
- [ ] A `prepare` **without** `execute` has been performed and the backend
      verified unchanged
- [ ] Supervised window agreed; no batch runs scheduled
- [ ] Storefront monitoring window agreed (the page is live and indexed)
- [ ] Rollback steps written down and understood

### After the write

- [ ] `verify-v44` returns `pass = true` with all checks green
- [ ] Backend read-back matches the draft (title, meta, keywords, slug)
- [ ] Non-SEO fields unchanged: price, inventory, images, collections, status,
      SKU, supplier data, Product ID
- [ ] If the URL changed: the old URL 301s directly to the new one, the new URL
      returns 200, canonical equals the new URL, no redirect chain
- [ ] Sitemap reflects the change
- [ ] Evidence recorded in `reports/`

---

## Recommendation

Do **not** run the live execution yet.

The pipeline is verified and every guard behaves as designed. The blocker is a
specific, reproducible URL-corruption hazard that fires on exactly this product
because its stored snapshot is stale about the published state — and this product
is also the one carrying a `Top-Quality` slug that V4.4 marks as noise, which is
precisely the situation where a slug change is most tempting and most dangerous.

Recommended sequence:

```text
1. Decide D1 / D3            (naming and write scope)
2. Close P0-2                (mandate a fresh live snapshot for prepare)
3. Re-run prepare on a fresh snapshot
4. Inspect the proposed slug against the live URL
      → if unchanged: proceed to P0-1 gate and execute
      → if changed: decide D2 and plan the 301 first
5. Execute one product, supervised
6. verify-v44, then frontend and backend confirmation
```

P0-3 can only be closed by step 5. Steps 1–4 remove the risk of step 5 doing
damage.
