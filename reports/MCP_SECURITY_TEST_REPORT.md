# MCP SECURITY TEST REPORT

**Date:** 2026-09-18
**Scope:** Phase 2 — MCP tool surface, write boundary, and SKU gate (four
prescribed cases plus structural probes). Read-only. No code changed.

---

## 1. Verdict

**PASS with two recorded deviations** from the prescribed expectations. The write
boundary holds and no unsafe tool exists. Two of the four SKU cases did not
behave exactly as the task expected; the differences are analysed in §4 and are
conservative rather than unsafe.

---

## 2. Tool surface

### 2.1 Discovered tools (12)

```text
search_products              prepare_product_v44        search_categories
get_product_context          execute_product_v44        get_category_context
get_product_images           verify_product_v44         prepare_category_seo
get_run_status                                          execute_category_seo
                                                        verify_category_seo
```

Verified by a real MCP handshake: `TOOL_COUNT=12`. `package check` independently
asserts the same 12 names from source.

### 2.2 Forbidden tools — confirmed absent

| Forbidden capability | Present? | Evidence |
|---|---|---|
| `update_product(any_fields)` | **No** | not in the tool list; no `update` route in the bridge (`404 unknown_route`) |
| `delete_product()` / `delete_category()` | **No** | no tool name containing `delete` anywhere in the server source |
| `unsafe_execute()` / raw write | **No** | no `/execute` route (`404 unknown_route`); the only write route requires a plan |

### 2.3 Allowed capabilities

| Capability | Tool | Boundary |
|---|---|---|
| Produce a plan | `prepare_product_v44` | read-only; returns an immutable `plan_id` |
| Validate a plan | enforced inside `prepare` (returns `validation_status`) and re-checked by `execute` | a plan that is not `PASS` can never execute |
| Execute a plan | `execute_product_v44` | accepts **only** `product_id` + `plan_id` |

### 2.4 Write boundary — live probe

An execution attempt carrying injected SEO fields:

```text
POST /api/chatgpt-mcp/products/execute-v44
{ "product_id": "536027551768089", "plan_id": "…",
  "seo_title": "INJECTED", "meta_description": "INJECTED", "slug": "injected" }

→ HTTP 200
→ draft.seo_title unchanged from the plan
→ draft.slug unchanged from the plan  (did NOT become "injected")
```

The extra fields are structurally ignored. There is no code path by which a
caller can name an SEO field on the write route.

---

## 3. SKU gate — prescribed cases

| Case | Prescribed | Observed | Verdict |
|---|---|---|---|
| 1. Valid SKU + entity match | PASS | PASS (plan created, `validation_status=PASS`) | matches, after correcting the test input — see §4.1 |
| 2. Fake SKU | HOLD | `400 sku_gate_failed` | **deviation** — see §4.2 |
| 3. Supplier SKU | REJECT | `400 sku_gate_failed` | matches, but for a different reason than assumed — see §4.3 |
| 4. Product ID used as SKU | REJECT | `400 sku_gate_failed`, reason `MrShopPlus internal Product ID` | matches |

No plan was created in any of the refused cases.

### 3.1 Case 1 — accepted

```text
seo_title = "Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown MJS245A-06017-210 Reps | Drip Sneakers"
meta      = "Shop Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown reps (MJS245A-06017-210)
             at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping."
schema    = { "@context": "https://schema.org", "@type": "Product",
              "name": "Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown",
              "brand": { "@type": "Brand", "name": "Thom Browne" },
              "category": "T-Shirt", "color": "Brown",
              "sku": "MJS245A-06017-210" }
warn      = ALT-02 (generic image ALT)
```

The SKU appears exactly once in the title, once in the meta, and is present in
the schema. No duplication.

---

## 4. Deviations, analysed honestly

### 4.1 Case 1 first attempt failed — the validator was right, the test was wrong

The first run of Case 1 returned `409 v44_validation_failed`, not PASS. Captured
checks:

```json
[{ "code": "KD-06", "severity": "ERROR",
   "message": "The Brand anchor text must carry the real brand name; found 'Nike'." }]
```

Cause: the probe paired a **Nike** entity with a **Thom Browne** product and a
Thom Browne brand URL, so the Brand row rendered `Nike` as anchor text pointing at
`/Thom-Browne/`. `KD-06` correctly rejected the contradiction.

