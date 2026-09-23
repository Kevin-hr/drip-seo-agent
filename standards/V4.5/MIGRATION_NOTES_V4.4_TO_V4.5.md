# V4.4 → V4.5 Migration Notes and Adversarial Review

Date: 2026-09-21
Prepared for: Drip Sneakers SEO-PDP standard upgrade
Status: **Revision built and verified. Active-standard switch NOT performed.**

| Artifact | Path | SHA-256 |
|---|---|---|
| Active standard today | `../V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md` | `5FB8457F049615B467E54B4A4D4FDB59DD39A4B6A73172020B12FA1FEDBF3BF8` |
| Merged V4.5 revision | `Drip_Sneakers_SEO-PDP_V4.5_CLEAN_CONSOLIDATED_2026-09-21.md` | `224429ED857DBAF909E9DCB6F0C615001D621D1C5E98CF5D1783AAFBDB07DBB1` |
| V4.5 as delivered, frozen | `Drip_Sneakers_SEO-PDP_V4.5_STANDARD_AS_DELIVERED_2026-09-21.md` | `49F223F00F07C4BD93E7D2A7FECDFB07B1C59AD112AFACE98CA0AC772613BD59` |

---

# 1. Headline conclusion

The V4.5 text as delivered is **not a superset of V4.4**. It is a summary-style
rewrite that covers the substance of 10 of the 29 V4.4 sections, reduces 6, and
**omits 13 outright**.

Its own §1 states the intent — "V4.5 不推翻 V4.4，而是在 V4.4 基础增加" — and its
final positioning line states `V4.5 = V4.4 SEO System + Product Intelligence
Layer`. The delivered text does not satisfy either claim: the "V4.4 SEO System"
half is partially absent from it.

Adopting the delivered text as the active standard would therefore **silently
delete** the Source Priority hierarchy, the Sample / Unreleased rule, the
Crawlability Hard Gate, the User Decision Layer, the Three-Pass Audit, the fixed
10-field output order, and seven other rules — with no error and no warning. The
gate would still report PASS.

**Action taken:** the V4.5 revision was built as a **merge** — every V4.4 section
retained under its original number, V4.5 layers added as suffixed sections
(§3A, §4A, §5B, §15A, §17A, §23A). The delivered text is preserved verbatim as a
frozen record but is explicitly marked as not usable as a decision layer.

---

# 2. Section-by-section coverage of V4.5 as delivered

| V4.4 section | Fate in V4.5 as delivered | Note |
|---|---|---|
| 0 Core Principle | carried | V4.5 §0 |
| 1 Upgrade list | carried | V4.5 §1 |
| 2 Execution Order | carried | V4.5 §2, re-ordered |
| **3 Source Priority (T1–T8)** | **omitted** | no equivalent anywhere |
| 4 Exact Entity Hard Gate | partial | pass conditions in V4.5 §4; visual in §3 |
| 5 Independent SKU Rule | partial | evidence list dropped |
| **5A Sample / Unreleased / F&F** | **omitted** | |
| 6 Product Naming Standard | partial | gender-word ban list dropped |
| **7 SEO Title** | **omitted** | no SEO Title rule at all |
| **8 SEO Keywords** | **omitted** | |
| 9 Meta Description | partial | template kept; priority, exception, guard, reference dropped |
| 10 URL / Canonical | partial | 301 chain kept; stability rule dropped |
| **11 Backend Placement Layer** | **omitted** | |
| 12 Key Description Composition | partial | rule kept; HTML template dropped |
| **13 No Redundant Product-Name Repetition** | **omitted** | |
| 14 Product Details Semantic Role | carried | V4.5 §10 |
| 15 Mandatory Verified Internal Link | carried | V4.5 §11 |
| 16 Description Image-Only | carried | V4.5 §12 |
| **17 Crawlability Hard Gate** | **omitted** | |
| **18 Why Product Details sits inside Key Description** | **omitted** | |
| **19 PDP Description vs Backend Description** | **omitted** | |
| 20 Product Schema | carried | V4.5 §14 |
| 21 Image ALT | carried | V4.5 §13 |
| **22 User Decision Layer** | **omitted** | |
| **23 Three-Pass Audit** | **omitted** | V4.5 §16 is a flat boolean list, not equivalent |
| **24 Hellstar Reference Implementation** | **omitted** | |
| **25 Final SEO-PDP Output Order (10 fields)** | **omitted** | |
| 26 Final Gate | carried | V4.5 §17 |
| 27 Final Rules | carried | V4.5 §18 |

