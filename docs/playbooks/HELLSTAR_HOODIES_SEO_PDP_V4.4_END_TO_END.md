# Hellstar Hoodies SEO/PDP V4.4 End-to-End Playbook

## Purpose and authority

This playbook turns the successful Hellstar Hoodies SEO/PDP 3.2 operating
sequence into a repeatable V4.4 workflow. It preserves the useful operational
experience—inventory freeze, image-first identification, evidence capture,
field-by-field writing and post-save verification—but replaces every 3.2
decision rule with the repository's sole active standard:

```text
standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
```

If this playbook and the canonical standard ever disagree, the canonical
standard wins. Every run must record `standard_version` and `standard_hash`.
The historical 3.2 outputs are evidence and lessons, not an active decision
layer.

This document describes the complete success path. It is not, by itself, proof
that a later live page is still correct. Current backend read-back and storefront
verification remain mandatory.

## What “complete” means

A product is complete only when all of the following are true:

```text
target discovered and frozen
+ current PDP snapshotted
+ current images inspected
+ Exact Entity PASS
+ VERIFIED_SKU or SKU_OMIT
+ V4.4 output generated
+ prepare validation PASS
+ approved immutable plan executed once
+ backend read-back PASS
+ storefront and crawlability PASS
+ evidence and checkpoint persisted
```

`Save succeeded`, a populated form, or a search-result snippet alone is not
completion. A `HOLD` is a valid safety outcome, but it is not a completed PDP.

## Lessons retained from the 3.2 run

1. Freeze the measured product set before editing. Category counts can change
   during a batch; never rely on a remembered count.
2. Product ID is the stable execution key, not a supplier title, list position,
   URL suffix or image filename.
3. Inspect every current product image before naming the entity. Front, back,
   sleeve and wash details often distinguish near matches.
4. Store facts and evidence separately from generated copy. Copy can be rebuilt;
   evidence must remain auditable.
5. Prepare all field values and the proposed diff before opening the write path.
6. Execute one immutable plan once, then immediately read back and verify the
   public page.
7. Persist progress by product ID so a restart cannot duplicate or skip work.
8. Isolate failures. One `HOLD` or failed verification must not cause the agent
   to guess, silently skip, or rewrite unrelated products.

## Mandatory V4.4 upgrades over 3.2

| Area | Historical 3.2 habit | V4.4 rule |
|---|---|---|
| Decision order | SEO could be drafted while identity research continued | No SEO before Exact Entity PASS |
| SKU | Verified SKU expected for every publishable product | Use exactly `VERIFIED_SKU`, `SKU_OMIT`, or `HOLD` |
| Missing SKU | Block or write a placeholder | Omit SKU completely when entity passes but SKU does not |
| Meta Description | Product-feature summary | SERP decision block: exact product, reps intent and approved purchase assurances |
| Key Description | Variable marketing copy | One concise verified sentence plus exactly five Product Details fields |
| Brand link | Optional or duplicated navigation sentence | One verified, crawlable internal link in the Brand row |
| Description | Text and images could be mixed | Product detail images only |
| Existing URL | Rewrite for uniformity | Keep a correct live URL unless a V4.4 migration trigger exists |
| Verification | Save response treated as success | Backend read-back plus storefront and crawlability acceptance |

## Hellstar batch reference inventory

The successful 2026-09-02 research run produced eight evidence-backed candidate
records. These records are a migration baseline, not permission to skip current
research. Reopen every external source and compare against the current MrShopPlus
images before a new live write.

| Product ID | Locked entity from prior run | Product type | Colorway | Prior verified SKU |
|---|---|---|---|---|
| `536027371237407` | Hellstar Sport Hoodie Black | Hoodie | Black | `9357 1SS240106SH BLAC` |
| `536027374483989` | Hellstar Records Tour Hoodie Faded Black | Hoodie | Faded Black | `HSR040` |
| `536027374517277` | Hellstar Sports 96 Crewneck Black | Crewneck Sweatshirt | Black | `HS SH 0666 BLAC` |
| `536027374647062` | Hellstar No Guts No Glory Hoodie Blue | Hoodie | Blue | `HS SH 0663 BLUE` |
| `536027374725661` | Hellstar Future Flame Hoodie Grey | Hoodie | Grey | `9357 1FW230106FFH GREY` |
| `536027405581596` | Hellstar Hoodie Fire Orange | Hoodie | Fire Orange | `HC 2039 FIRE` |
| `536027452609305` | Hellstar Sports Tie-Dye Skull Hoodie Red | Hoodie | Red | `9357 1SS240106STDS RED` |
| `536027558969104` | Hellstar Path To Paradise Hoodie Black | Hoodie | Black | `09357 10004HPTPHB BLAC` |

