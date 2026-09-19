# AGENT CONTRACT V2.0 — CONFORMANCE AUDIT

**Date:** 2026-09-18
**Contract:** `standards/agent/AGENT_CONTRACT_V2.0.md`
**SHA-256:** `2bdeb72f2ca1edb1691141005bb413248eedbd8eecf078ada60d4e747551a1da`
**Branch:** `main` @ `b503d47` — no commit

---

## 1. Verdict

The contract is now archived and pinned. One clause is implemented as an
enforceable gate; six are not machine-enforceable yet; one materially changes a
decision this project was about to take.

The substantive change is that **V2.0 forbids the colourway decision taken for
Thom Browne**. See §4.

```text
tests/v2-contract.mjs    report-only bridge   18 / 18
                         enforcing bridge     20 / 20
```

---

## 2. What this contract is

V2.0 is a behaviour contract, not a data standard. It sits above V4.4:
V4.4 decides what a PDP must contain, V2.0 decides whether the agent is allowed
to produce one at all.

It binds two different parties, which matters for auditing:

| Party | Clauses | Enforced by |
|---|---|---|
| ChatGPT (research and vision) | §2, §5, §6, §7, §9, §14 | prompt only — nothing in this repository |
| The bridge and plugin (code) | §3, §4, §8, §10, §11, §12, §13 | code, tests |

A clause addressed to ChatGPT cannot be verified by a test suite. Those are
audited as gaps, not as failures, and the distinction is kept explicit
throughout.

---

## 3. Clause audit

| § | Requirement | State | Evidence |
|---|---|---|---|
| §0 | Agent identity; HOLD is a successful outcome | Contract | archived, hashed |
| §1 | Identity formula: Brand + Model + Type + Colorway + Graphic + Collection + SKU | **Partial** | `ExactEntitySchema` carries brand, model, product_type, colorway, collaboration; **graphic and single-item/set absent** |
| §2 | Observe → Search → Compare → Verify → Decide → Execute | ChatGPT-side | no code surface |
| §3 | State machine, no direct PASS | **Partial** | `WorkflowStage` × `AuditStatus` × `ReleaseStatus` covers every V2.0 state; **no explicit CANDIDATE transition** |
| §4 | Eighteen-field snapshot; four STOP conditions | **Implemented** | `V44SnapshotCompleteness.cs`, wirable to a halt by `requireCompleteSnapshot` |
| §5 | Vision output; visual colour ≠ official colourway | ChatGPT-side | `visual_observation` schema not modelled in code |
| §6 | Tier 1–7 search order; supplier is a candidate only | **Partial** | tiers 1–8 accepted; the *order* is not enforced, and tier 7 is not distinguishable from 8 |
| §7 | Eight-dimension entity match; conflict ⇒ HOLD | **Partial** | five dimensions modelled, no per-dimension match verdict recorded |
| §8 | SKU permitted / forbidden sets | **Implemented** | `V44SkuGate.cs`, `validation.ts`; internal Product ID rejected in test |
| §9 | Duplicate classification, four statuses | **Absent** | not implemented anywhere |
| §10 | SEO generation gated on `entity_status = PASS` | **Implemented** | HOLD blocks the plan; `hold_forbids_plan` |
| §11 | SEO-PDP output specification | **Implemented** | V4.4 composer + validator, locked by hash |
| §12 | Update Plan `changes[{field, old, new, evidence}]` | **Partial** | plan carries `proposed_changes` as field→new; **no `old`, no `evidence`** |
| §13 | Pre-publish checks; failure ⇒ ROLLBACK | **Implemented** | frontend verifier + `verify-v44`; rollback steps remain manual |
| §14 | Response shape: Decision / Evidence / Action Permission / SEO Payload | **Absent** | no machine-enforced response contract |
| §15 | Never write SEO before entity verification | **Implemented** | plan-based write; `execute` accepts only `product_id` + `plan_id` |

---

## 4. What V2.0 changes about Thom Browne

This is the part that matters.

The Phase 8.1 plan applied D1 as "drop the unverifiable token `Grown`, use the
descriptive colourway `Brown`". That was recorded as a recommendation with the
photograph as its basis.

V2.0 forbids it, in three places:

- §5 states that a visual colour must not be treated as the official colourway.
  `Brown` was derived from the product photograph, so it is a visual observation.
- §7 requires a Colorway Match and says a colour conflict resolves to HOLD.
- §2 and the closing conduct rules: never convert probability into fact.

The colourway evidence is a conflict, not an absence:

| Signal | Value |
|---|---|
| Backend name token | `Grown` — not a Thom Browne colourway |
| Product photograph | deep / chocolate brown |
| Sibling product `536027551814932` | named `Medium Brown`, photographs **light beige** |
| Tier 1–4 source for this exact entity | none found |

The sibling proves the backend's colour naming is unreliable for this model, so
the backend token cannot be trusted and the photograph cannot promote itself to
an official colourway. No dimension resolves.

Under V2.0 the correct output is therefore:

## Decision

```
HOLD
```

## Evidence

