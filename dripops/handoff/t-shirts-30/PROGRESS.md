# T-Shirts 30 — handoff progress

> Historical, incomplete handoff. Do not resume under V3. Current interpretation:
> `docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md`.

- 2026-09-07 verified baseline: 11 distinct products.
- PDP 3.1.1 verified: 9; these require upgrade before counting under the default 3.2 decision.
- PDP 3.2 verified: 2 — 536027547297304/HZ3831 and 536027547266582/HZ3830.
- Remaining under the default decision: upgrade 9 existing products and add 19 new verified products.
- Source runs: `t-shirts-first-30-2026-09-01` and `t-shirts-candidate-pool-2026-09-02`.
- Candidate snapshot: 200 products; its published=10 value is stale.
- DripOps self-test passed on 2026-09-07.
- Largest risk: supplier names are unreliable; never infer SKU from supplier text or DC suffixes.
- Next action: create/rescan `t-shirts-30-final-2026-09-07`, snapshot selected IDs, then normalize all 30 under one run.
