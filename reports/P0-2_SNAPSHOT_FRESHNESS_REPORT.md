# P0-2 SNAPSHOT FRESHNESS REPORT

**Date:** 2026-09-18
**Severity:** P0 — plans could be built on data that no longer matches reality
**Status:** **FIXED AND VERIFIED**

---

## 1. The defect

`snapshot_hash` proves that a plan matches the snapshot it was built from. It
proves nothing about whether that snapshot still matches the backend. There was no
age limit and no freshness requirement.

**Observed before the fix:** the target product's snapshot was captured
2026-09-02 and planned on 2026-09-18 —

```text
capturedAt = 2026-09-02T06:50:07+08:00
age        = 388.6 hours (16.2 days)
```

The bridge accepted it without comment. Meanwhile the snapshot's
`is_published=false` did not match the storefront's HTTP 200, and the backend's
SEO fields were empty at capture time.

## 2. The fix

### 2.1 Age limit

New configuration field:

```json
"snapshotMaxAgeHours": 24
```

`DripOpsConfig.SnapshotMaxAgeHours`, default `24`. Set `0` to disable.

Enforced in `BridgeServer.HandlePrepareAsync` **after** the SKU gate and before
any composition — so no plan, no draft and no side effect is produced:

```text
snapshotAgeHours = now - snapshot.CapturedAt
hasStorefrontUrl = existingSlug is non-empty

if (hasStorefrontUrl && snapshotAgeHours > SnapshotMaxAgeHours)
    → 409 stale_snapshot_requires_refresh   (no plan created)
```

The response names the product, the capture timestamp, the measured age and the
configured limit, and tells the caller to re-run with `live: true`.

### 2.2 The gate applies only to products with a storefront URL

A product with no existing slug is a new PDP. There is no live URL to protect and
no stale state to mislead, so it is not age-gated. This is deliberate: gating new
PDPs would block legitimate first-time publication from a batch snapshot.

### 2.3 `live: true` now actually refreshes

Previously `live: true` was only consulted when **no local checkpoint existed**:

```csharp
if (located is null && request.Live) { located = await ReadLiveSnapshotAsync(...); }
```

That made the new freshness requirement unsatisfiable — a stale checkpoint would
be used and the guard would refuse, with no way to proceed. Both `read` and
`prepare` now force a backend read whenever `live: true` is passed, and if that
read fails the call returns `502 live_read_failed` rather than silently falling
back to the stale checkpoint.

That last part matters: silently falling back would make the freshness guarantee
theatre.

## 3. After the fix

```text
aged snapshot (384 h)  → 409 stale_snapshot_requires_refresh, no plan
fresh snapshot (0 h)   → 200, plan created
```

Refusal message as returned:

```text
The local snapshot for 536027551768089 was captured 384.0 hours ago
(2026-09-02T03:29:57.8790000+00:00) and the product already has a storefront URL.
Maximum age is 24 hours. No plan was created. Re-run with live=true to read a
fresh snapshot from the backend.
```

## 4. Tests added

In `tests/p0-remediation.mjs`:

| Assertion | Result |
|---|---|
| Aged snapshot refused with `409 stale_snapshot_requires_refresh` | **PASS** |
| Aged snapshot produces no `plan_id` | **PASS** |
| Refusal message states the measured age | **PASS** |
| Fresh snapshot allowed (`200`) | **PASS** |
| Fresh snapshot creates a plan | **PASS** |
| New PDPs (no existing slug) are not age-gated | **PASS** |

`tests/bridge-acceptance.mjs` was updated because the new guard correctly
interacts with its fixtures: the sandbox holds real run data captured weeks ago,
so the suite now re-stamps its two test products as freshly captured before the
prepare assertions. This touches the sandbox copy only, never production state.
The suite still passes 54/54.

## 5. Important limitation — freshness is necessary but not sufficient

The P0-3 live read returned:

```text
live backend is_published = false
```

So the backend genuinely reports the product as unpublished while its storefront
page is live and indexable. **A fresh snapshot therefore still reports
`IsPublished=false`.**

This means P0-2 alone would **not** have prevented the URL corruption. Only the
P0-1 rule change does that. The two fixes are complementary:

- P0-1 removes the dependence on a flag that is unreliable.
- P0-2 removes the dependence on data that may be outdated.

Neither substitutes for the other, and a live-snapshot workaround for P0-1 would
have appeared to work while leaving the defect in place.

## 6. Residual note

The age gate is checked against `CapturedAt`, which is set by the reader. A
snapshot written by an older `DripOps` build, or edited by hand, could carry a
false timestamp. The bridge trusts the field. Hardening this would mean signing
snapshots or recording the reader's identity; not required for the first live
execution and not implemented.

---

## Files changed

```text
M  dripops/src/DripOps/Configuration/DripOpsConfig.cs   SnapshotMaxAgeHours (default 24)
M  dripops/src/DripOps/Bridge/BridgeServer.cs           age guard; live=true forces refresh
M  dripops/config/dripops.json                          snapshotMaxAgeHours: 24
M  dripops/config/dripops.example.json                  snapshotMaxAgeHours: 24
A  tests/p0-remediation.mjs                             6 freshness assertions
M  tests/bridge-acceptance.mjs                          re-stamps sandbox fixtures as fresh
```
