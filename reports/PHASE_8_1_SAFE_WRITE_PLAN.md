# PHASE 8.1 — SAFE WRITE PLAN (SEO Fields Only)

**Date:** 2026-09-18
**Scope:** First live write — split into two phases. Phase 8.1 validates the
write mechanism by modifying SEO fields only. Phase 8.2 performs the URL
migration as a separate, gated operation.
**Status:** DOCUMENT ONLY — no live execution attempted.

---

## 0. Executive Summary

The first live write is split to reduce risk:

| Phase | What changes | What does NOT change | Gate |
|---|---|---|---|
| 8.1 | Product Name, Description HTML, SEO Title, Meta, Keywords, Image ALTs, Schema | Slug, Canonical, Publish status, Price, Inventory, Collections | Pass 8.1 verify → enter 8.2 |
| 8.2 | Slug, Canonical, Publish status, 301 redirect | Everything else (already done in 8.1) | Pass 8.2 verify → batch |

**Phase 8.1 proves the write selectors work and the SEO content is correct,
without touching the URL. If the write fails, the URL is still intact and no
301 is needed.**

### Relationship to LIVE_FIRST_EXECUTION_PLAN.md

This document supersedes the single-phase execution model in
`LIVE_FIRST_EXECUTION_PLAN.md`. Four points from that plan are revised:

| Original plan | Revision here | Reason |
|---|---|---|
| §4 — Option A (keep the existing URL) listed as needing a code change, left unspecified | §8 Change 1 and Change 2 specify `V44Facts.KeepExistingSlug` and its `DecideSlug` short-circuit | The original plan identified the requirement but not the mechanism. Without it, the composer derives a clean slug for any URL containing `top-quality`, so "keep the URL" is unreachable. |
| §7 Step 4 — execute with the default publish behaviour | §6 Step 5 and §8 Change 3 pass `publish: draft.UrlChangeRequired` | The execute path currently hard-codes `publish: true`. Phase 8.1 must not touch the publish toggle. |
| §6 — rollback baseline listed, no completeness gate | §3.2 and §4 add a two-gate completeness check with a worked arithmetic example | The original baseline could be partially captured without anyone noticing. |
| §4 — the URL decision was a single up-front gate | §11 splits it into a separately gated Phase 8.2 | Deciding the URL before the write mechanism is proven couples two independent risks. |

The unpublished sections of the original plan remain in force: the entity
decisions (D1/D3), the 301 ownership gap (R2), and the single-product,
supervised, no-batch constraint.

---

## 1. Architecture Gap Analysis

Before executing Phase 8.1, three gaps in the current code must be understood.

### Gap 1 — No partial write mode

`WriteAndSaveAsync` writes ALL fields in one pass:

```
ProductName → input[placeholder="请输入商品名称"]
Description → window.tinymce.editors[0]
SEO Title   → textarea.el-textarea__inner[0]  (in SEO dialog)
Meta        → textarea.el-textarea__inner[1]
Slug        → textarea.el-textarea__inner[2]  ← MUST NOT CHANGE in 8.1
Keywords    → .el-select__tags               (clear + add)
Publish     → [role="switch"]                 ← MUST NOT TOUCH in 8.1
Save        → button "保存"
```

**Mitigation:** Pass the EXISTING slug value to the write call so the slug
textarea receives the same value it already has. Set `publish: false` so the
publish toggle is skipped. The write then effectively changes only Product
Name, Description, SEO Title, Meta, Keywords — while re-writing the slug with
its current value (no-op).

**Code change required:** `V44Facts` needs a `KeepExistingSlug` flag. When
true, `DecideSlug` must return the existing slug verbatim with
`ChangeRequired = false`, bypassing the `HasHarmfulSlugToken` check. Without
this, the composer will always derive a clean slug for any URL containing
`top-quality`.

### Gap 2 — Snapshot does not capture SEO fields

`ReadProductAsync` captures: name, subtitle, descriptionHtml, images,
isPublished, slug. It does NOT populate `ExistingSeoTitle`,
`ExistingSeoKeywords`, `ExistingMetaDescription` — these fields exist on
`ProductSnapshot` but are left empty.

