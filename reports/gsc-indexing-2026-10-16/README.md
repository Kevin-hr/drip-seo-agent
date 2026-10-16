# DripSneakers GSC indexing baseline — 2026-10-16

Status: **not resolved**. This directory establishes a traceable baseline; it
does not claim that the affected URLs were fixed or indexed.

## Source integrity

- Source archive: `dripsneakers.org-Coverage-Drilldown-2026-10-16.zip`
- SHA-256: `3BEEB58A8BC3DEB32656710A8D634208B3638F32AE8F63D67EFF3077AE1BE942`
- Export issue: `Crawled - currently not indexed`
- CSV data rows: 898
- Exact duplicate URL strings: 0
- Case-insensitive URL groups: 895
- Case-variant groups: 3

The ledger therefore contains all 898 original URL strings and maps them to
895 case-insensitive issue groups. No case variant was discarded.

## Real GSC verification

The GSC Wizard connection for `sc-domain:dripsneakers.org` was queried on
2026-10-16. All 898 source rows now have a current URL Inspection record:

- 897: `Crawled - currently not indexed`;
- 1: `Not found (404)` — `Ksubi-Relaxed-Straight-Fit-Jeans-KS9028`, last
  crawled 2026-10-15T21:38:46Z.

The three source URLs missing from the prior tracker snapshot were inspected
directly. The BAPE and Vans URLs remain crawled/not indexed with matching
Google/user canonicals. The Ksubi URL changed from the export state to 404.

`DM7866-104` has two case variants. Both were crawled successfully on
2026-10-05, but both declare the unrelated
`nike-air-force-1-low-travis-scott-sail-aq4211-101` URL as canonical. This is a
current, evidence-backed canonical fault and is the first candidate canary for
that repair rule. No production write was made during this audit.

## Live sitemap reconciliation

Read-only MrShopPlus API data was reconciled with the live XML sitemaps:

| Scope | Backend published | Sitemap rows | Unique URLs | Missing | Extra |
|---|---:|---:|---:|---:|---:|
| Product categories | 188 | 188 | 188 | 0 | 0 |
| Products | 5,802 | 5,802 | 5,801 | 0 | 0 |

The product sitemap contains one duplicated URL because two published products
share `/Top-Quality-Brunello-Cucinelli-Henley-collar-T-shirt-White`:

- product `536027467169560`;
- product `536027467120409`.

This is a separate identity/URL collision and must not be hidden by a unique
URL count. The earlier GSC sitemap report showed 5,798 submitted product rows,
whereas the live sitemap had 5,802 during this audit; that difference is timing,
not evidence of four missing live sitemap URLs.

## Current acceptance state

- Source preservation: PASS.
- Current GSC inspection coverage: PASS (898/898).
- Page-level independent-indexing decisions: NOT STARTED.
- Rule-specific canaries: NOT STARTED.
- Repairs: NOT STARTED.
- Post-fix recrawl/index verification: NOT STARTED.
- Claim that 895 groups are solved: **FORBIDDEN**.

Use `895-casefold-groups-898-url-ledger.csv` as the sole row-level ledger and
the acceptance contract in `docs/operations/GSC_INDEXING_895_ACCEPTANCE.md`.
