# Prada Batch Learnings for Future Product Runs

This document translates the Prada 78 preflight into reusable controls. It is
advisory and does not alter the active V4.4 standard.

## Required controls

| Control | Required behaviour | Failure behaviour |
|---|---|---|
| Source freeze | Stable source key, ordered image list, count and hash | Stop affected item |
| Fresh snapshot | Re-read backend immediately before planning | Reject stale plan |
| Exact entity | Evidence must identify the exact model/colourway | `HOLD` |
| SKU | Only `VERIFIED_SKU`, `SKU_OMIT`, or `HOLD` | Reject internal/supplier IDs |
| Visual evidence | Describe visible facts only | Do not infer official colourway |
| Reconciliation | Strong identifiers plus image evidence | Do not create on title alone |
| Category mapping | Parent and required subcategory are explicit | Fail verification |
| Canary | One product passes full read-back chain | Do not start bulk batch |
| Resume | Every source key has durable operation state | Re-read before retry |
| Acceptance | Backend and storefront agree after publish | Mark incomplete/blocked |

## Batch invariants

- A source key maps to at most one live product ID.
- A live product ID maps to at most one source key in the batch.
- Every create/update decision is based on a fresh snapshot.
- Image count and order are checked after save, not assumed from upload success.
- Category membership is verified after publish.
- A failed or timed-out action is never recorded as successful.
- Historical SEO/PDP 3.0 output is evidence only; V4.4 remains authoritative.
- Internal catalogue codes never become public SKU values.
- Existing unrelated products and categories remain untouched.

## Minimum evidence for a completed live batch

1. Frozen input manifest and source inventory hash.
2. Per-item identity and SKU verdict with evidence references.
3. Immutable validated plan ID for each executable item.
4. Per-item execution result and backend read-back.
5. Per-item public URL verification after publish.
6. Final one-to-one reconciliation with duplicate count.
7. Explicit blocked list, including zero when there are no blocked items.