**Mitigation:** The pre-write snapshot procedure (§3) must call BOTH
`ReadProductAsync` AND `ReadSeoAsync` to capture the full state. This is a
procedural fix, not a code change — `ReadSeoAsync` already exists and reads
all four SEO fields from the admin dialog.

### Gap 3 — Price, inventory, collections, schema not captured

No existing method reads price, inventory, collections, or the current
JSON-LD schema from the admin page.

**Mitigation:** For Phase 8.1, price/inventory/collections are out of scope
(not written), so rollback of these fields is not needed. However, the
pre-write snapshot must still RECORD their pre-write values so that
post-write verification can confirm they are unchanged. This can be done
manually (screenshot / note) or via an additional DOM read script.

---

## 2. Phase 8.1 — Scope

### 2.1 Fields that WILL be written

| # | Field | Backend Selector | Source |
|---|---|---|---|
| 1 | Product Name | `input[placeholder="请输入商品名称"]` | V44Draft.ProductName |
| 2 | Description (Key Description + images) | `window.tinymce.editors` (longest in `main`) | V44Draft.KeyDescriptionHtml + V44Draft.DescriptionHtml |
| 3 | SEO Title | `textarea.el-textarea__inner[0]` in SEO dialog | V44Draft.SeoTitle |
| 4 | Meta Description | `textarea.el-textarea__inner[1]` | V44Draft.MetaDescription |
| 5 | SEO Keywords | `.el-select__tags` (clear all, then add 5) | V44Draft.Keywords |
| 6 | Image ALTs | within Description HTML | V44Draft.ImageAlts |
| 7 | JSON-LD Schema | within Description HTML | V44Draft.SchemaJson |

### 2.2 Fields that MUST NOT be modified

| # | Field | Current Value | How protected |
|---|---|---|---|
| 1 | Slug | `Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown` | Pass existing slug to write call; `KeepExistingSlug = true` in V44Facts |
| 2 | Canonical URL | derived from existing slug | Not written (derived from slug, which is unchanged) |
| 3 | Publish status | `false` (backend) | `publish: false` in `WriteAndSaveAsync` call |
| 4 | Price | *(pre-write value recorded in §3)* | Not in write scope |
| 5 | Inventory | *(pre-write value recorded in §3)* | Not in write scope |
| 6 | Collections | *(pre-write value recorded in §3)* | Not in write scope |
| 7 | Product ID | `536027551768089` | Immutable |
| 8 | Supplier data | *(pre-write value recorded in §3)* | Not in write scope |

### 2.3 V44Draft for Phase 8.1

The draft will be identical to the full V4.4 draft EXCEPT:

| Field | Full V4.4 (Phase 8.2) | Phase 8.1 |
|---|---|---|
| `Slug` | `thom-browne-4-bar-stripe-jersey-stitch-tee-brown` | `Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown` (existing, kept) |
| `CanonicalUrl` | `…/thom-browne-…-brown` | `…/Top-Quality-…-Grown` (existing, kept) |
| `UrlChangeRequired` | `true` | `false` |
| `RedirectFrom` | old URL | `null` |
| Everything else | same | same |

**All other fields** (ProductName, H1, SeoTitle, Keywords, MetaDescription,
KeyDescriptionHtml, DescriptionHtml, ImageAlts, SchemaJson) are IDENTICAL
between Phase 8.1 and Phase 8.2.

---

## 3. Mandatory Pre-Write Snapshot

Before execution, a complete pre-write snapshot MUST be captured and verified.
This is the rollback baseline.

### 3.1 Snapshot capture procedure

The snapshot is assembled from two read operations plus manual recording:

#### Step A — Product read (live)

```http
POST /api/chatgpt-mcp/products/read
{ "product_id": "536027551768089", "live": true }
```

Captures:

