# Production Canary Checklist

**Status:** NO-GO until every required item is checked by the operator.

This checklist is the minimum control record for the first real MrShopPlus
write. It is intentionally a human-supervised, single-product procedure. A
completed simulation, passing offline tests, or a healthy bridge does not
authorize a live write by itself.

## Run record

| Field | Value |
|---|---|
| Operator | |
| Date / time (Asia/Shanghai) | |
| Target product ID | |
| Product URL | |
| Plan ID | |
| Run ID | |
| Standard version | `4.4` |
| Standard SHA-256 | `965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7` |
| Snapshot hash | |
| Evidence directory | `reports/evidence/production-canary/<date>-<product-id>/` |

## 1. Preflight — must be complete before opening a live write window

- [ ] The working tree has no unrelated changes; the exact commit is recorded.
- [ ] The canonical V4.4 standard SHA matches the value above.
- [ ] Offline MCP, core, pack, DripOps, and regression tests are green.
- [ ] The dedicated Chrome profile is used and the operator is logged in to
      MrShopPlus with the minimum required permission.
- [ ] The target product ID and current product URL were confirmed from a fresh
      live read; they are not copied from chat memory or an old report.
- [ ] The fresh snapshot is complete and its `snapshot_hash` and capture time
      are recorded.
- [ ] The SKU gate is PASS or the V4.4 `SKU_OMIT` rule is explicitly approved;
      an unresolved identity or HOLD verdict blocks the canary.
- [ ] The immutable plan was reviewed field by field. The write scope is
      explicitly recorded, including whether the product name and URL may
      change.
- [ ] If the URL would change, the 301 owner and redirect evidence are ready.
- [ ] The pre-write snapshot and rollback values are stored in the evidence
      directory.

**Pre-write gate:** `GO` only when all applicable boxes above are checked.
Otherwise stop. Do not call `execute-v44`.

## 2. Canary write — exactly one product

- [ ] Execution mode is explicitly `live`; simulation output is not treated as
      a write result.
- [ ] The request contains only the reviewed `product_id` and immutable
      `plan_id` plus the matching standard identity.
- [ ] The operator remains present while the save and publish flow runs.
- [ ] The result is recorded, including HTTP status, save status, timestamp,
      and any selector or browser error.
- [ ] No batch, retry loop, or second product is started automatically.

## 3. Immediate verification

- [ ] Backend read-back matches the approved title, meta fields, keywords,
      description, and slug.
- [ ] `verify-v44` returns `pass = true`.
- [ ] Non-target fields remain unchanged: price, inventory, images, collections,
      status, SKU, supplier data, and Product ID.
- [ ] The storefront returns HTTP 200, has the expected canonical, title,
      metadata, visible content, and structured data.
- [ ] If the URL changed, the old URL returns one direct 301 to the new URL;
      the new URL returns 200 and has the intended canonical.
- [ ] Sitemap and indexability state are checked where applicable.

## 4. Rollback decision

If any verification item fails, mark the run **FAILED**, stop all further
execution, preserve the evidence, and use the pre-write snapshot to restore the
approved values through the same supervised bridge. Re-run backend and
storefront verification after rollback. Never delete evidence or silently retry.

- [ ] Verification passed and the canary is accepted; batch remains disabled
      until this record is reviewed.
- [ ] Verification failed; rollback was performed and independently checked.
- [ ] Final decision, reviewer, and evidence link are recorded below.

**Final decision:** `GO / FAILED / ROLLED BACK`

**Reviewer:**
**Notes / evidence:**

## Evidence requirements

Keep the following files together under the evidence directory:

- fresh live read response and capture timestamp;
- immutable plan and pre-write snapshot;
- pre-write gate result;
- execute result;
- backend read-back and `verify-v44` result;
- storefront verification;
- rollback result, if applicable;
- the exact commit, standard SHA, and test output.

This checklist closes the documentation gap. It does not claim that a live
write has occurred and does not authorize batch execution.
