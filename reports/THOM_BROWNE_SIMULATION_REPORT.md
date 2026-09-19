# THOM BROWNE SIMULATION REPORT

**Date:** 2026-09-18
**Scope:** Phase 4 — full pipeline simulation for one real product, with **no live
write**. Bridge ran with `--mode simulate` against a sandbox copy of real run
state. Read-only with respect to production.

---

## 1. Result

**SIMULATED_SUCCESS** on the `SKU_OMIT` path, **with one P0 blocker that would
corrupt a live URL if executed as-is.** The payload generates and validates
correctly; the URL decision must be resolved by a human before any live run.

---

## 2. Target

| Property | Value |
|---|---|
| Product ID | `536027551768089` |
| URL | `https://www.dripsneakers.org/Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown` |
| Backend name | `Thom Browne 4 Bar Stripe Jersey Stitch Tee Grown` |
| Backend slug | `Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown` |
| Images | 11 |
| Snapshot hash | `ae7c127f9d0161d767a2a3be6f10b200481cef7400231fad32b073b65adb3df2` |
| Existing SEO title | *(empty)* |
| Existing meta | *(empty)* |
| Existing keywords | *(empty)* |
| Snapshot `is_published` | `false` |

---

## 3. Collector

```text
POST /api/chatgpt-mcp/products/read  → 200
```

Full snapshot returned with `snapshot_hash` and 11 public CDN image URLs on
`images.mrshopplus.com`.

**Live storefront cross-check (independent of the snapshot):**

| Signal | Value |
|---|---|
| HTTP status | 200 |
| `<title>` | `reps | Drip Sneakers` — the product-name token is **empty**; the title is broken |
| H1 | `Thom Browne 4 Bar Stripe Jersey Stitch Tee Grown How to Order` |
| canonical | self |
| `noindex` | absent — the page is indexable |
| JSON-LD Product `sku` | `536027551768089` — the internal Product ID, not a public SKU |
| JSON-LD Product `brand` | `dripsneakers` — the **store** name, not `Thom Browne` |
| `color` / `category` | absent from the schema |
| Meta description | contains `the best Reps`, `1:1 quality Replica` |
| Banned wording in page HTML | `top-quality` ×16, `1:1` ×2, `Replica` ×8, `AAA` ×1 |

**Snapshot vs reality disagreement:** the local snapshot says
`is_published = false`, while the storefront serves the page at HTTP 200 with a
self-canonical and no `noindex`. The snapshot is stale on this field. This is the
root cause of §7.

---

## 4. Vision / Entity resolution

Three product photographs were downloaded and inspected visually (the actual
`get_product_images` → vision flow).

**Observed:** a fine-gauge knit short-sleeve tee in a **deep / chocolate brown**
base colour, crew neck, **white 4-Bar stripe on the left sleeve**, ribbed hem and
cuffs, side vents with buttons, Thom Browne neck label, `NEW-KNIT` tag.

**Sibling product check** — the same model exists as a second live product:

| | Target | Sibling |
|---|---|---|
| Product ID | `536027551768089` | `536027551814932` |
| Backend name | `…Tee Grown` | `…Tee Medium Brown` |
| Image set | 11 files | 11 **different** files |
| Observed colour | deep brown | **light beige / sand** |

The image sets do not overlap, so these are two distinct physical products, not a
duplicate listing. Note however that the sibling's label ("Medium Brown") also
contradicts its own photograph (light beige) — the backend colour naming is
systematically unreliable for this model.

**Entity verdict:** the garment design is identifiable (Thom Browne 4-Bar Stripe
knit tee, brown). The **name token `Grown` is not a verifiable Thom Browne
colourway** and is almost certainly a corruption of "Brown". No Tier 1–4 source
was found attaching a SKU or an official colourway name to this exact entity.

---

## 5. SKU decision

Two verdicts were executed to give the reviewer a real choice.

### 5.1 `SKU_OMIT` — produces a plan

```json
{
  "verdict": "SKU_OMIT",
  "exact_entity": { "brand": "Thom Browne", "model": "4-Bar Stripe Jersey Stitch Tee",
                    "product_type": "T-Shirt", "colorway": "Brown",
                    "collaboration_or_collection": null },
  "sku": null,
  "evidence": [{ "tier": 8, "source_name": "Drip product photography (visual identification)",
                 "exact_entity_match": true }],
  "conflicts": [],
  "decision_note": "Exact entity visually identified; no Tier 1-4 source attaches a SKU, omit per V4.4 §5."
}
```

→ `200`, plan created, `validation_status = PASS`.

### 5.2 `HOLD` — blocks

```json
{
  "verdict": "HOLD",
  "conflicts": ["backend name token 'Grown' is not a verifiable Thom Browne colourway
                 and does not match the dark brown product photograph"]
}
```

→ `409 hold_forbids_plan`, **no plan created**.

Both outcomes are available and both are defensible. This is the decision the
owner must make.

---

## 6. Generated V4.4 payload (SKU_OMIT path)

| Field | Value |
|---|---|
| Product Name / H1 | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown` |
| SEO Title | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown Reps \| Drip Sneakers` |
| SEO Keywords | `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown`, `Thom Browne 4-Bar Stripe Jersey Stitch Tee Reps`, `Brown T-Shirt`, `Designer T-Shirts`, `Thom Browne T-Shirt` |
| Meta Description | `Shop Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.` |
| Slug (**changed** — see §7) | `thom-browne-4-bar-stripe-jersey-stitch-tee-brown` |
| Canonical | `https://www.dripsneakers.org/thom-browne-4-bar-stripe-jersey-stitch-tee-brown` |
| Description field | 2,323 bytes, images with ALT only |
| Image ALT | 11 × `Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown Product Image N` |