| Field | Status |
|---|---|
| Product Name (`ExistingName`) | Captured |
| Subtitle (`ExistingSubtitle`) | Captured |
| Description HTML (`ExistingDescriptionHtml`) | Captured |
| Slug (`ExistingSlug`) | Captured |
| Images (`ImageUrls`) | Captured |
| IsPublished (`IsPublished`) | Captured |
| CapturedAt | Captured |
| SEO Title (`ExistingSeoTitle`) | **EMPTY** (not populated by ReadProductAsync) |
| SEO Keywords (`ExistingSeoKeywords`) | **EMPTY** |
| Meta Description (`ExistingMetaDescription`) | **EMPTY** |

#### Step B — SEO read (live, manual via bridge or direct)

Call `ReadSeoAsync` through the same browser session. This opens the SEO
dialog, reads the four fields, then closes the dialog.

Captures:

| Field | Status |
|---|---|
| SEO Title | Captured |
| Meta Description | Captured |
| Slug | Captured (redundant with Step A) |
| Keywords | Captured |

**Note:** `ReadSeoAsync` is currently called only inside `ExecuteLiveAsync`
as a post-write read-back. For the pre-write snapshot, it must be called
BEFORE the write. This is a procedural step — the method exists and works
against the live admin UI.

#### Step C — Manual recording (price, inventory, collections, schema)

These fields are not read by any existing method. Record them manually:

| Field | How to capture | Pre-write value |
|---|---|---|
| Price | Read from admin page DOM or screenshot | *(fill before execute)* |
| Inventory / Stock | Read from admin page DOM or screenshot | *(fill before execute)* |
| Collections | Read from admin page DOM or screenshot | *(fill before execute)* |
| Current JSON-LD Schema | Read from storefront HTML source | *(fill before execute)* |

**Storefront schema check:**
```bash
curl -s https://www.dripsneakers.org/Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown \
  | grep -o '<script type="application/ld+json">.*</script>'
```

### 3.2 Snapshot completeness score

After capturing all three steps, calculate the completeness score:

| Category | Fields | Weight | Captured? |
|---|---|---|---|
| Product identity | Name, Subtitle, Product ID | 10% | ✅ Step A |
| URL | Slug, Canonical | 10% | ✅ Step A |
| Description | Full Description HTML | 15% | ✅ Step A |
| Images | All image URLs + count | 10% | ✅ Step A |
| SEO fields | Title, Meta, Keywords | 15% | ✅ Step B |
| Publish state | IsPublished flag | 5% | ✅ Step A |
| Price | Current price | 10% | ⚠️ Step C (manual) |
| Inventory | Stock count | 10% | ⚠️ Step C (manual) |
| Collections | Category assignments | 10% | ⚠️ Step C (manual) |
| Schema | Current JSON-LD | 5% | ⚠️ Step C (manual) |

**Rollback Completeness Score = Σ (weight of each captured category)**

The weights above sum to 100%. A category counts as captured only when every
field inside it has a recorded non-empty value.

The score alone is not a sufficient gate, because the low-weight categories
are cheap to lose. Two independent gates apply:

| Gate | Rule | Rationale |
|---|---|---|
| G1 — Weight and threshold | Score `>= 90` | Catches a broadly incomplete snapshot |
| G2 — Written-field coverage | Every field that Phase 8.1 will write has a non-empty pre-write value | Catches the case where a low-weight but high-impact field is missing |

G2 is the binding gate. §4.3 enumerates the check field by field.

Worked example of the arithmetic: if the schema cannot be read, the score is
`100 − 5 = 95`, which passes G1. If collections cannot be read, the score is
`100 − 10 = 90`, which sits exactly on the threshold. Losing both price and
inventory gives `80`, which fails. Because a passing G1 result can still hide a
missing schema, G2 must be evaluated independently and always.

If either gate fails: **NO-GO**. Do not execute.

### 3.3 Snapshot storage

The combined snapshot must be written to:
```
data/runs/<run_id>/products/536027551768089_pre_write_snapshot.json
```

This file is the authoritative rollback source. It must contain:

```json
{
  "product_id": "536027551768089",
  "captured_at": "2026-09-18T...",
  "source": "live",
  "product": {
    "name": "...",
    "subtitle": "...",
    "description_html": "...",
    "slug": "Top-Quality-...",
    "is_published": false,
    "image_urls": ["...", "..."]
  },
  "seo": {
    "seo_title": "",
    "meta_description": "",
    "keywords": [],
    "slug": "Top-Quality-..."
  },
  "business": {
    "price": "(recorded manually)",
    "inventory": "(recorded manually)",
    "collections": "(recorded manually)",
    "schema": "(captured from storefront HTML)"
  },
  "completeness_score": 100,
  "gate_g1_pass": true,
  "gate_g2_pass": true
}
```