Counts: 10 carried · 6 partial · 13 omitted.

The most damaging omissions, in order:

```text
1. Source Priority T1–T8   — without it, web results are interchangeable and
                             counterfeit-marketplace pages become usable evidence
2. Output Order (10 fields) — the operational output contract for every PDP
3. Crawlability Hard Gate  — the placement model is void without it
4. Three-Pass Audit        — the only staged self-check in the system
5. User Decision Layer     — the four non-negotiable user questions
6. Sample / Unreleased F&F — the rule that makes PASS-WITHOUT-SKU legitimate
7. Gender-word ban list    — a public-field exclusion that is easy to violate silently
8. SEO Title / SEO Keywords rules
```

---

# 3. Adversarial findings on the delivered V4.5 text

Severity: P0 = would ship a wrong or unverifiable result · P1 = would corrupt
process or destroy evidence · P2 = defect, contained.

| # | Sev | Finding | Disposition |
|---|---|---|---|
| A | P0 | Delivered V4.5 omits 13 V4.4 sections and reduces 6. Direct replacement is a silent regression. | Fixed — built as a merge |
| B | P0 | §3 promotes visual fingerprint to "Hard Gate" with no falsification limit, while §4 requires evidence beyond visual for PASS. Two sections disagree about what vision may decide. | Fixed — §3A adds the one-directional limit |
| C | P1 | §1 and §18 claim V4.5 is "可机器执行". §16's checklist contains `visual_match`, `brand_verified`, `model_verified`, `colorway_verified` — none machine-evaluable. | Fixed — §23A splits Group A / Group B, fail-closed |
| D | P1 | §1 lists "Internal Reference Protection" as a new layer. The rule already exists as V4.4 §5 / §5A. | Reclassified — restated, not new authority |
| E | P1 | §2 places Product Name Cleanup at step 2, before entity confirmation. Cleanup presupposes a locked entity; running it first can sanitize a name that later proves to describe a different product, which then reads back as evidence. | Corrected — moved to step 8 |
| F | P1 | §11 "Brand row 必须真实内部链接" is weaker than V4.4 §15's "never invent a category URL". The site has confirmed-404 paths in circulation. | Fixed — §15A requires a 200 probe and lists the 404 blocklist |
| G | P1 | §7 requires a 301 redirect chain. Whether the mrshopplus DTB backend can express a custom 301 has never been probed. V4.4 §10 carries the same unverified requirement. | Flagged — platform capability probe required |
| H | P2 | Schema in both V4.4 §20 and V4.5 §14 has no `offers`. Google Product rich results require `offers` (or `review` / `aggregateRating`). The current schema declares the entity but cannot produce a rich result. | Flagged — deliberate omission or defect, needs a decision |
| I | P2 | §13 requires ALT to "pass Image Fingerprint". If the fingerprint is itself unverified, the requirement is circular. | Clarified — ALT must name the specific product, not the category |

## 3.1 Evidence behind findings B and C

**B.** On 2026-09-21 two distinct LV Skate products entered intake:

```text
LV Skate Sneaker White Brown                    image batch 1D47CC
LV Skate Sneaker White Brown With Rhinestones   image batch 1D47CE
```

They differ only by the presence of gold rhinestones. They were separated by
slug plus SKU plus per-image checksum comparison — not visually. Any standard
that lets a visual match constitute verification would merge them. Verified
across 78 images in 9 existing LV Skate directories with zero cross-product
checksum intersection.

**C.** A checklist key that cannot be computed will still be executed by an agent
that has been told the checklist is machine-runnable. The failure mode is not a
crash; it is `"visual_match": true` written by a process that never checked.
Because Group B keys are exactly the identity-critical ones, their silent default
to true is the highest-consequence defect in the delivered text.