Key Description (V4.4 §12/§13/§14 — one sentence + exactly five fields, no
repeated product-name heading):

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

Product Schema — `sku` **omitted** as required by V4.4 §20:

```json
{ "@context": "https://schema.org", "@type": "Product",
  "name": "Thom Browne 4-Bar Stripe Jersey Stitch Tee Brown",
  "brand": { "@type": "Brand", "name": "Thom Browne" },
  "category": "T-Shirt", "color": "Brown" }
```

The Brand internal link `https://www.dripsneakers.org/Thom-Browne/` was verified
live before use: HTTP 200, H1 `Thom Browne`, self-canonical, not a soft 404.
V4.4 §15 forbids inventing a URL, so the destination was probed, not assumed.

---

## 7. P0 BLOCKER — the plan would silently change a live URL

```text
existing slug          : Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown
proposed slug          : thom-browne-4-bar-stripe-jersey-stitch-tee-brown
slug_changed           : true
url_change_required    : false        ← wrong
redirect_from          : null         ← so no 301 would be created
snapshot is_published  : false        ← stale; the page is live at HTTP 200
```

**Mechanism.** `V44Composer.DecideSlug` treats an existing slug as stable only
when `snapshot.IsPublished` is true. The stale snapshot says `false`, so the
composer falls through to deriving a new slug — and returns
`ChangeRequired = false`, which means no `redirectFrom` is produced.

**Impact if executed live:** the product's URL changes from the existing
indexed path to a new path, with no redirect. The existing indexed URL would
break, and no 301 would be in place to transfer it. This directly contradicts
V4.4 §10 (existing correct live URLs are stable by default).

**Required before any live execution (either fix suffices):**

1. Prefer: `prepare` must use a fresh snapshot (`live: true`) so
   `is_published` reflects reality and the stability rule engages correctly.
2. Plus: harden `DecideSlug` so an existing non-harmful slug is treated as stable
   regardless of the published flag, and so any slug change always sets
   `UrlChangeRequired = true` (which forces a `redirectFrom` to be supplied).

Option 2 is a code change and therefore out of scope for this task. It is
recorded as a P0 item in the gap report.

---

## 8. Simulated execution

```text
POST /api/chatgpt-mcp/products/execute-v44 { product_id, plan_id }
→ 200
   executed       = true
   save_status    = "SIMULATED — MrShopPlus was NOT contacted"
   readback_status= "SIMULATED"
   frontend_status= "SIMULATED"
```

Duplicate execution refused:

```text
→ 409 plan_already_executed
```

Sandbox `state/runs` tree re-hashed after execution: **byte-identical**. The
simulated run mutated nothing.

---

## 9. Frontend verification plan — and why it reports FAIL today

`verify-v44` was run against the plan. It returned `pass = false` with:

```text
FRONTEND-02 HTTP_STATUS      Frontend returned 404
FRONTEND-03 H1_MISMATCH      Frontend H1 mismatch. Found: (empty)
FRONTEND-05 META_MISMATCH    meta description does not match the saved draft
FRONTEND-07 CANONICAL_MISMATCH  Found: https://www.dripsneakers.org/New
SCHEMA-01 (WARN)             No JSON-LD block found
FRONTEND-EXCEPTION           404 (Not Found)
EXEC-01 (WARN)               plan executed at … with save status SIMULATED
```

**This is the expected result before a write exists.** The verifier fetched the
*proposed* canonical URL, which does not exist yet because nothing was written.
The 404 is the correct answer to "does the new URL resolve?" at this point in
time.

Two useful facts came out of it:

1. The verifier reaches the live storefront and evaluates real HTML — it is not a
   stub.
2. The acceptance checks that must pass after a real write are: HTTP 200, H1 ==
   Product Name, meta == draft meta, canonical == draft canonical, no
   `noindex`, JSON-LD present, `<h2>Product Details</h2>` with exactly 5 `<li>`,
   a crawlable Drip Sneakers brand link, image-only Description with ALT, and
   absence of banned wording.

---

## 10. What the simulation proves and what it does not

**Proves:**
- The full chain Collector → Vision → Entity resolution → V4.4 generation →
  Prepare → Validation → Simulate Execute → Verify runs end to end on a real
  product.
- The generated payload satisfies every machine-checkable V4.4 rule.
- `HOLD` correctly blocks; duplicate execution correctly blocks; nothing was
  written.

**Does not prove:**
- That the payload is *factually* correct. The colourway name `Brown` is derived
  from the product photograph, not from an official source. The decision
  sentence and the fifth Product Details field were authored for this simulation.
- That a live MrShopPlus write succeeds (no browser session was used).
- That the URL decision is safe (§7).

---

## 11. Decision required before live execution

| # | Decision | Options |
|---|---|---|
| 1 | How to treat the unverifiable name token `Grown` | (a) drop it and use a descriptive colourway `Brown` — consistent with the `Black Red` / `Blue` style used in the previous Air Jordan batch; (b) `HOLD` the product, consistent with the `Bleached Coral` precedent; (c) supply the official colourway name |
| 2 | URL migration | (a) keep the existing URL untouched (zero risk, requires the stability rule to engage); (b) migrate to a clean slug **with** a 301 planned at site level |
| 3 | Scope of the write | (a) SEO fields + Key Description + Schema only, leaving Product Name alone; (b) also correct the Product Name (removes `Top Quality` from the name) |

Decision 2 cannot be taken safely until the §7 blocker is resolved.
