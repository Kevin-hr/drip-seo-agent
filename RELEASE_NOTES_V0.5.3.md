# v0.5.3 — V4.5 Canary and Safe Description Policy

Release date: 2026-09-23

## Highlights

- Packages the consolidated SEO-PDP V4.5 standard, migration notes and integrity verifier.
- Records the first successful live V4.5 MrShopPlus Canary and complete evidence chain.
- Adds TypeSafe/Jev exact-entity, SKU and image-conflict gating for the Canary workflow.
- Adds a reusable V4.5 Description policy:
  - main-gallery `ImgList` images are never copied into Description;
  - detail images must be supplied explicitly;
  - gallery/detail URL overlap fails closed;
  - no independent detail images produces an empty Description.
- Adds a guarded single-product remediation path with backup, single-ID save receipt,
  backend invariant comparison and storefront verification.
- Includes the existing Gucci V4.4 judgment-layer and first batch entity-lock commits.

## Live evidence

Product `536027542763285` was published as:

`Nike Kobe 6 Protro Kay Yow Think Pink (2026)` / `IQ9317-001`

The initial duplicate Description images were removed. Final verification confirms:

- `IsShow=true`;
- HTTP 200 storefront;
- correct Title, H1, canonical and Meta;
- exactly five Product Details fields;
- 12 main-gallery images preserved;
- zero duplicated Description images;
- zero drift in protected backend fields.

## Verification

```text
python standards/V4.5/_verify_v45.py
RESULT: PASS - no V4.4 clause lost

node tests/v45-description-policy.mjs
{"pass":true,"cases":3}
```

## Operational boundary

This release does not convert VERIFY or HOLD products into publication candidates.
Every batch must begin with a fresh live snapshot and retains per-product backup,
immutable decision, single-target save receipt and readback requirements.
