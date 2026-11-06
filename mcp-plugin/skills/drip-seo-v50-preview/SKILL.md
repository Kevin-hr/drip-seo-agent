---
name: drip-seo-v50-preview
description: Read-only preview of Drip Sneakers SEO-PDP V5.0; does not authorize writes or replace the V4.4 production executor.
---
# Drip SEO V5.0 — Migration Preview

Reference: `references/Drip_Sneakers_SEO-PDP_V5.0_STANDARD_FINAL.md` (SHA-256 pinned).

## Execution contract

- **PRODUCTION WRITES DISABLED:** This Skill is only for research, candidate generation, dry-run gate checks, and preparing migration evidence. Never call a V4.4 write endpoint with a V5 plan or vice versa.
- Begin from actual storefront images and compare exact physical details against independent exact-product references. A legacy URL/name/SKU is only a search lead, never identity proof. If images cannot be visually reviewed, HOLD.
- For sets, distinguish the actual default purchase unit (single hoodie / pants / full set). Confirm option, price, size, dynamic add-to-cart/checkout without assuming static `Sold Out` means unavailable.
- Verified SKU must belong to the exact item/variant; an SKU for a component is not a set SKU. Omit SKU entirely when unverified.
- Preserve ALL V4.6 rules: SKU omission; SERP Meta prioritizes exact identity, reps, SKU if verified, QC photos / 30-day returns / 7–20 day shipping; URL Slug no slash/domain; Canonical full URL; verified relative brand link, Chanel `/Chanel/`; one sentence + five Product Details; image-only backend Description if text is crawlable.
- Do not fabricate supplier origin, materials, fit, inventory, offer values, ratings, testimonials or indexing results.
- Include Product Schema/Offer only when rendered product facts support it; record mobile 360/768 and dynamic variant evidence.
- A preview gate PASS is **NOT** evidence of a live publish. A real V5 publish requires a separate reviewed bridge migration and supervised canary.

## Staged promotion

1. Review branch + new canonical standard + loaders + tests.
2. Run CI and failure-mode regressions.
3. Design V5 immutable plan format and bridge `/prepare-v50`, `/execute-v50`, `/verify-v50` (not implemented by this preview bundle).
4. Execute one SIMULATED canary with fresh snapshots and proof the V4.4 path is unchanged.
5. Merge only after explicit owner approval and green CI; production promotion requires a separate explicit change.