Important category lesson: category membership does not define product type.
The Sports 96 item is a crewneck sweatshirt even though it appears under
`/Hellstar-Hoodies/`. V4.4 output must preserve the exact product type.

## End-to-end workflow

### Phase 0 — Start a recoverable run

1. Generate a unique `run_id` and create an append-only checkpoint.
2. Call health/status tools and confirm the plugin and bridge return the same
   V4.4 version and hash.
3. Confirm the bridge mode. Use `simulate` for rehearsal and `live` only when
   the user has requested execution.
4. Record category URL, timestamp, expected scope and operator.
5. Stop on a standard-hash mismatch. Never downgrade to 3.2 to keep moving.

Minimum run ledger fields:

```text
run_id, standard_version, standard_hash, category_url, product_id,
discovery_status, entity_verdict, sku_verdict, plan_id, execute_status,
backend_verify_status, storefront_verify_status, last_error, updated_at
```

### Phase 1 — Discover and freeze the target set

1. Use `search_products` for `/Hellstar-Hoodies/`.
2. Measure the actual set returned by the backend.
3. Deduplicate by Product ID.
4. Record each product's current title, URL, publication state and category
   membership.
5. Compare the measured set with the requested set. Report additions, removals
   or count drift; do not invent or silently drop candidates.
6. Freeze this inventory as the run manifest. New arrivals belong to a new run
   unless the user explicitly expands scope.

Success gate: every requested Product ID appears exactly once in the manifest.

### Phase 2 — Snapshot before any write

For every Product ID, call `get_product_context` and persist:

- Product Name/H1, SEO Title, Keywords and Meta Description;
- current URL, canonical and publication state;
- Key Description and backend Description;
- image order and image URLs;
- category assignment, price/options where relevant;
- Schema and current storefront URL;
- snapshot hash and capture time.

Treat Product ID, supplier number, platform Schema `sku`, URL suffix and image
filename as internal identifiers until independently verified.

Success gate: a fresh snapshot exists and its hash is attached to the later
immutable plan.

### Phase 3 — Build the visual fingerprint

Call `get_product_images` and inspect all meaningful views. Record only visible
facts:

```text
silhouette/product type
base color and wash
front wording and graphic
back wording and graphic
sleeve graphics
hood/neck construction
set vs single-item identity
distinctive placement details
```

Do not infer a model or SKU from a filename. For Hellstar, similar flame, star,
Records and Sports motifs make front-only matching unsafe.

Success gate: the fingerprint distinguishes the product from nearby candidates
and agrees with the current PDP image set.

### Phase 4 — Research and lock the exact entity

Search in V4.4 source order:

```text
brand/authorized retailer
→ StockX
→ GOAT
→ established structured retailer
→ vertical retailer
→ marketplace
→ supplier
→ image-only candidate
```

Build a candidate set; then compare product name, product type, colorway,
graphics, collection/collaboration, set identity and SKU when present. Lower-tier
sources may suggest candidates but cannot overrule conflicting stronger exact
matches without better evidence.

Return one entity verdict:

- `PASS`: all identity-critical attributes agree.
- `CANDIDATE`: visually similar but not sufficiently verified; continue
  research, do not write SEO.
- `HOLD`: identity-critical evidence conflicts; persist the conflict and do not
  prepare or execute a publish-ready PDP.

Success gate: Exact Entity is `PASS`, with source URLs, tiers, access time and
explicit exact-match notes.

### Phase 5 — Resolve the SKU independently

After Exact Entity PASS, return exactly one SKU verdict:

- `VERIFIED_SKU`: Tier 1–4 evidence explicitly attaches the SKU/style code to
  the same entity and exact colorway.
- `SKU_OMIT`: the entity passes, but no exact SKU can be independently verified.
  Set `sku=null` and omit it from every public field.