---

## 4. Rollback Verification (Pre-Execute)

Before executing the write, the following checks MUST pass:

### 4.1 Rollback snapshot existence proof

Run all three checks. Each must pass.

```powershell
$snap = "data/runs/<run_id>/products/536027551768089_pre_write_snapshot.json"

# 1. File exists
Test-Path $snap
# Required: True

# 2. File is not empty
(Get-Item $snap).Length
# Required: greater than 100 bytes. A 0-byte or missing file is a fatal error.

# 3. File parses as JSON and carries the required top-level keys
(Get-Content $snap -Raw | ConvertFrom-Json).PSObject.Properties.Name
# Required: contains product, seo, business, completeness_score
```

A missing snapshot file, a 0-byte file, or a file that fails to parse is a
fatal error. Stop and report it; do not proceed to the write.

### 4.2 Rollback completeness score

Evaluate both gates from §3.2 against the snapshot file:

| Gate | Check | Required |
|---|---|---|
| G1 | `completeness_score` in the snapshot | `>= 90` |
| G2 | Every field enumerated in §4.3 has a non-empty pre-write value | all present |

Record the two results in the snapshot file before execution:

```json
"completeness_score": 100,
"gate_g1_pass": true,
"gate_g2_pass": true
```

If either gate fails: **NO-GO**. Do not execute.

### 4.3 Rollback content verification

Confirm the snapshot contains values for EVERY field that will be written:

| Field to write | Snapshot field | Has value? |
|---|---|---|
| Product Name | `product.name` | ✅ / ❌ |
| Description HTML | `product.description_html` | ✅ / ❌ |
| SEO Title | `seo.seo_title` | ✅ / ❌ |
| Meta Description | `seo.meta_description` | ✅ / ❌ |
| Keywords | `seo.keywords` | ✅ / ❌ |
| Image ALTs | (derived from `product.image_urls` count) | ✅ / ❌ |
| Schema | `business.schema` | ✅ / ❌ |

If any field that will be written does NOT have a pre-write value in the
snapshot, rollback of that field is impossible. **NO-GO.**

---

## 5. Proposed V4.4 Payload (Phase 8.1)

Identical to the full V4.4 payload EXCEPT slug/canonical/url_change_required:

| Field | Phase 8.1 Value |
|---|---|
| Product Name | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown` |
| H1 | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown` |
| SEO Title | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown Reps \| Drip Sneakers` |
| SEO Keywords | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown`, `Thom Browne 4-Bar Stripe Jersey Stitch Tee Reps`, `Brown T-Shirt`, `Designer T-Shirts`, `Thom Browne T-Shirt` |
| Meta Description | `Shop Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.` |
| **Slug** | **`Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown`** (KEPT) |
| **Canonical** | **`https://www.dripsneakers.org/Top-Quality-…-Grown`** (KEPT) |
| **`url_change_required`** | **`false`** |
| **`redirect_from`** | **`null`** |
| Key Description HTML | `<section class="ds-pdp-key-description" data-standard="4.4">…</section>` |
| Description HTML | 11 images with ALT text |
| Image ALTs | 11 × `…Product Image N` |
| Schema JSON | `{"@type":"Product","name":"…","brand":"Thom Browne","category":"T-Shirt","color":"Brown"}` (no SKU) |

### Key Description (detail)

```html
<section class="ds-pdp-key-description" data-standard="4.4">
  <p>This Thom Browne knit tee comes in a deep brown colourway with the signature
     white 4-Bar stripe on the left sleeve.</p>
  <h2>Product Details</h2>
  <ul>
    <li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Thom-Browne/"><strong>Thom Browne</strong></a></li>
    <li><strong>Product Type:</strong> T-Shirt</li>
    <li><strong>Model:</strong> 4-Bar Stripe Jersey Stitch Tee</li>
    <li><strong>Colorway:</strong> Brown</li>
    <li><strong>Graphic:</strong> White 4-Bar Stripe On Left Sleeve</li>
  </ul>
</section>
```

