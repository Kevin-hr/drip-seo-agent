# Main sync clean review — 2026-10-16

Decision: **NO-GO for a single merge into `main`**.

The review branch contains the latest `origin/main` and is zero commits behind.
The codebase tests pass, but the consolidated historical branch is too broad
and carries unresolved security, portability and repository-hygiene risks.

## Verified passes

- `origin/main` is an ancestor of the review branch (0 behind).
- MCP typecheck, 19 unit tests and package check pass.
- DripOps Release build and self-test pass with zero warnings/errors.
- SEO Core (93 checks) and Prada pack (59 checks) pass.
- Historical T-shirts and Prada regression suites pass.
- GSC baseline integrity gate passes: 898 exact URL rows, 895 casefold groups.
- Common AWS, GitHub, OpenAI and private-key patterns: 0 matches.
- GitHub Actions contain no `saveModify`, publish, commit or sitemap-submission
  invocation; pushing this branch does not update MrShopPlus production data.

## Merge blockers

1. **Unreviewable scope:** before the new audit artifacts, the branch was 186
   commits ahead of `main`, changing 973 files with roughly 496,969 insertions.
2. **Oversized binary artifacts:** six tracked PNG files are 66–94 MB each.
   They are below GitHub's individual 100 MB rejection threshold but are not
   appropriate in a general source-code PR.
3. **Patch hygiene:** `git diff --check origin/main...HEAD` reports 15,423 lines,
   predominantly trailing whitespace in captured HTML/raw research artifacts.
4. **High-severity dependency advisory:** both `mcp-plugin` and `tests` install
   `@modelcontextprotocol/sdk` in the affected 1.12.0–1.30.1 range for
   GHSA-6qxp-vccf-f47h. A fix is available but was not applied during review.
5. **Machine-specific paths:** 116 tracked references contain
   `C:\Users\Administrator`, limiting portability and exposing local layout.
6. **Production-capable scripts:** 79 non-doc references include `saveModify`,
   publish/commit flags or related write surfaces. They are not invoked by CI,
   but need quarantine, explicit dry-run defaults and ownership review before a
   broad merge.
7. **Indexing objective remains open:** all 898 source URL strings are now
   traceable, but 0 are accepted as resolved. One currently returns Google 404,
   897 remain crawled/not indexed, and page-level classifications/canaries have
   not started.

## Required split before merge

- Keep the GSC acceptance contract, source export and immutable ledger in a
  dedicated indexing-audit PR.
- Move large images/raw HTML to an artifact store or Git LFS and retain only
  checksums/manifests in source control.
- Upgrade and regression-test the MCP SDK in an isolated dependency PR.
- Separate production writers from read-only analysis; require explicit commit
  switches, rollback artifacts and no CI invocation.
- Replace machine-specific paths with configuration/environment variables.
- Split product remediation histories and influencer/Reddit research into
  independently reviewable PRs.

Do not interpret this branch's successful tests as authorization to merge or as
evidence that the 895 indexing groups are solved.
