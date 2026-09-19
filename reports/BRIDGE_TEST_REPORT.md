# BRIDGE TEST REPORT

**Date:** 2026-09-18
**Scope:** Phase 3 — DripOps build, self-test, bridge route behaviour, guard
chain, and the execution-layer wiring. Read-only against production. No code
changed.

---

## 1. Verdict

**PASS for everything that can be verified without a live MrShopPlus session.**
Build, self-test, all six routes and the full guard chain verified. The
browser-driven execution path (`ChromeController` → `MrshopplusClient` →
`FrontendVerifier`) is wired and compiles, but was **not exercised live** — see
§6, which is the honest limitation of this report.

---

## 2. Build and self-test

```text
$ dotnet build .\src\DripOps\DripOps.csproj -c Release
已成功生成。
    0 个警告
    0 个错误

$ dotnet .\src\DripOps\bin\Release\net8.0\DripOps.dll self-test
{ "ok": true, "failures": [] }
```

The bridge is routed **before** `MachineStandard.Load`, so `serve` never touches
the 3.2 machine standard. Confirmed by reading the dispatch order in `Program.cs`
and by the bridge reporting only the V4.4 identity.

---

## 3. Route inventory

The bridge was started in simulate mode against a sandbox copy of two real run
directories.

```text
POST /api/chatgpt-mcp/products/search       200
POST /api/chatgpt-mcp/products/read         200
POST /api/chatgpt-mcp/products/prepare-v44  200
POST /api/chatgpt-mcp/products/execute-v44  200
POST /api/chatgpt-mcp/products/verify-v44   200
GET  /api/chatgpt-mcp/runs/status           200
GET  /health                                200
```

Non-existent routes return `404 unknown_route` — probed with `/products/delete`,
`/products/update` and `/execute`. No route exists that could delete, update
fields directly, or execute without a plan.

Authentication is enforced: a missing bearer token and a wrong bearer token both
return `401`.

---

## 4. Acceptance suites

| Suite | Scope | Result |
|---|---|---|
| `tests/bridge-acceptance.mjs` | 54 assertions over auth, standard pinning, all 6 routes, 3 SKU verdicts, plan tamper guards, stale-snapshot guard, prepare write-freedom | **54 / 54 PASS** |
| `tests/e2e-mcp.mjs` | 30 assertions over the real MCP server talking to the real bridge | **30 / 30 PASS** |
| `mcp-plugin` unit tests | 19 assertions incl. the standard-consistency suite | **19 / 19 PASS** |
| `npm run typecheck` | TypeScript compile | exit 0 |
| `npm run check-package` | manifest, tool surface, canonical hash | PASS |

---

## 5. Guard chain — verified behaviour

| Guard | Trigger used | Observed |
|---|---|---|
| Auth | no token | `401` |
| Auth | wrong token | `401` |
| Standard hash pinning | wrong declared hash | `409 standard_hash_mismatch` |
| Standard version | declared 3.2 | `409 standard_version_mismatch` |
| SKU gate | internal Product ID | `400 sku_gate_failed` |
| SKU gate | unsupported SKU assertion | `400 sku_gate_failed` |
| HOLD verdict | identity conflict | `409 hold_forbids_plan`, no plan |
| Unknown plan | fabricated `plan_id` | `404 unknown_plan` |
| Malformed plan id | `../../escape` | `400 invalid_plan_id` |
| Cross-product plan | plan of A used on B | `409 plan_product_mismatch` |
| Duplicate execute | same plan twice | `409 plan_already_executed` |
| Stale snapshot | snapshot mutated after prepare | `409 stale_plan` |
| Write-freedom of `prepare` | tree hash before/after | byte-identical |
| Write-freedom of simulated execute | tree hash before/after | byte-identical |

### 5.1 Write-freedom of `prepare` — measured, not asserted

`bridge-acceptance.mjs` walks the sandbox `state/runs` tree, hashes every file,
runs `prepare` (twice, on the SKU_OMIT and VERIFIED_SKU paths), re-walks, and
compares.

```text
PASS  prepare.no_write_to_shop_state :: state/runs tree unchanged (byte-identical)
PASS  prepare.mrshopplus_not_contacted :: no execution recorded
```

This holds because bridge audit events are written to
`data/bridge/events.jsonl`, not into the shop run directory. Only a real
`execute` may touch `data/runs/`.

### 5.2 Simulated execution is labelled

```text
save_status = "SIMULATED — MrShopPlus was NOT contacted"
readback_status = "SIMULATED"
frontend_status  = "SIMULATED"
```

A simulated run cannot be mistaken for a real write, and it leaves the run tree
byte-identical (asserted).

---

## 6. Execution-layer wiring — present but NOT exercised live

The chain required by the task is present in the codebase and compiles:

```text
ChromeController          dripops/src/DripOps/Browser/ChromeController.cs
        ↓                 EnsureChromeAsync / OpenPageAsync (CDP)
MrshopplusClient          dripops/src/DripOps/Browser/MrshopplusClient.cs
        ↓                 ReadProductAsync / WriteAndSaveAsync / ReadSeoAsync
FrontendVerifier          dripops/src/DripOps/Browser/FrontendVerifier.cs
        ↓                 VerifyAsync — HTTP status, H1, meta, canonical, noindex, JSON-LD
V44FrontendAuditor        dripops/src/DripOps/Rules/V44/V44FrontendAuditor.cs
                          Product Details ×5, Brand internal link, image-only Description,
                          ALT presence, banned wording, canonical
```

**What was verified:** the classes exist, compile, are referenced by the bridge's
live execution path, and `self-test` passes.

**What was NOT verified:** an actual browser session. This verification ran with
`--mode simulate`, so `ExecuteLiveAsync` was never entered. No Chrome instance was
launched, no MrShopPlus page was opened, and neither the DOM write sequence nor
the backend read-back performed a round trip.

Consequences:

- The DOM selectors in `MrshopplusClient` are unverified against the current
  MrShopPlus admin UI. A UI change would surface as a selector error at first
  live execution.
- Storefront acceptance (`FrontendVerifier`, `V44FrontendAuditor`) was exercised
  once, read-only, against the live storefront for the target product and
  correctly reported mismatches against a draft that has not been written yet
  (see the simulation report). That is a real, if narrow, confirmation that the
  verifier reaches the live site and evaluates real HTML.

This is a **P1** item in the gap report. It cannot be closed without a live
execution, which this task forbids.

---

## 7. Summary

| Requirement | Result |
|---|---|
| `DripOps self-test` passes | PASS |
| Build clean | PASS (0 warnings, 0 errors) |
| All 6 PDP routes respond | PASS |
| No delete / update / raw-execute route | PASS |
| Auth enforced | PASS |
| All 13 guards behave as designed | PASS |
| `prepare` provably write-free | PASS |
| Simulated execute provably write-free and labelled | PASS |
| Browser execution path wiring present | PASS |
| Browser execution path exercised live | **NOT VERIFIED** (out of scope for this phase) |
