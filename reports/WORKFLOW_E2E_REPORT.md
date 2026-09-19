# WORKFLOW END-TO-END REPORT

**Date:** 2026-09-18
**Branch:** `main` @ `b503d47` — no commit, all changes are in the working tree
**Bridge:** `--mode simulate`, `127.0.0.1:8811`, config `.sandbox/dripops.json`
**Suite:** `tests/workflow-e2e.mjs` — **74 assertions, 74 passed, 0 failed**

No live write. No MrShopPlus mutation. No commit.

---

## 1. Verdict

The pipeline now runs end to end on a real product, from discovery through
storefront verification, with every node producing a checkable artifact.

```
WORKFLOW_E2E_PASS   74 / 74 assertions   7 recorded gaps
```

Running it for the first time was the point: the previous reports described a
chain that had been verified node by node in isolation. Executing the whole
chain surfaced six defects that no single-node check could see.

---

## 2. What running the workflow exposed

### 2.1 URL-01 made the safe-write mode unreachable

The Phase 8.1 plan assumed that "keep the existing URL and fix the SEO fields"
was expressible. It was not. `V44Validator` applied the slug pattern check to
the draft unconditionally, and the live slug
`Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown` is title-cased,
so every safe-write plan failed with:

```text
URL-01  ERROR  Slug 'Top-Quality-...-Grown' violates the lowercase ASCII pattern.
```

The consequence was structural, not cosmetic: the validator was gating a
pre-existing storefront condition as if the plan were proposing it. Every legacy
slug in the catalogue is title-cased, so the mode P0-1 exists to protect was
impossible to validate.

Fixed by narrowing URL-01 to the slug the plan actually proposes. When a plan
changes no URL and carries the product's existing identifier verbatim, the
finding is recorded as a WARN instead of an ERROR.

### 2.2 The snapshot was never a complete rollback baseline

`ReadProductAsync` populated name, subtitle, description, slug, publish flag and
images. It left `ExistingSeoTitle`, `ExistingSeoKeywords` and
`ExistingMetaDescription` at their defaults — permanently empty.

`PlanStore.ComputeSnapshotHash` includes those three fields, so the hash that
guards against baseline tampering was being computed over three always-empty
values. Fixed by reading the SEO dialog in the same browser session and failing
the live read outright if it cannot be read, rather than returning a baseline
with a silent hole in it.

### 2.3 `keep_existing_slug` did not exist

`HasHarmfulSlugToken` matches `top-quality`, so the composer derived a clean
slug for this product regardless of operator intent. There was no way to express
"leave the URL alone". Added `V44Facts.KeepExistingSlug` with a short-circuit
that is checked before every other slug rule.

### 2.4 Publish was hard-coded

`ExecuteLiveAsync` called `WriteAndSaveAsync(draft, publish: true, ...)`. A safe
write would have flipped a product's visibility as a side effect of an SEO
correction — a scope the review gate never approved. Publish is now derived from
`draft.UrlChangeRequired`.

### 2.5 A computed Product Name produced `Tee T-Shirt`

With only `exact_entity` supplied, `ComposeProductName` concatenates
Brand + Collaboration + Model + Product Type + Colorway, giving:

```text
Thom Browne 4-Bar Stripe Jersey Stitch Tee T-Shirt Brown
```

`V44Facts.ConsumerProductName` already exists and takes precedence. The run now
supplies it, and the resulting name and slug are correct. The blind
concatenation is worth knowing about: the `exact_entity` fields are a resolution
record, not a naming template.

### 2.6 The harness cannot read the storefront

`fetch()` from Node against `www.dripsneakers.org` fails with `ECONNRESET` while
`Invoke-WebRequest` returns `200` with 212,036 bytes from the same machine, and
the bridge's own `HttpClient` retrieves the page during verification. The
storefront half of the baseline is therefore taken through the bridge, and the
harness limitation is recorded rather than silently skipped.

### 2.7 Pre-existing: `verify-ssrf.mjs` cannot run

```text
ERR_MODULE_NOT_FOUND: .../tests/src/images.js
```

The suite imports `./src/images.js`; `tests/src/` has never existed in the
repository. `git log` shows the file was committed at the initial freeze with
that import, so it has been un-runnable since `b503d47`. Unrelated to this work
and not repaired here — repairing it silently would hide that the SSRF surface
has had no coverage.

---

## 3. Code changes