- `HOLD`: evidence conflicts or points to a sibling colorway/entity.

Never use Product ID, supplier number, URL residue, image filename, listing ID,
size or a generated code. Never write `Unknown`, `N/A`, `Pending` or
`Not verified`.

The eight historical SKUs above must be rechecked. A source that has disappeared
or changed does not automatically invalidate the entity, but it means the new
run must find adequate current evidence or use `SKU_OMIT`/`HOLD` as appropriate.

### Phase 6 — Generate the V4.4 field package

Generate only after the identity and SKU gates pass. The operational output
order is:

1. Product Name
2. H1
3. SEO Title
4. SEO Keywords
5. Meta Description
6. URL decision and slug
7. Canonical URL
8. Key Description
9. Description image/ALT plan
10. Product Schema

#### Product Name and H1

```text
Product Name = Brand + exact model/collection + product type when needed + colorway
H1 = Product Name
```

Remove supplier/marketing filler and forbidden gender or sizing-class words.
Do not repeat SKU in H1 by default.

#### SEO Title

```text
VERIFIED_SKU → {Product Name} {SKU} Reps | Drip Sneakers
SKU_OMIT     → {Product Name} Reps | Drip Sneakers
```

The SKU appears once only.

#### SEO Keywords

Produce five specific comma-separated phrases: exact product name, a natural
name variation, colorway plus product type, verified SKU when present, and one
high-intent category/product synonym. Replace the SKU keyword with another
verified product-focused phrase for `SKU_OMIT`.

#### Meta Description

```text
VERIFIED_SKU:
Shop {Exact Product Name} reps ({SKU}) at Drip Sneakers with QC photos,
30-day returns and 7–20 day shipping.

SKU_OMIT:
Shop {Exact Product Name} reps at Drip Sneakers with QC photos,
30-day returns and 7–20 day shipping.
```

Do not spend limited SERP space on ordinary fabric, lace or graphic details.
Use an identity-critical feature only when removing it would weaken recognition.
Do not strengthen approved wording into unsupported guarantees.

#### URL and canonical

For a new PDP, prefer the exact entity slug with verified SKU when available.
For an existing correct live PDP, preserve the URL. Migrate only for wrong or
unverified identity, supplier noise, ambiguity or broken slug residue. A
migration requires a direct 301 from old URL to one final 200 URL, plus updated
canonical, Schema, sitemap and internal links.

#### Key Description

Use one concise verified visual-decision sentence followed by exactly five
Product Details fields. Do not repeat the full Product Name as another heading.

```html
<p>
This Hellstar hoodie features [verified color/wash] with [verified front detail]
and [verified back or sleeve detail].
</p>

<h2>Product Details</h2>
<ul>
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hellstar-Hoodies/"><strong>Hellstar</strong></a></li>
<li><strong>Product Type:</strong> [Hoodie or exact verified type]</li>
<li><strong>Model:</strong> [Exact model/collection]</li>
<li><strong>Colorway:</strong> [Verified colorway]</li>
<li><strong>SKU:</strong> [Verified SKU]</li>
</ul>
```

For `SKU_OMIT`, replace the fifth row with one verified product-specific fact,
such as a distinguishing front/back graphic. Do not add a sixth row. Verify the
Hellstar internal URL returns the intended crawlable destination before every
batch; never invent a replacement.

#### Description, ALT and Schema

The backend Description contains product detail images only. Preserve image
order and give each meaningful image an accurate `{Product Name} + View/Detail`
ALT. Schema must use the same locked name, brand, category and colorway; include
`sku` only for `VERIFIED_SKU`.

### Phase 7 — Dry-run and approve the immutable plan

1. Call `prepare_product_v44` with the locked evidence/facts.
2. Confirm `standard_version`, `standard_hash` and snapshot hash.
3. Inspect the full proposed diff, not only the validation summary.
4. Require every V4.4 validator to pass.
5. Persist the returned `plan_id` and its product mapping.
6. If the live snapshot changed after prepare, discard the stale plan and
   prepare again.

Prepare must not modify the shop. Never bypass the plan by sending arbitrary
fields to the write layer.

### Phase 8 — Execute safely

1. Confirm the user requested live execution.
2. Call `execute_product_v44` only with matching `product_id` and `plan_id`.
3. Execute once; do not retry blindly after a timeout.
4. If the response is uncertain, read plan/run state and backend state before
   deciding whether any retry is safe.
