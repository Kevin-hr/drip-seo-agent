# V5 READINESS GAP REPORT

**Date:** 2026-09-18
**Scope:** Phase 5 — architecture gap analysis against the V5 component model.
Analysis only; no code changed.

---

## 1. Component model vs. reality

```text
Collector       ✅ implemented        bridge read + optional live backend read
Vision          ⚠️  partial           images reach the model; nothing persists the verdict
Entity State    ⚠️  partial           exists inside the plan; no registry, no ambiguity detection
PDP Generator   ✅ implemented        deterministic V4.4 composer + validator
Writer          ⚠️  unexercised       plan-based execute exists; browser path never run live
Verification    ✅ implemented        read-back + storefront acceptance
```

Two components are missing entirely from the model as drawn, and both matter:

```text
URL / Redirect Manager      ❌ nothing owns the 301 lifecycle
Rollback / Recovery         ❌ no way to undo a bad write
```

---

## 2. Findings by severity

### P0 — cannot execute safely

**P0-1 · The slug decision corrupts a live URL when the snapshot is stale.**

Confirmed experimentally, not theorised. See
`THOM_BROWNE_SIMULATION_REPORT.md` §7.

```text
existing slug        : Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown
proposed slug        : thom-browne-4-bar-stripe-jersey-stitch-tee-brown
url_change_required  : false      ← no redirect would be created
snapshot.isPublished : false      ← stale; the live page returns HTTP 200
```

`V44Composer.DecideSlug` gates the URL-stability rule on
`snapshot.IsPublished`. When that flag is stale, the composer derives a new slug
and reports that no URL change is required, so no `redirectFrom` is produced.

**Fix (both parts):**
1. `prepare` for a published product must use a fresh snapshot (`live: true`).
2. `DecideSlug` must treat an existing non-harmful slug as stable regardless of
   the published flag, and must set `UrlChangeRequired = true` whenever the slug
   actually changes.

Part 2 is a code change and was out of scope for this verification task.

**P0-2 · No snapshot-freshness guarantee.**

Nothing in the bridge requires a snapshot to be recent, or to have been read from
the live backend, before a plan is built against it. The `snapshot_hash` guard
proves *consistency with the stored snapshot*, not *agreement with reality*. In
the target product's case the stored snapshot was 16 days old and wrong about the
published state.

**P0-3 · The browser execution path has never run live.**

`ChromeController` → `MrshopplusClient` → `FrontendVerifier` compiles and is
wired, but `ExecuteLiveAsync` was never entered during verification. The DOM
selectors in `MrshopplusClient` are unverified against the current MrShopPlus
admin UI. A UI change surfaces as a selector error on the first live execution —
which is the correct failure mode (fail, do not click blindly), but it is
unknown.

### P1 — must fix before production

**P1-1 · The SKU gate has no supplier-code content detection.**
`PKGOD-TB-4BAR` passed the SKU gate when backed by a claimed Tier-2 record; it was
blocked later by the V4.4 content validator because `pkgod` is on the banned
wording list. A supplier code containing no banned token (e.g. `TB4BAR-B12`)
would pass both. The Tier 1–4 evidence requirement is the real control.

**P1-2 · No ChatGPT connectivity.** `mcp.json` still holds
`https://REPLACE-WITH-YOUR-MCP-HOST.example.com/mcp`. A public HTTPS endpoint or a
secure tunnel is required before the MCP surface can be used from ChatGPT.

**P1-3 · No rollback or recovery position for a bad write.** The write contract
is guarded on the way in, but there is no defined way to restore the previous
field values if a written payload proves wrong. The pre-write snapshot exists in
`data/runs/`, so the data to recover is present — the procedure is not.

**P1-4 · No component owns the 301 lifecycle.** V4.4 §10 requires that an old URL
301s directly to the new one. The bridge records `redirectFrom` on a plan, but
nothing configures or verifies the redirect. This is a site-level responsibility
that is currently unassigned.

**P1-5 · Category routes declared but unimplemented.** Five MCP tools exist;
calling them returns `404` from the bridge. Deliberate deferral, but it means the
declared tool surface overstates capability.

**P1-6 · Image ALT is generic on every product.** `ALT-02` fired on every
generated plan. V4.4 §21 wants `Product Name + View/Detail`. The pipeline has no
per-image view labels, so ALT reads `… Product Image 3`. Acceptable as a warning,
not publishable at scale.

### P2 — future improvement

**P2-1 · No entity registry and no sibling-ambiguity detection.** Two live
products share this model with contradictory labels (`…Tee Grown` dark brown vs
`…Tee Medium Brown` light beige). Nothing detects that two live siblings have
conflicting identity, which V4.4 §10 lists as an ambiguity condition.

**P2-2 · The visual verdict is not persisted as evidence.** Images reach the
model and the model decides the colourway, but the reasoning is not stored. The
plan keeps the entity and the evidence records; the visual determination itself
is not a first-class artifact.

**P2-3 · No sitemap verification.** V4.4 §17 and the acceptance criteria mention
sitemap expectations; only URL/canonical are checked.

**P2-4 · Machine-checkable subset only.** The validator covers templates, field
counts, links, banned wording, URL rules and schema. It cannot verify "does the
photograph really show this colourway" or "is the front print as described".
That remains a model judgement, and the bridge correctly does not pretend
otherwise.

**P2-5 · The historical 3.2 CLI remains in the repository.** Decision #006;
requires owner ratification.

### P3 — optimization

**P3-1 · Image loading is sequential.** `fetchImagesForMcp` iterates URLs one at
a time, up to 8 MB each.

**P3-2 · No plan-store housekeeping.** Plans accumulate; there is no retention
policy or listing endpoint.

**P3-3 · Bridge audit log has no rotation.** `data/bridge/events.jsonl` grows
without bound.

---

## 3. Summary table

| ID | Gap | Severity |
|---|---|---|
| P0-1 | Slug decision corrupts a live URL on stale snapshot | **P0** |
| P0-2 | No snapshot-freshness guarantee | **P0** |
| P0-3 | Browser execution path never exercised live | **P0** |
| P1-1 | SKU gate lacks supplier-code content detection | P1 |
| P1-2 | No ChatGPT connectivity (`mcp.json` placeholder) | P1 |
| P1-3 | No rollback / recovery position | P1 |
| P1-4 | No owner for the 301 lifecycle | P1 |
| P1-5 | Category routes declared but unimplemented | P1 |
| P1-6 | Generic image ALT on every product | P1 |
| P2-1 | No entity registry / sibling-ambiguity detection | P2 |
| P2-2 | Visual verdict not persisted | P2 |
| P2-3 | No sitemap verification | P2 |
| P2-4 | V4.4 non-machine-checkable rules uncovered | P2 |
| P2-5 | Historical 3.2 CLI still present | P2 |
| P3-1 | Sequential image loading | P3 |
| P3-2 | No plan retention policy | P3 |
| P3-3 | No audit-log rotation | P3 |

**P0 count: 3. None of the three can be closed by adding features — P0-1 and
P0-2 need a decision plus a small hardening change, and P0-3 can only be closed by
performing a real write, which this phase forbids.**
