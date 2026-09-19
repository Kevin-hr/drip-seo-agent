# PRE-WRITE REVIEW GATE — THOM BROWNE 536027551768089

**Date:** 2026-09-18
**Plan:** `plan_20260918T111039208_9c74fbbe`
**Bridge:** `--mode simulate`, read-only with respect to MrShopPlus
**Evidence:** `reports/evidence/pre-write-gate/`

---

## 1. Verdict

# NO-GO

Three blockers. None of them is the plan itself — the plan builds and validates
PASS. The blockers are the conditions around it.

| # | Blocker | Where it comes from |
|---|---|---|
| 1 | The MrShopPlus admin session is expired, so no fresh live snapshot can be read. | Runtime |
| 2 | The rollback baseline scores **70 / 100** against a 90 threshold. | Missing readers |
| 3 | The write selectors have never been exercised against the live admin UI. | Unverified since P0-3 |

The plan can be reviewed field by field today. It cannot be executed until 1 and
2 are cleared.

---

## 2. Blocker 1 — admin session expired

```text
POST /api/chatgpt-mcp/products/read { "live": true }
502  live_read_failed
     Cause: Mrshopplus login is required in the dedicated DripOps Chrome profile.
            Log in once, then rerun the command.
```

Diagnosed live. Chrome launched against the DripOps profile, CDP connected, and
the browser settled on:

```text
url   = https://www.mrshopplus.com/#/login
title = 用户登录 - Mrshopplus
```

The profile at `dripsneakers/dripops/dist/data/chrome-profile` holds a 40 KB
cookie store with 34 `mrshopplus` entries, but the session behind them is no
longer valid, so the SPA's auth guard redirects to the login route.

**Configuration finding.** `dripops/config/dripops.json` sets
`chromeProfileDirectory: "data/chrome-profile"`, which resolves to
`drip-seo-agent/data/chrome-profile` — a path that does not exist. Any live run
started from this repository would have launched a brand-new, unauthenticated
Chrome rather than the authenticated profile. The working profile is the one
under `dripsneakers/dripops/dist/`. The Phase 8.1 config used for this gate
points at it explicitly.

**Latency finding.** The first attempt took 51.3 s and reported only that the
backend "did not return a snapshot". The cause was that
`EnsureAuthenticatedAsync` read `location.href` immediately after navigation,
racing the SPA's auth guard: the check passed while the session was already dead,
and the failure surfaced as a full-length timeout on a selector that could never
appear. Fixed in this pass — the browser is now watched for whichever appears
first, the form control or the login route. Same failure, **5.7 s**, with the
cause in the response body.

**Resolution:** log in to MrShopPlus once in the DripOps Chrome window. The
profile persists the session, and `live: true` then works.

---

## 3. Blocker 2 — rollback baseline is incomplete

Scored against the weights in `PHASE_8_1_SAFE_WRITE_PLAN.md` §3.2.

| Category | Weight | Captured | Source |
|---|---|---|---|
| Product identity | 10 | yes | admin snapshot |
| URL | 10 | yes | admin snapshot |
| Description | 15 | yes | admin snapshot |
| Images | 10 | yes | admin snapshot |
| SEO fields | 15 | yes | admin snapshot, SEO dialog |
| Publish state | 5 | yes | admin snapshot |
| Schema | 5 | yes | storefront, via bridge verify |
| **Price** | **10** | **no** | **no reader in the stack** |
| **Inventory** | **10** | **no** | **no reader in the stack** |
| **Collections** | **10** | **no** | **no reader in the stack** |

```text
score = 70 / 100
G1  (score >= 90)                  FAIL
G2  (every written field has a
     pre-write value)              PASS
VERDICT                            NO-GO
```

G2 passes, which is the gate that actually protects the write: every field this
plan will overwrite has a recorded pre-write value, so all of them can be
restored. G1 fails because three fields the plan will *not* touch have no
reader, so their pre-write state cannot be recorded automatically.

The distinction matters. A failure of G2 would mean the plan could destroy
something it cannot restore. A failure of G1 means the blast radius cannot be
measured — if the write perturbs price, inventory or collection membership, there
is nothing on file to compare against.