---

## 6. Execution Steps (Phase 8.1)

### Step 1 — Capture pre-write snapshot

Follow §3.1 (Steps A + B + C). Save to
`data/runs/<run_id>/products/536027551768089_pre_write_snapshot.json`.

### Step 2 — Verify rollback readiness

Follow §4. Confirm:
- [ ] Snapshot file exists and is non-empty
- [ ] Completeness score >= 90
- [ ] Every field to be written has a pre-write value

### Step 3 — Prepare plan (with slug kept)

```http
POST /api/chatgpt-mcp/products/prepare-v44
{
  "product_id": "536027551768089",
  "operation": "auto",
  "sku_resolution": {
    "verdict": "SKU_OMIT",
    "exact_entity": {
      "brand": "Thom Browne",
      "model": "4-Bar Stripe Jersey Stitch Tee",
      "product_type": "T-Shirt",
      "colorway": "Brown",
      "collaboration_or_collection": null
    },
    "sku": null,
    "evidence": [{
      "tier": 8,
      "source_name": "Drip product photography (visual identification)",
      "exact_entity_match": true
    }],
    "conflicts": [],
    "decision_note": "Exact entity visually identified; no Tier 1-4 source attaches a SKU, omit per V4.4 §5."
  },
  "v44_facts": {
    "decision_sentence": "This Thom Browne knit tee comes in a deep brown colourway with the signature white 4-Bar stripe on the left sleeve.",
    "brand_internal_url": "https://www.dripsneakers.org/Thom-Browne/",
    "product_details_fifth": {
      "label": "Graphic",
      "value": "White 4-Bar Stripe On Left Sleeve"
    },
    "keep_existing_slug": true
  }
}
```

**Expected:** `200`, `validation_status=PASS`, `url_change_required=false`,
`redirect_from=null`, `slug` = existing slug (unchanged).

**Note:** `keep_existing_slug` is a NEW field on `V44Facts` that does not
yet exist in the code. It must be added before Phase 8.1 can run. See §8.

### Step 4 — Human review gate

Review every field against §5:

- [ ] Product Name is `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown`
- [ ] SEO Title contains `Reps | Drip Sneakers`
- [ ] Keywords are exactly 5, comma-separated
- [ ] Meta Description starts with `Shop` and ends with `shipping.`
- [ ] Slug is `Top-Quality-…-Grown` (UNCHANGED — not the clean slug)
- [ ] Canonical is `https://www.dripsneakers.org/Top-Quality-…-Grown` (UNCHANGED)
- [ ] `url_change_required=false`
- [ ] `redirect_from=null`
- [ ] Key Description has exactly 5 `<li>` items
- [ ] Brand link is `https://www.dripsneakers.org/Thom-Browne/` (verified live)
- [ ] Schema JSON has no `sku` field
- [ ] Image ALTs are 11, each ending with `Product Image N`
- [ ] No banned wording (`top-quality`, `1:1`, `Replica`, `AAA`) in any SEO field
- [ ] `plan_id` recorded and immutable

### Step 5 — Execute (with publish: false)

```http
POST /api/chatgpt-mcp/products/execute-v44
{ "product_id": "536027551768089", "plan_id": "<plan_id>" }
```

**Critical:** The execute path currently calls
`WriteAndSaveAsync(draft, publish: true, …)`. For Phase 8.1, this must be
changed to `publish: false` so the publish toggle is NOT touched. See §8
for the code change.

### Step 6 — Post-write verification

Follow §7.

---

## 7. Verification Steps (Phase 8.1)

### 7.1 Backend read-back (automatic)

The execute path calls `ReadSeoAsync` and compares:

| Field | Expected | Method |
|---|---|---|
| SEO Title | draft.SeoTitle | string equality |
| Meta Description | draft.MetaDescription | string equality |
| Slug | draft.Slug (= existing slug) | string equality — must be UNCHANGED |
| Keywords | draft.Keywords | order-sensitive list equality |