---

# 4. What was actually built

`Drip_Sneakers_SEO-PDP_V4.5_CLEAN_CONSOLIDATED_2026-09-21.md`
— 1,768 lines, 39,797 bytes, SHA-256 `B56456E1…FA413D`.

Design constraint: **no deletion, no renumbering.** V4.4 sections keep their
numbers, so `§5`, `§5A`, `§9`, `§23`, `§25` and every existing cross-reference in
code, tests and documentation remain valid. V4.5 material is inserted as:

| New section | Content | Addresses |
|---|---|---|
| §3A Image Fingerprint Hard Gate | 8 observation dimensions; explicit falsification limit; vision-agent output schema restricted to observation | B |
| §4A Entity Confidence Status | ENTITY PASS / PASS WITHOUT SKU / VERIFY / HOLD; authorization map per status | §4 of delivered text |
| §5B SKU Field Isolation | four identifier classes and their routing; one field holds one class | §5 of delivered text |
| §15A Brand Architecture Layer | Brand → Collection → PDP; mandatory 200 probe; verified 200 / 404 site blocklist | F |
| §17A Batch Agent Execution Mode | pipeline, frozen candidate set, full-catalogue precondition, duplicate evidence | §15 of delivered text |
| §23A Machine vs Human Validation | Group A machine-checkable / Group B human-attested; fail-closed on absence | C |

Also folded in: §0 gains the V4.5 upstream condition; §1 records the additions and
corrects the "new layer" claims; §2 carries the 12-step order with the step-8
correction (E); §6 gains the supplier-wording list without weakening the
gender-word ban; §12 gains the fifth-field priority and the Country-Origin
prohibition; §21 gains the specificity requirement (I); §26 is the merged gate
with 18 lines; §27 gains the twelve V4.5 rules.

## 4.1 Verification performed

| Check | Result |
|---|---|
| All 49 V4.4 headings present or accounted for as retitles | PASS |
| All 6 new V4.5 sections present | PASS |
| 22 load-bearing V4.4 clauses still present | PASS |
| All 16 original gate items retained in the merged gate | PASS |
| Markdown fence parity | PASS (242, even) |
| Reproducible from V4.4 base | PASS (identical SHA-256 on re-run) |

Scripts: `_merge_v45.py`, `_verify_v45.py`. The merge reads V4.4 directly; it does
not depend on an intermediate copy. Re-running it regenerates the same bytes.

---

# 5. Switch checklist — NOT yet performed

The active standard is still V4.4. Flipping it is a code change under test
coverage, not a file copy. **V4.4 must not be moved into `_superseded/` before
these edits land, or `src/standard.ts` loses its target.**

| # | File | Change |
|---|---|---|
| 1 | `drip-chatgpt-seo-plugin/src/standard.ts` | `CANONICAL_STANDARD_FILE` → V4.5 filename; header comment; `FORBIDDEN_STANDARD_PATTERNS` must additionally forbid every V4.4 filename so V4.4 cannot be resurrected via `STANDARD_PATH` |
| 2 | `drip-chatgpt-seo-plugin/tests/standard.test.ts` | update assertions on the pinned constant and the forbidden-pattern set; add a case asserting a V4.4 path is rejected |
| 3 | `drip-chatgpt-seo-plugin/skills/drip-seo-executor/references/` | replace the shipped V4.4 copy with the V4.5 revision (both filenames must not coexist — a stale copy is loadable) |
| 4 | `drip-chatgpt-seo-plugin/skills/drip-seo-executor/SKILL.md` | lines 3, 10, 14, 15, 34, 42 reference V4.4 |
| 5 | `drip-chatgpt-seo-plugin/IMPLEMENTATION_STATUS.md` | lines 5, 7, 42, 46, 49 |
| 6 | `drip-seo-agent/standards/agent/AGENT_CONTRACT_V2.0.md` | line 7 companion-standard pointer |
| 7 | `drip-seo-agent/standards/_superseded/README.md` | active-standard pointer + table rows |
| 8 | `drip-seo-agent/mcp-plugin/rules/` and `mcp-plugin/skills/drip-seo-executor/references/` | mirror of items 3–4 |
| 9 | `STANDARD_EXPECTED_SHA256` (env / CI) | pin to `224429ED857DBAF909E9DCB6F0C615001D621D1C5E98CF5D1783AAFBDB07DBB1` |
| 10 | `dripops/standards/`, `.sandbox/standards/`, build-output copies | regenerate; these are duplicates, not sources |