| File | Change |
|---|---|
| `dripops/src/DripOps/Rules/V44/V44Models.cs` | `V44Facts.KeepExistingSlug` added. |
| `dripops/src/DripOps/Rules/V44/V44Composer.cs` | `DecideSlug` short-circuits to the existing slug when `KeepExistingSlug` is set; checked before `MigrateUrl`. |
| `dripops/src/DripOps/Rules/V44/V44Validator.cs` | `Validate` takes the existing slug; URL-01 becomes a WARN when the plan does not change the URL and the slug is the unchanged one. |
| `dripops/src/DripOps/Bridge/BridgeServer.cs` | Live snapshot reads the SEO dialog and refuses a partial baseline; `Validate` receives the existing slug; `publish` derives from `UrlChangeRequired`; a failed live read now reports its cause in the 502 response instead of only on stderr. |
| `dripops/src/DripOps/Browser/MrshopplusClient.cs` | `WaitForAuthenticatedFormAsync` replaces three racy post-navigation checks. A dead session is now detected in 5.7 s with a precise message instead of timing out after 51.3 s on a selector that can never appear. |
| `tests/workflow-e2e.mjs` | New. 74 assertions across 13 nodes, writes one artifact per node. |
| `tests/pre-write-gate.mjs` | New. Builds the Phase 8.1 plan and evaluates the rollback completeness gates. |

`dotnet build` reports 0 warnings, 0 errors.

---

## 4. Node-by-node deliverables

All artifacts are written to `reports/evidence/workflow-e2e/`.

| Node | What it does | Artifact | Result |
|---|---|---|---|
| 1 | Service identity, standard pinning, auth | `n1-health.json` | PASS 7/7 |
| 2 | Discovery over local checkpoints | `n2-search.json` | PASS 3/3 — 230 scanned, 2 hits |
| 3 | Snapshot read | `n3-read.json` | PASS 7/7 — hash `ae7c127f…`, 11 images |
| 3b | Baseline: description, images, slug, SEO, publish state | `n3b-snapshot-baseline.json` | PASS 6/6 — description 8,392 bytes |
| 3c | Baseline gaps and storefront probe | `n3c-storefront-baseline.json` | 1 PASS, 5 gaps |
| 4 | SKU verdict gates | `n4-sku-gate-reject.json`, `n4-hold-blocks.json` | PASS 3/3 |
| 5 | Compose + validate, migration path | `n5-plan-migration.json` | PASS 12/12 |
| 5b | Compose + validate, safe-write path | `n5b-plan-keep-url.json` | PASS 4/4 |
| 6 | Execute guards | in `workflow-summary.json` | PASS 3/3 |
| 7 | Execute, simulate | `n7-execute-simulated.json`, `n7-execute-simulated-keep-url.json` | PASS 7/7, 2 gaps |
| 8 | Storefront verification, both plans | `n8-verify-migration.json`, `n8-verify-keep-url.json` | PASS 8/8 |
| 9 | Run status | `n9-run-status.json` | PASS 2/2 — 200 products |
| 10 | Snapshot freshness gate | `n10-stale-snapshot.json`, `n10-fresh-snapshot.json` | PASS 3/3 |
| 11 | Immutable plan store on disk | `n11-plan-on-disk.json` | PASS 5/5 |
| — | Run summary | `workflow-summary.json` | index of all artifacts |

Key values from this run:

```text
product_id      536027551768089
run_id          t-shirts-candidate-pool-2026-09-02
snapshot_hash   ae7c127f9d0161d767a2a3be6f10b200481cef7400231fad32b073b65adb3df2
plan migration  plan_20260918T104027138_938925f8
plan keep-url   plan_20260918T104027164_bfd3bb20
standard        4.4  5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8
```

---

## 5. The 8.1 / 8.2 split, verified rather than asserted

Both plans were built from the same snapshot with the same research payload, and
they diverge exactly where the split requires.

| | Migration (8.2) | Safe write (8.1) |
|---|---|---|
| slug | `thom-browne-4-bar-stripe-jersey-stitch-tee-brown` | `Top-Quality-Thom-Browne-…-Grown` |
| canonical | new URL | existing live URL |
| `url_change_required` | `true` | `false` |
| `redirect_from` | old URL recorded | `null` |
| validation | PASS | PASS |
| publish on execute | true | false |
| verify target | URL that does not exist yet | URL that is already live |

The verification difference is the substantive one. The migration plan's
verification fails at the transport layer:

```text
FRONTEND-02 HTTP_STATUS  Frontend returned 404.
FRONTEND-EXCEPTION       Response status code does not indicate success: 404 (Not Found).
```

The safe-write plan's verification resolves against the live page. No transport
failure is raised, the canonical matches, and the JSON-LD block is found. Only
content checks remain:

```text
FRONTEND-03 H1_MISMATCH
FRONTEND-05 META_MISMATCH
FE-02 PRODUCT_DETAILS_MISSING
FE-03 PRODUCT_DETAILS_LIST_MISSING
FE-08 IMAGE_ALT_MISSING
FE-09 FORBIDDEN_TERM  x4
EXEC-01  WARN
```