5. Record the write receipt and timestamp.

### Phase 9 — Verify backend and storefront

Immediately call `verify_product_v44` and independently check:

- all saved SEO fields exactly match the approved plan;
- H1, canonical and Schema describe the same entity;
- verified SKU is consistent everywhere, or absent everywhere for `SKU_OMIT`;
- Key Description is visible, rendered as crawlable DOM text and has exactly
  five Product Details rows;
- the Brand link is correct and crawlable;
- Description contains images only and ALT matches each image;
- the final public URL returns 200;
- any migrated old URL makes one direct 301 hop to the final URL;
- mobile and desktop do not hide or corrupt the decision block;
- the product remains assigned to the intended category and publication state.

Store the backend read-back and storefront evidence. If verification fails,
mark the product `VERIFY_FAILED`; do not call it complete and do not conceal the
failure with a second unreviewed write.

### Phase 10 — Batch closeout

Reconcile the frozen manifest by Product ID:

```text
total = completed + hold + failed + intentionally_out_of_scope
```

The final report must list each product's entity verdict, SKU verdict, plan ID,
write result, backend verification, storefront verification and final URL. It
must also list every HOLD/failure with the next required action.

## Three-pass acceptance checklist

### Pass 1 — Exact Entity

- [ ] Current images match the locked name, type, colorway and graphics.
- [ ] Collection/collaboration and single-item/set identity are correct.
- [ ] The category did not incorrectly force the product type.

### Pass 2 — Evidence and SKU

- [ ] Sources follow the hierarchy and are attached to the exact entity.
- [ ] SKU verdict is exactly `VERIFIED_SKU`, `SKU_OMIT`, or `HOLD`.
- [ ] No supplier/internal identifier is used as a public SKU.
- [ ] Evidence URLs and access timestamps are persisted.

### Pass 3 — SEO, placement and user decision

- [ ] Product Name/H1 are clean and exact.
- [ ] SEO Title follows the correct SKU variant.
- [ ] Keywords are relevant and comma-separated.
- [ ] Meta Description contains exact product, reps intent and approved
  purchase assurances.
- [ ] Existing URL stability/migration rules are satisfied.
- [ ] Key Description has one sentence plus exactly five fields.
- [ ] Brand row contains one verified Hellstar internal link.
- [ ] Backend Description is image-only; ALT is image-accurate.
- [ ] Schema agrees with the locked entity.
- [ ] Key Description is visible and crawlable.
- [ ] Backend read-back and storefront verification both pass.

Only then may the ledger record `SEO-PDP V4.4 PASS`.

## Failure handling and Murphy controls

Assume that anything not explicitly checked will eventually drift:

| Likely failure | Preventive control |
|---|---|
| Category count changes mid-run | Freeze the Product-ID manifest and reconcile at closeout |
| Similar Hellstar graphics cause a wrong name | Inspect all views and require cross-source exact match |
| Product ID leaks into SKU | Independent SKU verdict and Tier 1–4 evidence requirement |
| A stale plan overwrites a newer edit | Bind plan to snapshot hash and reject drift |
| Timeout causes duplicate execution | Check plan/run/backend state before any retry |
| Correct fields are saved in the wrong backend boxes | Field-by-field read-back and storefront DOM audit |
| Meta copy regresses to feature stuffing | Fixed V4.4 SERP-decision composition |
| Description duplicates visible text | Enforce image-only Description |
| Internal category URL changes | Verify the Brand link before prepare and after publish |
| A save succeeds but the public page is wrong | Require storefront 200/canonical/Schema/DOM acceptance |
| Chat context is lost during a batch | Persist ledger, evidence, plan ID and checkpoints on disk |

## Handoff contract for another AI

Give the next agent:

1. this playbook and the canonical V4.4 standard path/hash;
2. the frozen Product-ID manifest and latest snapshots;
3. image packs and visual fingerprints;
4. source evidence with exact-match annotations;
5. entity and SKU verdicts;
6. approved plan IDs and current run ledger;
7. backend/storefront verification artifacts;
8. unresolved HOLD/failure reasons.

The receiving agent must continue from persisted state, revalidate freshness and
never infer completion from chat history.