This is a defect in the test input, not in the product. Re-running with a
self-consistent entity produced a valid plan. It is recorded here because a QA
report that silently drops a failed first attempt is worthless.

### 4.2 Case 2 — refused as `400 sku_gate_failed`, not `HOLD`

Prescribed: `HOLD`. Observed: hard gate failure
(`VERIFIED_SKU requires at least one Tier 1-4 source that explicitly attaches the
same SKU to the exact entity`).

Assessment: **more conservative than prescribed, and correct.** `HOLD` in V4.4
means "identity-critical evidence conflicts, do not publish". A SKU the model
asserts with no supporting evidence is not a conflict — it is an unsupported
assertion, which the gate rejects outright. Both outcomes refuse to write. The
structural difference is that a `HOLD` verdict can be revisited once the conflict
is resolved, whereas this must be resubmitted with real evidence.

**Action requested:** confirm the intended semantics. If `HOLD` is genuinely
wanted for the unsupported-assertion case, that is a behaviour change and falls
outside this verification task.

### 4.3 Case 3 — rejected for the wrong reason (residual gap)

The supplier code `PKGOD-TB-4BAR` was rejected, but the recorded reason was the
**tier requirement** — the evidence supplied was tier 7 (supplier catalogue), and
only tiers 1–4 qualify. The gate did **not** recognise the string as a supplier
code.

Follow-up probe — the same supplier code backed by a claimed Tier-2 record:

```text
sku = "PKGOD-TB-4BAR", evidence tier 2, exact_entity_match = true
→ SKU gate: PASSED (gate_errors empty)
→ V4.4 content validator: 409 v44_validation_failed
     KW-S1   SEO Keywords contains supplier/marketing wording banned by V4.4 §6: 'pkgod'
     META-S1 Meta Description contains supplier/marketing wording banned by V4.4 §6: 'pkgod'
     KD-S1   Key Description contains supplier/marketing wording banned by V4.4 §6: 'pkgod'
```

**The write was still blocked**, by a different layer: the SKU propagates into
keywords, meta and the fifth Product Details field, and `pkgod` is on the
forbidden-wording list. Defence in depth worked.

**Residual gap:** the SKU gate has no supplier-code *content* detection beyond
fixed structural shapes. A supplier code that contains no banned token and does
not match a structural pattern — for example `TB4BAR-B12` — would pass the gate
and be written. The real control remains the Tier 1–4 evidence requirement.
Classified **P1** in the gap report; not a blocker because it requires the model
to fabricate a Tier 1–4 record, which is the threat the evidence rule exists to
address.

---

## 5. Structural SKU probes

| SKU value supplied | Outcome | Reason returned |
|---|---|---|
| `/air-jordan-11-retro-blue` | BLOCKED | URL suffix or path fragment |
| `t_shirt_1E3164571A713.jpeg` | BLOCKED | image filename |
| `418932770517528` | BLOCKED | bare long numeric identifier (supplier / listing ID shape) |
| `536027551768089` | BLOCKED | MrShopPlus internal Product ID |
| `N/A` | BLOCKED | placeholder value |
| `Unknown` | BLOCKED | placeholder value |
| `GEN-88213` | BLOCKED | generated code |
| `pkgod` | gate passed, then content validator blocked it | supplier wording in generated fields |

Deliberately **not** rejected: short pure-numeric style codes. Nike base codes are
frequently all digits (`528895`, `528895-153`), and `528895-153` is a
production-verified SKU. Shape checks stop at the unambiguous cases; the evidence
requirement carries the rest.

---

## 6. Summary

| Requirement | Result |
|---|---|
| No `update_product(any_fields)` | PASS |
| No `delete_product()` / `delete_category()` | PASS |
| No `unsafe_execute()` | PASS |
| Plan-based write only | PASS |
| Arbitrary SEO fields on the write route are ignored | PASS |
| SKU gate refuses internal Product ID | PASS |
| SKU gate refuses placeholders / URL suffixes / filenames / generated codes | PASS |
| SKU gate refuses unsupported SKU assertions | PASS (as `400`, not `HOLD` — deviation documented) |
| Supplier-code content detection | **GAP (P1)** — mitigated by the content validator |
