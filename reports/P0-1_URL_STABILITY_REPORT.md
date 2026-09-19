# P0-1 URL STABILITY REPORT

**Date:** 2026-09-18
**Severity:** P0 — could corrupt an indexed production URL
**Status:** **FIXED AND VERIFIED**

---

## 1. The defect

`V44Composer.DecideSlug` gated the URL-stability rule on
`snapshot.IsPublished`:

```csharp
var hasLiveUrl = snapshot.IsPublished && !string.IsNullOrWhiteSpace(currentSlug);
...
if (hasLiveUrl) { /* stability rule */ }
return new SlugDecision(ResolveTargetSlug(...), false, currentUrl);  // ← silent replacement
```

When `IsPublished` was false, the composer fell through to deriving a
replacement slug and reported `UrlChangeRequired = false`. The result was a plan
that changed the URL while declaring that no URL change was required — so no
`redirectFrom` was produced and no 301 would be configured.

**Observed before the fix, on the real target product:**

```text
existing slug        : Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown
proposed slug        : thom-browne-4-bar-stripe-jersey-stitch-tee-brown
url_change_required  : false      ← wrong
redirect_from        : null       ← so no 301
snapshot.isPublished : false
storefront URL       : HTTP 200, canonical=self, not noindex
```

## 2. A finding that changed the severity assessment

During the P0-3 live read the backend was queried directly, and it returned:

```text
live backend is_published = false
```

So `IsPublished=false` is **not** a stale-snapshot artifact. The MrShopPlus
backend genuinely reports the product as unpublished while the storefront serves
it at HTTP 200 with a self-canonical and no `noindex`.

Consequence: **a fresh live snapshot would not have fixed this.** The old code
would still have taken the "no live URL" branch and silently replaced the URL.
The defect was in the rule, not in the data. Had this shipped, the first live
execution on this product would have broken an indexed URL with no redirect —
and a live-snapshot workaround would have appeared to fix it while not doing so.

## 3. The fix

`dripops/src/DripOps/Rules/V44/V44Composer.cs` — `DecideSlug` rewritten. The
published flag is no longer consulted at all.

```text
1. migrate_url requested      → derive target; change = target differs from existing
2. no existing slug           → derive target; change = false (new PDP, nothing to protect)
3. existing slug has a harmful token → derive target; change = target differs
4. existing slug is clean     → KEEP IT VERBATIM; change = false

INVARIANT (applied last): if an existing slug is present and the final slug
differs from it, UrlChangeRequired is forced true.
```

Rule 4 is the stability guarantee. The invariant is the safety net: a differing
slug can never be reported as requiring no change.

Two helpers were added: `IsSameSlug` (normalises leading/trailing separators) and
`HasHarmfulSlugToken` (V4.4 §6/§10 triggers — supplier wording, marketing filler,
broken slug residue, malformed pattern), which is now independent of the
published flag.

`dripops/src/DripOps/Bridge/BridgeServer.cs` — two warnings added so a URL change
is visible in every `prepare` response:

| Code | Fires when | Purpose |
|---|---|---|
| `URL-10` | the product has a storefront URL **and** the plan changes it | states the old and new URL, states that a 301 must be configured at site level, and shows the recorded `redirectFrom` |
| `URL-11` | `snapshot.IsPublished` is false **and** the product has a slug | flags that the published flag is untrustworthy for this product |

Warnings, not errors: they inform the human review gate rather than blocking, and
they do not change any pass/fail outcome.

## 4. After the fix

Same product, same input:

```text
existing slug       = Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown
proposed slug       = thom-browne-4-bar-stripe-jersey-stitch-tee-brown
url_change_required = true                                                    ← fixed
redirect_from       = https://www.dripsneakers.org/Top-Quality-Thom-Browne-...← present
validation_status   = PASS
warnings            = [ALT-02, URL-10, URL-11]
```

## 5. Tests added — `tests/p0-remediation.mjs`

| Case | Input | Expected | Result |
|---|---|---|---|
| CASE-1 | existing harmful slug (`Top-Quality-…`), no migrate flag | change flagged, `redirectFrom` = old URL, `URL-10` present | **PASS** |
| CASE-2 | existing clean slug (`chrome-hearts-tee-black-legacy`), no migrate flag | slug kept verbatim, no change flagged, no `redirectFrom` | **PASS** |
| CASE-3 | existing clean slug, `migrate_url: true` | change flagged, `redirectFrom` = old URL | **PASS** |
| CASE-4 | invariant across all three plans | differs ⇒ flagged; identical ⇒ not flagged | **PASS** (3 plans, 0 violations) |

CASE-2 uses a controlled sandbox slug deliberately different from the composer's
derived slug, so it proves the composer *keeps* an existing slug rather than
"improving" it. CASE-1 covers the harmful-token path on real data.

**17 / 17 assertions pass.** No regression: bridge acceptance 54/54, MCP E2E
30/30, plugin tests 19/19, `dotnet build` 0/0, `self-test` ok.

## 6. Blast radius — this is not a single-product problem

Scan of all product checkpoints in the run data:

| Slug state | Products |
|---|---|
| contains a harmful token (`Top-Quality-`, supplier/marketing wording) | **187** |
| empty (never had a URL) | 872 |
| clean | 205 |

187 products would have been exposed to the silent-replacement path. Every one of
them now produces an explicit migration flag with a recorded redirect source
instead.

## 7. What is still a decision, not a bug

The fix makes a URL change **explicit and auditable**. It does not decide whether
the change should happen. For the Thom Browne product the existing slug contains
`Top-Quality`, which V4.4 §6 lists as marketing filler, so V4.4 §10 requires a
migration — but that migration needs a 301 at site level, which is outside this
repository. Decision **D2** remains open:

- (a) keep the existing URL untouched (requires suppressing the migration), or
- (b) migrate and plan the 301.

Option (b) is now safe to attempt because `redirectFrom` is recorded. Option (a)
would need a policy flag, since the composer correctly identifies the slug as
non-compliant.

---

## Files changed

```text
M  dripops/src/DripOps/Rules/V44/V44Composer.cs     DecideSlug rewritten + 2 helpers
M  dripops/src/DripOps/Bridge/BridgeServer.cs       URL-10 / URL-11 warnings
A  tests/p0-remediation.mjs                          17 assertions
M  tests/bridge-acceptance.mjs                       re-stamps sandbox snapshots as fresh (P0-2)
```
