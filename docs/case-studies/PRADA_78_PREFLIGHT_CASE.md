# Prada 78 — Evidence-Backed Preflight and Reconciliation Case

## Status

This is a **verified preflight case**, not a claim that all 78 products were
written to MrShopPlus or accepted on the storefront.

The source run proved that a large, mixed create/update batch could be reduced
to a deterministic manifest with image, identity, category and SEO/PDP checks.
The retained operations log does not prove completion of the live write phase.

## Verified outcome

The run identified and validated:

| Measure | Observed value |
|---|---:|
| Source product folders | 78 |
| Source images | 856 |
| America's Cup products | 34 |
| Other Prada products | 44 |
| Existing products identified by the frozen manifest | 14 |
| Products marked for creation by the frozen manifest | 64 |
| Exact duplicate source folders | 0 |
| Manifest validation errors | 0 |

The subsequent public-catalog reconciliation found 9 source products visible
on the storefront and 69 absent at that time. This differs from the earlier
backend-derived 14/64 split. The difference is useful evidence: inventory state
must be re-read immediately before execution and must never be inferred from an
older manifest.

## What worked

### 1. Freeze the source inventory before browser work

Every source folder received one stable `source_key`. Image count and ordering
were captured before any product form was opened. This made the batch resumable
and prevented a browser timeout from corrupting the source-of-truth inventory.

### 2. Separate identity evidence from visual observations

Images were used to compare products and describe visible construction. They
were not sufficient to promote a folder name, supplier number or visual colour
guess into an official product identity or verified SKU.

The case exposed why this separation matters: most proposed SKU values in the
legacy manifest were internal catalogue codes. Under the active V4.4 standard,
those values must not be published as official SKU values. A V4.4 rerun must
resolve each item to `VERIFIED_SKU`, `SKU_OMIT`, or `HOLD`.

### 3. Reconcile before create

The workflow used product IDs, public URLs, titles and image similarity to
separate updates from creates. Similar titles alone were treated as insufficient
because they can create duplicates across colourways and legacy slugs.

### 4. Make category membership explicit

The 34 America's Cup products required both the parent Prada category and the
America's Cup category. The remaining 44 required the parent category. Existing
global categories were allowed to remain but could not replace either target.

### 5. Validate before opening the write gate

The manifest validator checked all 78 records and deliberately rejected malformed
fixtures. The important pattern is the gate, not the historical SEO/PDP 3.0
field format. In the current repository, the equivalent gate is the immutable
V4.4 prepare plan plus standard and snapshot hashes.

### 6. Use a canary before a batch

The run plan selected one existing draft as a pilot before the remaining 77
products. The reusable lesson is to require complete save read-back, publish
read-back and storefront verification for the canary before bulk execution.

### 7. Record failures as evidence

The backend product-list read timed out. The operation was recorded as failed,
and no form submission was claimed. That is the correct behaviour: a timeout is
not success, and inability to re-read state closes the write gate.

## What is not proven

The retained evidence does not prove:

- 78/78 live product writes;
- 64 or 69 successful creates;
- final image order on every storefront page;
- final category membership for every product;
- V4.4 compliance, because the historical manifest used SEO/PDP 3.0;
- final save, publish and storefront read-back for the selected canary.

Any future document calling this a full production success must supply those
artifacts or supersede this case with a new report.

## Reusable V4.4 playbook

1. Read current product and category snapshots.
2. Inventory source products and images with stable keys and hashes.
3. Resolve exact entity independently from visual description.
4. Resolve SKU to `VERIFIED_SKU`, `SKU_OMIT`, or `HOLD`.
5. Reconcile by strong identifiers and image evidence before choosing update or
   create.
6. Prepare an immutable V4.4 plan; require validation `PASS` and unchanged
   standard/snapshot hashes.
7. Execute one canary.
8. Require backend save read-back, publish read-back and storefront verification.
9. Execute the remainder in resumable batches with one operation record per
   source key.
10. Reconcile expected versus observed IDs, URLs, image counts and categories.

## Evidence provenance

This case was distilled on 2026-09-19 from the local run
`2026-09-02T14-30-31+08-00-prada-78`, including its frozen manifest,
identity audit, validation report, progress log and operations log. Raw local
paths, browser state and product credentials are intentionally not committed.