**Phase 8.1 specific assertion:** The read-back slug MUST equal the pre-write
slug. If it differs, the write inadvertently changed the URL — ROLLBACK.

### 7.2 Storefront frontend verification

Fetch the existing URL (NOT a new URL — the URL should NOT have changed):

```
GET https://www.dripsneakers.org/Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown
```

| Check | Expected |
|---|---|
| HTTP status | 200 (page must still be live — URL unchanged) |
| H1 | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown` (new name) |
| Meta description | matches draft meta |
| Canonical | `https://www.dripsneakers.org/Top-Quality-…-Grown` (UNCHANGED) |
| JSON-LD `name` | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown` |
| JSON-LD `brand` | `Thom Browne` (was `drip_sneakers`) |
| JSON-LD `sku` | absent (was `536027551768089`) |
| `<h2>Product Details</h2>` | present with exactly 5 `<li>` |
| Brand link | `https://www.dripsneakers.org/Thom-Browne/` crawlable |
| Description | images with ALT text only |
| Banned wording | `top-quality`, `1:1`, `Replica`, `AAA` — all absent from page HTML |

### 7.3 Unchanged-field verification

| Field | Expected | How to verify |
|---|---|---|
| URL | unchanged | storefront returns 200 at old URL |
| Canonical | unchanged | HTML `<link rel="canonical">` = old URL |
| Publish status | unchanged (still `false` in backend) | `ReadProductAsync` live read |
| Price | unchanged | compare to §3 snapshot |
| Inventory | unchanged | compare to §3 snapshot |
| Collections | unchanged | compare to §3 snapshot |
| Product ID | unchanged | `536027551768089` |
| Images | same 11 URLs | `ReadProductAsync` live read |
| `is_published` | still `false` | `ReadProductAsync` live read |

### 7.4 verify-v44 route

```http
POST /api/chatgpt-mcp/products/verify-v44
{ "product_id": "536027551768089" }
```

Expected: `pass=true`, all checks `PASS` or `WARN` (no `ERROR`).

---

## 8. Code Changes Required for Phase 8.1

Phase 8.1 cannot run without these changes:

### Change 1 — `V44Facts.KeepExistingSlug`

**File:** `dripops/src/DripOps/Rules/V44/V44Models.cs`

Add a new field to `V44Facts`:

```csharp
/// <summary>
/// Phase 8.1: when true, the composer keeps the existing slug verbatim,
/// bypassing the harmful-token migration rule. Used for safe SEO-only
/// writes that must not change the URL.
/// </summary>
public bool KeepExistingSlug { get; init; }
```

### Change 2 — `V44Composer.DecideSlug` override

**File:** `dripops/src/DripOps/Rules/V44/V44Composer.cs`

Add at the top of `DecideSlug`, before any other branch:

```csharp
if (facts.KeepExistingSlug && hasExistingSlug)
{
    return new SlugDecision(currentSlug, false, currentUrl);
}
```

This short-circuits all slug logic when the operator explicitly requests
keeping the existing URL.

### Change 3 — `publish: false` in execute path

**File:** `dripops/src/DripOps/Bridge/BridgeServer.cs`

In `ExecuteLiveAsync`, the call:

```csharp
await client.WriteAndSaveAsync(draft, publish: true, cancellationToken);
```

must become parameterised. Options:

- (a) Add a `publish` field to the plan or execute request
- (b) Add a `Phase8_1_Mode` flag to the config
- (c) Infer from `draft.UrlChangeRequired`: if `false`, don't publish

**Recommendation:** (c) — if `UrlChangeRequired == false`, set `publish: false`.
This is the safest inference: a plan that doesn't change the URL should not
publish in the same pass. Phase 8.2 (which sets `UrlChangeRequired = true`)
will publish.

```csharp
await client.WriteAndSaveAsync(draft, publish: draft.UrlChangeRequired, cancellationToken);
```

### Change 4 — Pre-write SEO snapshot

**File:** `dripops/src/DripOps/Browser/MrshopplusClient.cs`

