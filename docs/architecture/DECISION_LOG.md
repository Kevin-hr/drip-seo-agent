# Decision Log

Binding engineering decisions. A decision here overrides convenience and
preference. Changing one requires a new entry that explicitly supersedes it.

---

## Decision #001

**Date:** 2026-09-18

**Decision:** V4.4 CLEAN_CONSOLIDATED is the only active SEO-PDP standard.

**Rejected:** SEO/PDP 3.2

**Reason:** 3.2 requires verified SKU. V4.4 allows VERIFIED_SKU / SKU_OMIT / HOLD.

**Action:** Reuse DripOps execution layer only. Replace SEO decision layer.

---

## Decision #002

**Date:** 2026-09-18

**Decision:** The plugin and the bridge both compute the standard's SHA-256 at
startup and refuse to proceed on any mismatch.

**Pinned value:**

```text
5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8
```

**Reason:** Two revisions of a document that both call themselves "V4.4 STANDARD
— FINAL" existed in the project. One was used for a 106-product production run
(`965314CD…`), the other was bundled with the plugin (`5FB8457F…`). A document
name is not an identity; a hash is.

**Action:**
- Canonical file: `standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md`.
- The superseded `STANDARD_FINAL` is kept in `standards/_superseded/` for history only.
- Every tool result and every bridge response carries `standard_version` and `standard_hash`.
- `STANDARD_EXPECTED_SHA256` makes startup fail closed on drift.

---

## Decision #003

**Date:** 2026-09-18

**Decision:** The bridge is routed **before** DripOps loads the 3.2 machine
standard.

**Reason:** Making the rule "the bridge must not use 3.2" a matter of developer
discipline is not enforceable. Making it structurally impossible is.

**Action:** In `Program.cs`, `serve` returns before `MachineStandard.Load` is
reached, so the bridge has no code path that can read 3.2 rules.

**Consequence:** The existing 3.2 CLI commands (`compose`, `apply`, …) remain
functional and unmodified for backward compatibility.

---

## Decision #004

**Date:** 2026-09-18

**Decision:** Bridge audit events are written to `data/bridge/events.jsonl`, not
into the shop run state.

**Reason:** `prepare` must be provably write-free with respect to the shop. An
earlier implementation reused `RunStore.AppendEvent`, which appended into
`data/runs/{run}/events.jsonl` and broke that property.

**Action:** `prepare` writes only under `data/bridge/`. Only a real `execute`
touches `data/runs/`. The acceptance suite asserts the `data/runs` tree is
byte-identical before and after `prepare` and after a simulated `execute`.

---

## Decision #005

**Date:** 2026-09-18

**Decision:** `--mode simulate` is a server-side switch, not a request field.

**Reason:** The write contract must accept only `product_id` and `plan_id`. Adding
a `dry_run` field to the request would weaken that contract and give a caller a
way to influence write behaviour.

**Action:** `DripOps serve --mode live|simulate`. A simulated execution is
labelled `SIMULATED` in `save_status` and never touches run state, so it cannot be
mistaken for a real write.

---

## Decision #006

**Date:** 2026-09-18

**Status:** **requires ratification — deviation from the Phase 0 instruction**

**Context:** The Phase 0 instruction states that SEO/PDP 3.2 must not be copied
into this repository. However, the copied `dripops/` codebase contains
`dripops/standards/SEO-PDP-3.2.json` (and `SEO-PDP-3.1.1.*`) as build inputs
referenced by `DripOps.csproj` and by the historical CLI's config
(`standardPath`).

**Decision taken (provisional):** keep the code copy faithful and green. The
**top-level** `standards/` directory contains only the canonical V4.4 document,
with historical revisions confined to `standards/_superseded/`. The
`dripops/standards/` copies remain because removing them changes the frozen
codebase's build and runtime behaviour, which Phase 0 forbids.

**Rationale:** Phase 0 is a freeze, not a refactor. Silently breaking the
already-PASS `dotnet build` / `self-test` would violate the freeze; silently
ignoring the instruction would be dishonest. Surfacing it is the correct
resolution.

**Proposed follow-up (not part of Phase 0):** retire the 3.2 CLI, then delete
`dripops/standards/SEO-PDP-3.2.*` and `SEO-PDP-3.1.1.*` together with the
`SeoPdpComposer` / `SeoPdpValidator` rule classes, leaving V4.4 as the only
standard anywhere in the repository.

**Needs:** the project owner's ratification.

---

## Decision #007

**Date:** 2026-09-18

**Decision:** The canonical standard keeps its full filename including the date
(`…_CLEAN_CONSOLIDATED_2026-09-17.md`) in this repository.

**Reason:** The Phase 0 tree sketch showed a shortened name
(`Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED.md`). Introducing a second name
for the same document recreates exactly the ambiguity Decision #002 exists to
eliminate — two documents that look like the same standard.

**Action:** one document, one name, one hash, everywhere.

---

## Decision #008

**Date:** 2026-09-19

**Decision:** The user-approved `Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`
is the only active SEO-PDP standard. This decision explicitly supersedes the
active-standard identity selected by Decisions #001, #002 and #007; their
historical rationale remains recorded above.

**Pinned value:**

```text
965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
```

**Action:**
- Canonical file: `standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`.
- The former `CLEAN_CONSOLIDATED_2026-09-17` revision is retained only in
  `standards/_superseded/`.
- Plugin, bridge, bundled skill reference, configuration, tests and hash locks
  must all resolve to the same filename and SHA-256.