After the switch, V4.4 moves to `_superseded/` and its README row records the
SHA-256 `5FB8457F…BF3BF8` and the reason (replaced by the merged revision).

## 5.1 Decisions required from the user

| # | Decision | Why it cannot be auto-resolved |
|---|---|---|
| 1 | Approve the switch at all, or keep producing PDPs on V4.4 | The switch changes the decision layer for every in-flight batch (LV Trainer backfill, LV Skate expansion, Prada migration, Dior / Balenciaga builds) |
| 2 | Finding G — probe whether mrshopplus supports custom 301s | If it does not, the §10 / §7 migration path is unexecutable and needs a fallback (canonical-only, or slug rewrite with a static redirect table) |
| 3 | Finding H — add `offers` to Schema or accept no rich results | Product-level decision with SERP consequences, not a standards question |
| 4 | §13 / §17A output cadence — is the publish queue ever auto-released? | Current rule is queue-only pending explicit confirmation |

---

# 6. Repository hygiene defects found while working

| Sev | Defect | Evidence |
|---|---|---|
| P1 | `_superseded/README.md` cites `docs/architecture/DECISION_LOG.md` decisions #001 and #002. **That file does not exist anywhere in the repository.** | `find . -name DECISION_LOG.md` returns nothing |
| P2 | The same README cites `reports/V4.4_STANDARD_FINAL_MIGRATION_2026-09-19.md`, which exists only inside `.codex-worktrees/…`, not in the main tree | glob across repo |
| P2 | Project memory records a file `skills/drip-seo-pdp-v4.5.md` created on 2026-09-21. **No such file exists anywhere in the repository.** | `find . -iname "*v4.5*"` returns nothing before this session |
| P2 | **Eleven** copies of the V4.4 standard are loadable in the main tree (excluding `.codex-worktrees/`). Nothing prevents a batch from reading a stale one. | `find` enumeration, §6.1 |

The first and third matter for the same reason: a standard whose archive index
points at non-existent files cannot be trusted as the record of what was decided,
and memory that asserts a file exists when it does not will be cited later as
evidence.

## 6.1 The eleven loadable V4.4 copies

```text
drip-seo-agent/standards/V4.4/…                                    source of record
drip-seo-agent/dripops/standards/…                                 duplicate
drip-seo-agent/dripops/src/DripOps/bin/Debug/net8.0/…              build output
drip-seo-agent/dripops/src/DripOps/bin/Release/net8.0/…            build output
drip-seo-agent/mcp-plugin/rules/…                                  shipped copy
drip-seo-agent/mcp-plugin/skills/drip-seo-executor/references/…    shipped copy
drip-seo-agent/.sandbox/standards/…                                sandbox copy
drip-chatgpt-seo-plugin/rules/…                                    shipped copy
drip-chatgpt-seo-plugin/skills/drip-seo-executor/references/…      shipped copy
dripops/standards/…                                                duplicate
dripops/src/DripOps/bin/Release/net8.0/…                           build output
```

Only the first is a source. The rest are copies, and a copy is what an agent
actually loads at runtime. Any V4.5 switch is incomplete until every one of these
either holds the new revision or is removed.

The two files most likely to be loaded in production are the `skills/…/references/`
copies, because a plugin skill reads its own references directory, not the
standards tree. See §5 items 3 and 8.

---

# 7. Standing rule

```text
The V4.5 revision is a merge.

No V4.4 rule was deleted.

Sections that were reduced in the delivered text were restored from V4.4.

Sections that claim to be new but are not were reclassified.

Claims of machine executability were narrowed to what a machine can check.

The active standard has not been switched.
```