`ReadProductAsync` should also read SEO fields. Add a call to `ReadSeoAsync`
within `ReadProductAsync`, or extend the read script to open the SEO dialog
and read all four fields. Store in `ExistingSeoTitle`, `ExistingSeoKeywords`,
`ExistingMetaDescription`.

Alternatively, the pre-write snapshot procedure (§3) can call both methods
sequentially without a code change — this is the procedural approach.

---

## 9. Go / No-Go Checklist (Phase 8.1)

Before proceeding to execution:

### Pre-requisites (code)

- [ ] `V44Facts.KeepExistingSlug` field added
- [ ] `V44Composer.DecideSlug` honours `KeepExistingSlug`
- [ ] `ExecuteLiveAsync` passes `publish: false` when `UrlChangeRequired == false`
- [ ] `dotnet build` — 0 warnings, 0 errors
- [ ] `tests/p0-remediation.mjs` — 17/17 (no regression)
- [ ] `tests/bridge-acceptance.mjs` — 54/54 (no regression)
- [ ] New test: plan with `keep_existing_slug: true` → `url_change_required = false`

### Pre-requisites (data)

- [ ] Fresh live snapshot captured (`live: true`, `captured_at` < 1h ago)
- [ ] Pre-write snapshot file saved to `data/runs/…/…pre_write_snapshot.json`
- [ ] Snapshot completeness score >= 90%
- [ ] Every field to be written has a pre-write value in the snapshot

### Pre-requisites (decisions)

- [ ] D1 decided: `Grown` → `Brown` (recommended)
- [ ] D3 decided: full Product Name correction (recommended)
- [ ] D2 deferred to Phase 8.2 (URL migration is OUT of scope for 8.1)

### Pre-requisites (operational)

- [ ] Bridge running in `live` mode (not `simulate`)
- [ ] Admin login session valid
- [ ] Operator present and monitoring
- [ ] Rollback procedure (§10) printed and accessible
- [ ] Single product only — no batch

### Go decision

ALL checkboxes must be checked. If ANY is unchecked: **NO-GO**.

---

## 10. Rollback Plan (Phase 8.1)

### 10.1 When to rollback

- Backend read-back slug differs from pre-write slug (URL was changed)
- Backend read-back of any SEO field fails
- Storefront returns 404 (URL was inadvertently changed)
- Storefront H1 does not match the new Product Name
- Any `READBACK-*` or `FRONTEND-*` ERROR

### 10.2 Rollback procedure

**Step 1 — Stop.** Do not retry, do not click Save again.

**Step 2 — Read current state:**
```http
POST /api/chatgpt-mcp/products/read
{ "product_id": "536027551768089", "live": true }
```
Plus `ReadSeoAsync` to get the current SEO fields.

**Step 3 — Compare to pre-write snapshot.** Identify which fields changed.

**Step 4 — Restore changed fields manually:**
Open the MrShopPlus admin page for `536027551768089` in a browser.

| Field | Restore to (from pre-write snapshot) |
|---|---|
| Product Name | `Thom Browne 4 Bar Stripe Jersey Stitch Tee Grown` |
| Description | (restore from `product.description_html` in snapshot) |
| SEO Title | (restore from `seo.seo_title` — likely empty) |
| Meta Description | (restore from `seo.meta_description` — likely empty) |
| Keywords | (restore from `seo.keywords` — likely empty) |
| Slug | (restore from `product.slug` — if changed) |
| Publish state | (restore from `product.is_published` — should still be `false`) |

**Step 5 — If slug was changed (should not happen in 8.1):**
Restore the slug to `Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown`.
The old URL will resume serving.

**Step 6 — Verify restoration:**
- Storefront returns 200 at the old URL
- H1 matches the old Product Name
- SEO fields are empty (as before)

**Step 7 — Document:**
Record in `INCIDENT_LOG.md` what failed, what was restored, what was not
recoverable.

### 10.3 Rollback limitations

| Scenario | Recoverable? | Notes |
|---|---|---|
| SEO fields written incorrectly | Yes | Manually restore from snapshot |
| Slug accidentally changed | Yes | Manually restore slug in admin |
| Publish accidentally toggled | Yes | Manually uncheck in admin |
| Partial write (some fields saved, others not) | Yes | Restore each changed field |
| Description HTML overwritten | Yes | Restore from `product.description_html` in snapshot |
| Google indexed the new content before rollback | Time-dependent | Request re-crawl after restore |

