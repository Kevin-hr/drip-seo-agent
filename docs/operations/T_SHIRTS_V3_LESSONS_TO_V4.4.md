# T-Shirts SEO/PDP V3 lessons carried into V4.4

## Status and claim boundary

This document records the reusable lessons from the historical T-Shirts SEO/PDP
V3 work. It does **not** claim that the 30-product objective was completed.

The archived run state supports exactly this baseline:

| Evidence | Verified result |
|---|---:|
| Distinct products at `FrontendVerified + Verified + validation.isValid=true` | 11 |
| PDP 3.1.1 products | 9 |
| PDP 3.2 products | 2 |
| Products independently re-accepted under V4.4 | 0 |
| Candidate snapshot | 200 |
| Published count in the 2026-09-02 snapshot | 10 — historical and stale |

The machine-readable derivation is
[`reports/evidence/t-shirts-v3/verified-baseline.json`](../../reports/evidence/t-shirts-v3/verified-baseline.json).
A candidate, a historical published flag, or a product file is not counted as a
success unless all three terminal gates are present in the archived state.

## What succeeded

The 11 verified products prove that the following control sequence worked:

1. Freeze one product ID and capture the current backend snapshot.
2. Treat supplier titles and suffixes such as `DC2` as untrusted input.
3. Match product images to an exact consumer entity before writing SEO.
4. Verify SKU against the same entity; never promote an internal ID or supplier
   code to SKU.
5. Compose deterministic fields from structured facts.
6. Run validation before any write.
7. Save, read the backend back, publish only when authorized, then verify the
   public PDP.
8. Count success from terminal state, not from an earlier published flag.

The strongest operational pattern was not the copy template. It was the
closed-loop transition:

```text
snapshot → evidence → facts → compose → validate → save → read-back
→ publish → publish read-back → storefront verify
```

## Verified historical products

| Product ID | V3 PDP | Product | Verified SKU |
|---|---|---|---|
| 536027552860691 | 3.1.1 | Givenchy Stamp Print T-Shirt White | BM71NK3YSA-100 |
| 536027552907547 | 3.1.1 | Givenchy Stamp Print T-Shirt Black | BM71NK3YSA-001 |
| 536027553036823 | 3.1.1 | Loewe Relaxed Fit Embroidered Logo T-Shirt White | S359Y22XAC-2100 |
| 536027559207962 | 3.1.1 | BAPE ABC Camo By Bathing Ape Tee Black/Green | 0ZXTEM110006N |
| 536027545737240 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Gucci Embroidery Off White/Navy | 756596XJFV89088 |
| 536027545785624 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Embroidery Navy/White | 756596XJFV84930 |
| 536027547266582 | 3.2 | adidas Originals Britcore Short Sleeve Ringer T-Shirt Off White/Aurora Coffee | HZ3830 |
| 536027547297304 | 3.2 | adidas Originals Britcore Short Sleeve Ringer T-Shirt Crystal Sky | HZ3831 |
| 536027549064979 | 3.1.1 | Gucci Cotton Piquet T-Shirt with Embroidery Black | 856003XJHQG1043 |
| 536027550608151 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Embroidery White | 835640XJHCV9692 |
| 536027550738203 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Embroidery Grey Mélange | 835640XJHCW1183 |

Names, SKUs and URLs in this table are historical evidence. They must be
re-verified against current images and sources before a V4.4 write.

## Lessons from what did not complete

- A run named “first 30” contained 30 snapshots, but only 4 terminal successes.
  Run names and requested quantities are not evidence.
- The 200-product candidate run produced 7 additional terminal successes, not
  200 completed products.
- The two run snapshots were created under 3.1.1. Product-level HTML is the
  evidence that separates the nine 3.1.1 outputs from the two 3.2 outputs.
- The proposed `t-shirts-30-final-2026-09-07` run was never created. It must not
  be cited as a completed or authoritative run.
- A later `t-shirts-200-2026-09-07` attempt recorded
  `GlobalBlocked`, zero product IDs and zero backend writes because its required
  runtime standard was unavailable.
- Snapshot publication counts become stale immediately after later writes.
  Always rescan before reporting current inventory.
- Cross-run totals must be deduplicated by product ID and terminal state.
- A standard version may not be guessed. The current authority is the
  hash-pinned V4.4 STANDARD_FINAL document.

## V3 knowledge that survives V4.4

| V3 lesson | V4.4 treatment |
|---|---|
| Exact entity before SEO | Retained and strengthened as the Exact Entity Hard Gate |
| Supplier title is untrusted | Retained |
| SKU must belong to the exact entity | Retained; when unavailable, V4.4 omits SKU instead of inventing it |
| Structured facts before composition | Retained |
| Validation before write | Retained |
| Save/read-back/frontend verification | Retained |
| One auditable run and deduplicated IDs | Retained |
| V3 description template and field placement | Replaced |
| V3 keyword count and PDP heading structure | Replaced by V4.4 output and placement rules |
| Historical canonical URL | Evidence only; V4.4 prefers stability and requires an explicit migration decision |
| Historical “verified” state | Not inherited automatically; current identity, placement and crawlability must pass again |

## V4.4 execution playbook derived from the experience

For every product:

1. Capture current gallery, name, URL, publication state and protected commerce
   fields.
2. Build a visual fingerprint before searching.
3. Search high-authority sources and create a candidate set.
4. Lock brand, model, product type, colorway, graphics and collection.
5. Apply the single-item/set gate.
6. Resolve SKU as `VERIFIED_SKU` or omit it; identity conflict becomes `HOLD`.
7. Generate only the ten V4.4 operational outputs.
8. Validate Key Description as one decision sentence plus exactly five Product
   Details fields with a verified brand internal link.
9. Keep backend Description image-only and validate every ALT against the image.
10. Save one canary, read it back and verify crawlable storefront output before
    continuing the batch.
11. Count a product only after terminal read-back and storefront gates pass.
12. Preserve an append-only operation log and product-level evidence.

## Fail-closed rules for future AI agents

- Never call the historical T-Shirts batch “30/30 completed.”
- Never use the old handoff’s “3.2 (guessed)” decision.
- Never copy V3 HTML directly into V4.4 fields.
- Never reuse a historical SKU without current exact-entity evidence.
- Never count a published flag as a V4.4 PASS.
- Never merge products from separate runs without ID deduplication.
- Never continue a batch after canary read-back divergence.
- Never rewrite historical evidence to make the result look complete.

## V4.4 acceptance definition

A migrated T-Shirt counts only when current evidence proves:

```text
Exact Entity PASS
+ SKU VERIFIED or correctly omitted
+ V4.4 SEO fields PASS
+ Key Description placement PASS
+ Description image-only PASS
+ save read-back PASS
+ publication read-back PASS when publication is authorized
+ storefront and crawlability PASS
```

Until those gates run again, the repository’s defensible claim remains:
**11 historical V3 terminal successes, 0 independently re-accepted under V4.4.**