Those are the correct pre-write findings: nothing has been written, so the page
still carries the old H1, the old metadata and the old wording. The four
`FORBIDDEN_TERM` findings are the auditor detecting the live page's existing
`top-quality`, `1:1` and `Replica` text — the baseline the write is meant to
remove. In 8.1 mode the storefront half of verification is therefore meaningful
before the write exists, which is what makes a pre-write rehearsal worth doing.

---

## 6. Regression matrix

| Suite | Before | After |
|---|---|---|
| `dotnet build` | 0 warnings, 0 errors | 0 warnings, 0 errors |
| `DripOps self-test` | `{"ok": true, "failures": []}` | unchanged |
| `npm run typecheck` | pass | pass |
| `npm test` | 19 / 19 | 19 / 19 |
| `npm run check-package` | PASS, 12 tools | PASS, 12 tools |
| `tests/bridge-acceptance.mjs` | 54 / 54 | 54 / 54 |
| `tests/e2e-mcp.mjs` | 30 / 30 | 30 / 30 |
| `tests/p0-remediation.mjs` | 17 / 17 | 17 / 17 |
| `tests/workflow-e2e.mjs` | did not exist | 74 / 74 |
| `tests/verify-ssrf.mjs` | broken since `b503d47` | broken since `b503d47` |

The URL-01 narrowing was the change most likely to regress P0-1, so that suite
matters here: it still passes 17/17, including the invariant that a slug change
on an existing product is never silent.

---

## 7. What was not fixed

| # | Not fixed | Why it matters |
|---|---|---|
| 1 | Price, inventory and collection membership have no reader in the stack. | The pre-write baseline cannot be completed automatically for these three. Any rollback of them is manual, and the completeness gate in `PHASE_8_1_SAFE_WRITE_PLAN.md` cannot reach 100% without a human recording them. |
| 2 | JSON-LD is not in the snapshot; it is only obtainable from the storefront. | Baseline schema must be captured as a separate storefront read, and only through the bridge. |
| 3 | Write selectors and the SEO dialog save flow remain unmapped against the live admin UI. | Unchanged from P0-3. The first live write is still the first test of the write DOM contract. |
| 4 | The `publish` inference is unproven. | It lives in `ExecuteLiveAsync`; simulate mode never reaches it. Only a live write exercises it. |
| 5 | `verify-ssrf.mjs` remains un-runnable. | Pre-existing. The SSRF surface has no coverage. |
| 6 | The composer still concatenates `exact_entity` into a Product Name when `consumer_product_name` is absent. | The caller contract is now documented as required, but a caller that omits it silently gets `Tee T-Shirt`. |
| 7 | D1, D2 and D3 in `PHASE_8_1_SAFE_WRITE_PLAN.md` remain undecided. | Unchanged. The workflow runs; the business decisions are still open. |

---

## 8. Evidence commands

```powershell
# build and unit surface
dotnet build dripops/src/DripOps/DripOps.csproj -c Release
dotnet dripops/src/DripOps/bin/Release/net8.0/DripOps.dll self-test

cd mcp-plugin
npm run typecheck
npm test
npm run check-package

# bridge, sandbox, simulate
$env:LOCAL_AGENT_TOKEN = "test-token-local-bridge"
dotnet dripops/src/DripOps/bin/Release/net8.0/DripOps.dll serve `
  --config .sandbox/dripops.json --mode simulate

# cross-component suites
cd tests
$env:BRIDGE_BASE_URL = "http://127.0.0.1:8811"
$env:BRIDGE_SANDBOX  = "<repo>\.sandbox"
node workflow-e2e.mjs
node bridge-acceptance.mjs
node p0-remediation.mjs

# MCP end to end
cd ../mcp-plugin
$env:PORT="8001"; $env:LOCAL_AGENT_BASE_URL="http://127.0.0.1:8811"
npm start
cd ../tests; $env:MCP_URL="http://127.0.0.1:8001/mcp"; node e2e-mcp.mjs
```

The run summary, including the full assertion log, is at
`reports/evidence/workflow-e2e/workflow-summary.json`.

---

## 9. Next actions

1. Decide D1 and D3 so the safe-write plan can be reviewed field by field.
2. Add readers for price, inventory and collections, or accept explicitly that
   the baseline for them is manual.
3. Repair or delete `verify-ssrf.mjs`.
4. Require `consumer_product_name` in the caller contract, or change the
   composer so an absent value cannot produce a redundant product type.
5. Run Phase 8.1 for real, single product, supervised — only after D1 and D3 are
   settled and the review gate has been completed.
6. Update `STATUS.md` after the first live execution.