---

## 11. Phase 8.2 — URL Migration (AFTER 8.1 passes)

Phase 8.2 is NOT executed in this plan. It is documented here only to define
the boundary.

### 11.1 Entry conditions

- Phase 8.1 passed all verification checks (§7)
- Storefront H1, meta, keywords, schema, description all verified correct
- URL is still the old URL (`Top-Quality-…-Grown`)
- Publish status is still `false`

### 11.2 Phase 8.2 scope

| What changes | What does NOT change |
|---|---|
| Slug → `thom-browne-4-bar-stripe-jersey-stitch-tee-brown` | Product Name (already correct from 8.1) |
| Canonical → new URL | SEO Title (already correct from 8.1) |
| `url_change_required` → `true` | Meta, Keywords, Description, Schema, Images |
| Publish status → `true` (if D2 = Option B) | Price, Inventory, Collections |
| 301 redirect (manual, outside bridge) | Product ID |

### 11.3 Phase 8.2 prerequisites

- [ ] 301 redirect mechanism confirmed and ready to deploy
- [ ] `keep_existing_slug` removed from facts (or set to `false`)
- [ ] Plan re-generated with `migrate_url: true` or default (harmful token triggers migration)
- [ ] `url_change_required = true`, `redirect_from` set
- [ ] 301 placed immediately after write
- [ ] Old URL returns 301 → new URL
- [ ] New URL returns 200, canonical = self

---

## 12. Risk Register

| # | Risk | Severity | Phase 8.1 mitigation |
|---|---|---|---|
| R1 | Write selectors unverified | Medium | Phase 8.1 IS the selector test — but only for SEO fields. Slug/publish selectors are NOT tested in 8.1. |
| R2 | 301 lifecycle unowned | N/A in 8.1 | Deferred to Phase 8.2. No URL change in 8.1. |
| R3 | Rollback procedure untested | Medium | Pre-write snapshot completeness score >= 90%. Manual restore documented. |
| R4 | `is_published` unreliable | Low | P0-1 fix removes dependence. 8.1 does not publish. |
| R5 | `KeepExistingSlug` is a new code path | Medium | Must be tested before 8.1. New test assertion: `keep_existing_slug: true` → `url_change_required = false`. |
| R6 | `publish` inference from `UrlChangeRequired` | Medium | If `UrlChangeRequired = false` → `publish = false`. Must be tested. Risk: a plan that should publish but has `UrlChangeRequired = false` would not publish. In 8.1 this is correct; in 8.2 it is also correct (8.2 has `UrlChangeRequired = true`). |
| R7 | Description HTML (pre-write) not in SEO read | Low | `ReadProductAsync` captures `ExistingDescriptionHtml`. Step A covers this. |
| R8 | Price/inventory/collections not machine-readable | Low | Manual recording in Step C. Completeness score requires these. |

---

## 13. System State

| Component | Status | Notes |
|---|---|---|
| V4.4 Standard | LOCKED | SHA-256: `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8` |
| P0-1 URL Stability | FIXED | `DecideSlug` no longer depends on `is_published` |
| P0-2 Snapshot Freshness | FIXED | 24h age guard, live refresh forced |
| P0-3 Read Path | VERIFIED | Chrome/CDP/login/read selectors all pass |
| Write Path (SEO fields) | PENDING | First test in Phase 8.1 |
| Write Path (slug/publish) | PENDING | First test in Phase 8.2 |
| `KeepExistingSlug` | NOT IMPLEMENTED | Required before 8.1 |
| `publish` inference | NOT IMPLEMENTED | Required before 8.1 |
| Pre-write snapshot (full) | NOT IMPLEMENTED | Procedural — Steps A+B+C |
| 301 mechanism | UNOWNED | Required before 8.2 |

**Overall readiness for Phase 8.1: 6/10** — two small code changes needed,
then the safe write can proceed with zero URL risk.