**Resolution:** either add readers for those three fields, or record them by hand
as part of the pre-write snapshot and accept that the recorded values are manual.

---

## 4. Blocker 3 — write selectors unverified

Unchanged from P0-3. The read half of the client contract is proven against the
live UI; the write half is not, and cannot be proven without saving. Every
selector fails closed, so the expected failure mode is an exception rather than a
misdirected click. The first live write remains the first test of the write DOM
contract and should be treated as such.

---

## 5. The plan, field by field

Ready for sign-off. Values are the exact contents of
`plan_20260918T111039208_9c74fbbe`.

| Field | Proposed value | Sign-off |
|---|---|---|
| Product Name | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown` | |
| SEO Title | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown Reps \| Drip Sneakers` | |
| Meta Description | `Shop Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.` | |
| Keywords (5) | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown`, `Thom Browne 4-Bar Stripe Jersey Stitch Tee Reps`, `Brown T-Shirt`, `Designer T-Shirts`, `Thom Browne T-Shirt` | |
| Key Description | one sentence + exactly 5 `<li>` fields | |
| Image ALT | 11 entries | |
| Description | images only, no text body | |
| **Slug** | `Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown` — **unchanged** | |
| **Canonical** | `https://www.dripsneakers.org/Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown` — **unchanged** | |
| **`url_change_required`** | **`false`** | |
| **`redirect_from`** | **`null`** | |
| **Publish on execute** | **not requested** (`publish = url_change_required`) | |
| Schema | `Product` with `name`, `brand: Thom Browne`, `category`, `color`; **no `sku`** | |
| Validation | **PASS** — no ERROR findings | |

The three warnings the plan carries:

| Code | Meaning | Action |
|---|---|---|
| `URL-01` | The live slug is title-cased and violates the pattern. Recorded as a WARN because this plan does not change the URL. | Belongs to the Phase 8.2 migration pass. |
| `ALT-02` | Image ALT is generic (`… Product Image N`). V4.4 §21 wants Product Name + view/detail. | Supply specific view labels before publishing. |
| `URL-11` | Backend reports `is_published = false` for a product whose storefront page resolves. The flag is not trusted for URL decisions. | Read live to confirm the true publish state. |

---

## 6. D1 and D3

The plan above applies the recommended values, which remain unconfirmed:

| # | Decision | Applied | Status |
|---|---|---|---|
| D1 | Name token `Grown` → descriptive `Brown` | `Brown` | **Unconfirmed** |
| D3 | Correct the Product Name in the same write | corrected | **Unconfirmed** |
| D2 | URL migration | out of scope for Phase 8.1 | deferred |

Sign-off on §5 constitutes the D1 and D3 decision.

---

## 7. What unblocks the write

| Order | Action | Owner |
|---|---|---|
| 1 | Log in to MrShopPlus once in the DripOps Chrome window | Operator |
| 2 | Re-run the gate so the plan is built on a live snapshot | Automated |
| 3 | Record price, inventory and collections by hand, or add readers | Operator / engineering |
| 4 | Confirm D1 and D3 against §5 | Operator |
| 5 | Re-run until the verdict reads GO | Automated |
| 6 | Execute, supervised, single product | Operator |

Until then the write stays blocked. The gate is doing what it exists to do: it
refused a write whose blast radius could not be measured.

---

## 8. Reproduce

```powershell
$env:LOCAL_AGENT_TOKEN = "test-token-local-bridge"
dotnet dripops/src/DripOps/bin/Release/net8.0/DripOps.dll serve `
  --config .sandbox/dripops-live-read.json --mode simulate

cd tests
$env:BRIDGE_BASE_URL = "http://127.0.0.1:8811"
node pre-write-gate.mjs
```

Artifacts: `01-local-snapshot.json`, `01-live-snapshot.json`, `02-plan.json`,
`03-execute-simulated.json`, `04-verify.json`, `05-baseline-and-gates.json`,
`06-plan-contract.json`, `99-gate-result.json`.