```
Confirmed:
- brand: Thom Browne (neck label, and the product photograph)
- product type: T-Shirt
- model: 4-Bar Stripe Jersey Stitch Tee
- graphic: white 4-Bar stripe on the left sleeve
- construction: fine-gauge knit, crew neck, ribbed hem and cuffs, side vents

Unconfirmed:
- official colourway name for this exact entity
- any Tier 1-4 source attaching a SKU to this exact entity

Conflict:
- backend name token 'Grown' matches no verified Thom Browne colourway
- visual colour is deep brown; the sibling product's own naming contradicts its
  own photograph, so backend colour naming is unreliable for this model
- the colourway dimension therefore cannot be resolved from available evidence
```

## Action Permission

```
FORBID_UPDATE
REQUEST_EVIDENCE
```

## SEO Payload

Withheld. §10 permits generation only on `entity_status = PASS`.

**Consequence for the project.** `plan_20260918T111039208_9c74fbbe` should not
be used. It was built on a colourway this contract classifies as a guess. The
Phase 8.1 NO-GO still stands, but it is no longer the binding reason: the entity
is unresolved, which stops the pipeline one stage earlier than the rollback gate
did.

---

## 5. What was implemented this pass

| File | Change |
|---|---|
| `standards/agent/AGENT_CONTRACT_V2.0.md` | New. The contract, archived and hashed. |
| `dripops/src/DripOps/Rules/V44/V44SnapshotCompleteness.cs` | New. Evaluates §4's eighteen-field read list and the four stop conditions. |
| `dripops/src/DripOps/Configuration/DripOpsConfig.cs` | `RequireCompleteSnapshot`. |
| `dripops/src/DripOps/Bridge/BridgeServer.cs` | `snapshot_completeness` on every read; `409 snapshot_incomplete` on prepare when enforced; `/health` reports the snapshot policy. |
| `dripops/config/dripops.json` | `requireCompleteSnapshot: false` — local sandbox, report-only. |
| `dripops/config/dripops.example.json` | `requireCompleteSnapshot: true` — production template conforms. |
| `tests/v2-contract.mjs` | New. 18–20 assertions depending on mode, plus the clause gaps. |

The §4 model is deliberately not a per-field boolean. §4 names four conditions
and one of them — "Current SEO Fields" — covers three separate values, so the
condition is carried per field and grouped afterwards. Flattening it would have
reported one failure as three.

### Current snapshot state

```text
missing stop conditions : seo_fields, variants
missing advisory        : current_sku, supplier_code, category, price,
                          inventory, key_description, image_alt, existing_schema
```

`seo_fields` is missing because the on-disk sandbox snapshot predates the SEO
capture fix from the previous pass; a live re-read would populate it.
`variants` has no reader at all and cannot be satisfied by any snapshot today,
which is why production enforcement is a switch rather than a default.

---

## 6. Gaps, in priority order

| # | Gap | Clause | Why it matters |
|---|---|---|---|
| 1 | No variants reader | §4 | The one stop condition that cannot be met. Blocks strict enforcement for every product. |
| 2 | No duplicate / variant classification | §9 | The sibling product `536027551814932` is a live instance of the exact case this clause governs, and nothing detects it. |
| 3 | Entity match is not per-dimension | §7 | Cannot distinguish "colourway unresolved" from "colourway matched" mechanically, so a conflict cannot be machine-detected. |
| 4 | Update Plan carries no `old` / `evidence` | §12 | The review gate cannot be produced from the plan alone; the `old` values are read separately. |
| 5 | No machine-enforced output contract | §14 | Decision, Evidence and Action Permission are conventions, not a schema. |
| 6 | Vision contract is unenforced | §5 | The visual/official colourway separation is the clause that would have caught the Thom Browne guess, and nothing in code enforces it. |
| 7 | No CANDIDATE transition | §3 | Cosmetic; the three-axis status already expresses the states. |

Gap 6 is the one that failed in practice. It is also the cheapest to close,
because the separation is a shape: the payload could carry
`visual_color` and `official_colorway` as distinct fields, with
`official_colorway` required to cite a Tier 1–4 source or be null.

---

## 7. Evidence

```powershell
$env:LOCAL_AGENT_TOKEN = "test-token-local-bridge"

# report-only
dotnet dripops/src/DripOps/bin/Release/net8.0/DripOps.dll serve `
  --config .sandbox/dripops.json --mode simulate
cd tests; $env:BRIDGE_BASE_URL="http://127.0.0.1:8811"; node v2-contract.mjs

# enforcing
dotnet dripops/src/DripOps/bin/Release/net8.0/DripOps.dll serve `
  --config .sandbox/dripops-enforce.json --mode simulate
cd tests; $env:BRIDGE_BASE_URL="http://127.0.0.1:8812"; node v2-contract.mjs
```

Regression: `workflow-e2e` 74/74, `bridge-acceptance` 54/54,
`p0-remediation` 17/17, `DripOps self-test` ok, `dotnet build` 0 warnings.

Artifacts: `reports/evidence/v2-contract/v2-conformance.json`.
