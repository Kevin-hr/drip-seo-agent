# GSC 895 indexing acceptance contract

This contract prevents a successful page edit or indexing request from being
reported as a successful indexing outcome.

## Immutable scope

- Preserve every row in the original GSC drilldown export.
- The 2026-10-16 export contains 898 exact URL strings. Three pairs differ only
  by letter case, so they form 895 case-insensitive issue groups.
- Never remove a row to improve completion percentages. A duplicate or legacy
  URL remains in the ledger and points to its verified primary URL.
- The structural groups (630 clean paths, 52 trailing-slash paths, 143 legacy
  `/biz/` routes, 53 pagination URLs and 17 AMP-host URLs) are routing labels,
  not diagnoses or prescribed fixes.

## Required page-level decision

Every raw URL must record:

1. the page currently returned and the product/category identity;
2. whether that exact URL should be indexed independently, with evidence;
3. the verified primary URL;
4. rendered content, canonical, internal-link and sitemap observations;
5. the repair rule and canary used, if any;
6. the post-deployment Google crawl and final indexing outcome.

Re-check the live page immediately before changing it. An old crawl or an old
audit is evidence of history, not authority to write.

## Canary boundary

Use one canary per evidence-backed repair rule. Passing one rule never
authorizes applying that change to another structural group or another cause.
A canary must verify the storefront response, rendered identity, declared
canonical, internal links, sitemap relationship and Google live test. HTTP 200
alone is insufficient.

Pagination is decided by content comparison. A real page 2+ keeps its own
canonical; a `?page=1` duplicate may consolidate only after its content and
preferred address are verified.

## Outcome semantics

Only these outcomes count as resolved:

- `INDEXED`: the URL should be independently indexed and a post-fix Google
  inspection confirms the correct URL is indexed.
- `CONSOLIDATED_TARGET_INDEXED`: the original URL should not be independently
  indexed, consolidation is correct, and Google confirms the verified primary
  target is indexed. Report this separately; do not claim the original URL was
  indexed.

These outcomes are not resolved:

- `AWAITING_GOOGLE_RECRAWL`;
- `RECRAWLED_STILL_NOT_INDEXED`;
- `TECHNICAL_ERROR_UNRESOLVED`;
- `CONTENT_QUALITY_UNRESOLVED`;
- a successful live test, sitemap submission or indexing request by itself.

Run the gate in three stages:

```powershell
node scripts/validate-gsc-indexing-ledger.mjs --mode baseline
node scripts/validate-gsc-indexing-ledger.mjs --mode report
node scripts/validate-gsc-indexing-ledger.mjs --mode complete
```

`baseline` protects the source scope, `report` requires every row to have a
truthful classification/evidence trail, and `complete` additionally rejects any
remaining unresolved row.

## Sitemap reconciliation

Sitemap file count is not a coverage metric. Compare current published backend
entities with the live sitemap URL set. Keep missing URLs, extra URLs and
duplicate URLs as separate findings. Re-run this comparison after publication
changes and before final indexing claims.
