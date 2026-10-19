# 188 Category URL Google Indexing Ledger

- Property: `sc-domain:dripsneakers.org`
- Sitemap: `https://www.dripsneakers.org/sitemap-product-category.xml`
- Checked: `2026-10-19T00:27:43.051Z`
- Ordered URLs inspected: **188 / 188**
- Inspection failures: **0**
- Confirmed submitted and indexed: **8**
- Unresolved: **180**

## Coverage baseline

| Coverage state | Count |
|---|---:|
| Crawled - currently not indexed | 57 |
| URL is unknown to Google | 99 |
| Submitted and indexed | 8 |
| Soft 404 | 1 |
| Discovered - currently not indexed | 23 |

## Acceptance rule

A URL is not counted as solved merely because inspection ran, a sitemap was submitted, or indexing was requested. It is resolved only when either:

1. the independently indexable category URL is reported by Google as `Submitted and indexed`; or
2. evidence proves it should consolidate, the canonical/redirect is correct, and the target URL is indexed. Consolidations must be counted separately from original-URL indexing.

The `requires_independent_indexing` field remains pending until current page identity, rendered content, canonical, robots directives, internal links, and duplication are checked. The ledger preserves all original URLs and strict sitemap order.


## Current page and backend evidence

- Rendered pages checked: **188 / 188**
- HTTP 200: **188**
- Self-canonical matches: **188**
- `noindex`: **0**
- Frontend product results: **147 non-empty / 41 empty**
- Backend published category URLs: **188**, with exact sitemap match
- Backend category member reads: **188 / 188**, failures **0**
- Custom SEO title and description present: **40**
- Category description present in backend: **35**
- Category description rendered in the Air Jordan 4 frontend canary: **no**; the current theme omits it from HTML/DOM
- Pre-fix internal linking: **57 linked / 131 orphaned**
- Post-fix internal linking: **188 linked / 0 orphaned**

## Executed canary fix

On 2026-10-19, a `Shop by Category` custom page was created in MrShopPlus:

- Backend page ID: `543938775751699`
- Public URL: `https://www.dripsneakers.org/shop-by-category`
- Public HTTP: **200**
- Canonical: exact self-canonical
- H1: exactly one
- Ordered directory content: **188 unique category links**
- Included automatically in `sitemap-custom.xml`
- Added to the `SHOP` navigation with menu-item ID `543939228200733`
- Verified from the live homepage and from a second 190-source crawl

The menu dialog's Save action writes immediately. The first run labelled as a dry run created the item; the script has been corrected so future dry runs stop before that action.

## Outstanding outcomes

| State | Count | Current treatment |
|---|---:|---|
| Submitted and indexed | 8 | Resolved and retained |
| Crawled, currently not indexed | 57 | Re-evaluate after recrawl; separate quality work remains |
| Discovered, currently not indexed | 20 | Await crawl after the new HTML inlink |
| URL unknown to Google, non-empty | 63 | Await discovery after the new HTML inlink |
| Empty category and not indexed | 40 | Requires product mapping or an explicit consolidation/closure decision |
| Empty category but currently indexed | 1 | Indexed now, but quality risk remains |
| Soft 404 | 1 | `/Loewe/`; empty category requires a business decision |

The combined ordered evidence is in `188-category-evidence-ledger.csv`. No unresolved URL is counted as solved.
