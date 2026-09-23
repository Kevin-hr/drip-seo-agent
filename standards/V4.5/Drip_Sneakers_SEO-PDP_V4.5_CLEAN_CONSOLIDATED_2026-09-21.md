# Drip Sneakers｜SEO-PDP V4.5 STANDARD — FINAL

> Section headings below retain their original `V4.4` labels where the section is a
> verbatim V4.4 section. That is intentional: the labels are the section identity
> used by existing cross-references. The document identity is V4.5.

## Version

Version: `4.5`  
Status: `FINAL — ENTITY INTELLIGENCE UPGRADE — CONSOLIDATED 2026-09-21`  
Supersedes: `V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md`  
Scope: Drip Sneakers PDP SEO, Exact Entity Verification, Visual Evidence Verification, SKU Governance, SERP Decision, User Decision, Backend Field Placement, Internal Linking, Agent Validation, Batch Execution

This revision is a **merge, not a rewrite**. Every V4.4 section is retained under
its original number. V4.5 adds six layers as suffixed sections, so no existing
cross-reference in code, tests or documentation moves.

| Added in V4.5 | Section |
|---|---|
| Image Fingerprint Hard Gate | §3A |
| Entity Confidence Status | §4A |
| SKU Field Isolation | §5B |
| Brand Architecture Layer | §15A |
| Batch Agent Execution Mode | §17A |
| Machine-Executable vs Human-Attested Validation | §23A |

The summary-style V4.5 text as originally delivered is frozen at
`Drip_Sneakers_SEO-PDP_V4.5_STANDARD_AS_DELIVERED_2026-09-21.md`. It is **not**
usable as a decision layer: it omits 13 of the 29 V4.4 sections, including
Source Priority.
See `MIGRATION_NOTES_V4.4_TO_V4.5.md`.

---

# 0. V4.4 Core Principle

SEO-PDP V4.4 keeps the V4.3 exact-entity and backend-placement system and fixes one additional problem:

> Correct product information can still underperform if the Meta Description spends SERP space on low-decision product details instead of high-value purchase information.

A qualified PDP must satisfy:

```text
Exact Product Entity
+
Verified Product Facts
+
SERP Decision Clarity
+
Correct Backend Placement
+
Clear User Decision
+
Clean SEO Execution
```

Final rule:

> Search finds candidates.  
> Cross-verification decides the entity.  
> SEO starts only after the entity is locked.  
> Meta Description helps the search user decide whether to click.  
> Verified information must appear where users can use it fastest.

---

V4.5 does not change that principle. It adds one condition upstream of it:

```text
Search finds candidates.
Visual evidence identifies the product fingerprint.
Cross-verification decides the entity.
SEO starts only after entity confidence is PASS.
```

Visual evidence is treated as a **falsifier, not a verifier** (§3A). It can
eliminate a candidate. It can never on its own promote one to PASS.

---

# 1. V4.5 Upgrade from V4.4

V4.3 remains fully valid for:

```text
Visual Fingerprint
Candidate Set
Source Priority
Exact Entity Comparison
Independent SKU Verification
Exact Match Hard Gate
Set / Bundle Identity
SEO Fields
Backend Placement Layer
Key Description Composition Rule
Description Image-Only Rule
No Redundant Product-Name Repetition Rule
Above-the-Fold Decision Priority
Brand Internal Link
Three-Pass Audit
```

V4.4 adds:

```text
SERP Decision Layer
+
Meta Description Fixed Composition
+
Purchase-Assurance Priority
+
Unsupported-Claim Guard
+
Product-Feature De-prioritization
```

V4.4 does NOT replace the V4.3 PDP placement model. It upgrades how Meta Description uses limited SERP attention.

---

## V4.5 additions over V4.4

V4.4 remains fully valid for everything listed above. V4.5 adds:

```text
Image Fingerprint Hard Gate        (§3A)
Entity Confidence Status           (§4A)
SKU Evidence Separation            (§5B)
Internal Reference Protection      (§5 / §5A, restated)
Brand Architecture Layer           (§15A)
Batch Product Execution Mode       (§17A)
Agent Validation Layer             (§23A)
```

Scope note on the delivered text: it presented these as seven independent
additions. In this revision, **Internal Reference Protection** is recognized as
the existing §5 / §5A rule under a new name, and **Agent Validation Layer** is
recognized as §23 formalized into a machine-checkable subset. Neither grants
new authority, and neither is a new gate.

---

# 2. Mandatory Execution Order V4.5

Every PDP must follow:

```text
 1. Product Image Fingerprint          (§3A)
 2. High-Authority Source Search       (§3)
 3. Candidate Set                      (§4)
 4. Exact Entity Comparison            (§4)
 5. SKU Evidence Verification          (§5, §5A, §5B)
 6. Exact Match Hard Gate              (§4)
 7. Entity Confidence Assignment       (§4A)
 8. Product Name Cleanup               (§6)
 9. SEO-PDP Generation                 (§7–§25)
10. Backend Placement                  (§11, §19)
11. Machine Validation                 (§23A)
12. Three-Pass Final Audit             (§23)
```

SEO fields must NOT be generated before Exact Entity PASS.

> **ORDERING NOTE — correction applied to the delivered text.**
> The delivered V4.5 order placed *Product Name Cleanup* at step 2, ahead of
> brand / type / model / colorway confirmation. That inverts the dependency:
> §6 cleans a name of supplier and marketing wording, which presupposes the
> entity has already been identified. Running cleanup first risks normalizing a
> name that later turns out to describe a different product, and then treating
> the cleaned name as evidence. In this revision cleanup sits at step 8, after
> Entity Confidence Assignment. The substance of §6 is unchanged.

---

# 3. Source Priority

Use this hierarchy:

```text
Tier 1 — Brand Official / Authorized Retailer
Tier 2 — StockX
Tier 3 — GOAT
Tier 4 — Established Retailer with structured product data
Tier 5 — Vertical Independent Retailer / Competitor
Tier 6 — Marketplace Seller Listing
Tier 7 — Supplier Page / Supplier Catalog
Tier 8 — Image Recognition Only
```

Rules:

- Lower-tier sources may generate candidates.
- Lower-tier sources may not overrule a conflicting higher-tier exact match without stronger evidence.
- A retailer can be a strong product-information source without being an official brand website.
- Official/authorized status and product-data reliability are separate judgments.

---

# 3A. Image Fingerprint Hard Gate

## Purpose

Same brand plus a similar design does not equal the same product.

```text
Same Brand
+
Similar Design
≠
Same Product
```

## Dimensions to observe

```text
Brand Logo
Silhouette
Construction
Colorway
Graphic Placement
Signature Detail
Material Appearance
Collaboration Detail
```

Example — wrong:

```text
Prada Triangle Logo Polo = all Prada polos
```

Example — correct:

```text
Prada Piqué Polo Shirt Black
vs
Prada Logo Placket Polo Shirt White
= Different Entity
```

## Falsification limit — mandatory

The Image Fingerprint is a **hard gate in one direction only**.

```text
Fingerprint MISMATCH
→ candidate is eliminated
→ HOLD

Fingerprint MATCH
→ candidate advances to evidence stages
→ does NOT constitute entity verification
```

A visual match is never sufficient for PASS. It can only fail to disqualify.

### Observed evidence for this limit

Drip Sneakers LV Skate intake, 2026-09-21. Two distinct products:

```text
LV Skate Sneaker White Brown              image batch 1D47CC
LV Skate Sneaker White Brown With Rhinestones   image batch 1D47CE
```

The only entity-distinguishing difference is the presence or absence of gold
rhinestones. At normal PDP zoom and image compression the two are routinely
confused. They were separated only by slug plus SKU plus per-image checksum
comparison, not by looking at them.

```text
Therefore:
Visual identity is a hypothesis.
Identifier evidence is the verdict.
```

## What a vision agent may emit

Observation only. Never an identifier.

```json
{
  "visual_observation": {
    "brand_visible": "",
    "garment_or_shoe_type": "",
    "base_color_visual": "",
    "graphics": "",
    "construction": "",
    "special_features": ""
  },
  "fingerprint_verdict": "MATCH | MISMATCH | INSUFFICIENT",
  "uncertain_points": []
}
```

Forbidden:

```text
Visual color      → Official Colorway
Visual silhouette → Model code
Visual detail     → SKU
```
These must stay separate fields. See §4A for how the verdict maps to status.

---

# 4. Exact Entity Hard Gate

Exact Entity PASS requires:

```text
Current Product Visual Match
+
Market-Recognized Product Name Match
+
Product Type Match
+
Colorway Match
+
Graphic Match
+
Collaboration / Collection Match when applicable
+
SKU Match when available
+
Single Item / Set Match
```

If only visual similarity exists:

```text
CANDIDATE
```

If identity-critical evidence conflicts:

```text
HOLD
```

Do not write final SEO for a HOLD product.

---

# 4A. Entity Confidence Status

Every product carries exactly one status before SEO generation is authorized.

## ENTITY PASS

```text
Brand Confirmed
+
Product Type Confirmed
+
Model Confirmed
+
Colorway Confirmed
+
Visual Match Confirmed   (§3A, as falsifier)
+
SKU Match when available
+
No conflicting identity-critical evidence
```

## PASS WITHOUT SKU

```text
Exact product entity confirmed
+
No public SKU verified
+
No conflicting evidence
```

This is the V4.5 name for the §5A condition. It is a **full PASS**, not a
downgrade. It authorizes every output except a SKU, which is omitted.

## VERIFY

```text
Entity mostly confirmed
but identifier evidence incomplete
```

Example: label code found, no official exact-product match.

VERIFY does **not** authorize SEO generation. It authorizes more evidence
collection, or a request to the user.

## HOLD

```text
Multiple conflicting products
Wrong product type
Wrong colorway
Supplier identity only
SKU conflict
Visual mismatch
```

## Authorization map

| Status | SEO generation | Backend write | SKU emitted |
|---|---|---|---|
| ENTITY PASS | allowed | allowed after validation | yes, if verified |
| PASS WITHOUT SKU | allowed | allowed after validation | omitted |
| VERIFY | forbidden | forbidden | n/a |
| HOLD | forbidden | forbidden | n/a |

Hard rule:

```text
HOLD or VERIFY product → Generate SEO = FAILURE
```

> Conflict note. `AGENT_CONTRACT_V2.0.md` §3 defines the states
> OBSERVED / CANDIDATE / VERIFY / PASS / HOLD. V4.5 introduces no state outside
> that machine. PASS WITHOUT SKU is a sub-case of PASS; ENTITY PASS is PASS.
> The contract remains valid and needs no amendment.

---

# 5. Independent SKU Rule

SKU must belong to the same exact entity.

Acceptable SKU evidence:

```text
Brand official product page
Authorized retailer
StockX exact product page
GOAT exact product page
Established retailer with explicit SKU / Style Code
```

Do not use:

```text
Drip product ID
Supplier number
URL suffix
Image filename
Listing ID
Size
Generated code
```

Hard rule:

```text
Verified SKU exists
→ output SKU

Verified SKU does not exist
→ omit SKU completely
```

Forbidden:

```text
SKU: Not verified
SKU: Unknown
SKU: Pending
SKU: N/A
```

---

# 5A. Sample / Unreleased / Friends & Family Rule

A verified product entity does not require a public retail SKU in order to be publishable.

PASS without SKU is allowed only when:

```text
Exact sample / unreleased / F&F entity verified
+
Current product matches that exact entity
+
Release status or sample identity is independently supported
+
No conflicting identity-critical evidence
```

Then:

```text
Product Name / H1 = verified sample entity
SEO Title = Product Name + Reps | Drip Sneakers
Meta Description = no SKU variant
Product Details field #5 = verified product-specific fact, normally Release Status
Schema = omit sku
URL = omit unverified supplier / sample reference codes
```

Hard rules:

- A supplier reference code may be retained internally for inventory mapping, but it is not a front-end SKU unless independently verified for the same exact entity.
- Do not infer a sample SKU from a released sibling model, color code, URL, supplier catalog or numbering pattern.
- If a high-authority market source explicitly assigns an identifier to the exact sample entity, that identifier may be used only when it passes the same Independent SKU Rule and does not conflict with other exact-entity evidence.
- Different physical sample pairs may carry different sample codes. Do not generalize one pair's code to the whole colorway.

---

# 5B. SKU Field Isolation

V4.4 §5 requires the SKU to belong to the same exact entity. V4.5 adds the
storage separation that makes that rule enforceable in a batch pipeline.

Four distinct identifier classes exist and must never be stored in one field:

```text
Official SKU        brand / authorized-retailer / StockX / GOAT product code
Internal SKU        Drip product ID
Supplier Reference  supplier catalog number, batch code, DC2, PKGod code
Image Code          image filename, hex prefix, upload-batch identifier
```

Routing:

```text
Official SKU
        → front-end SEO allowed

Internal SKU
        → backend only

Supplier Reference
        → backend only, never public

Image Code
        → never used as identity, ever
```

Forbidden promotions:

```text
Supplier ID     → SKU
Image Filename  → SKU
URL ID          → SKU
Batch Code      → SKU
Drip product ID → SKU
```

## Why this is a storage rule and not a wording rule

In a batch run the four classes arrive in the same row. If they share one
column, a correct-looking value can pass a wording check while being the wrong
class of identifier. Isolation makes the error impossible to express rather
than merely forbidden. See §17A for the pipeline that consumes these fields.

---

# 6. Product Naming Standard

Product Name must be the consumer-facing exact entity.

Structure:

```text
Brand
+
Collaboration / Collection when identity-critical
+
Model / Product Name
+
Product Type when needed
+
Variant / Colorway
```

Do not include:

```text
Supplier wording (PKGod / Pkgod / batch names)
Marketing filler (Top Quality / Best Quality / 1:1 / Authentic Quality)
Fake / Replica wording
Internal codes
Unverified identifiers
Gender / sizing-class words in public SEO identity fields
```

Gender-word hard ban for public SEO identity fields:

```text
Women / Women's / WMNS
Men / Men's
GS / PS / TD
Kids / Unisex
```

Unless the user explicitly creates a later exception, these terms must not appear in Product Name, H1, SEO Title, SEO Keywords, Meta Description, URL, Canonical, Key Description, Product Details, Image ALT or Product Schema. External sources may use them; normalize them out of Drip Sneakers public SEO fields without changing the verified SKU.

H1:

```text
H1 = Product Name
```

Do not repeat SKU in H1 by default.

---

V4.5 addition — forbidden wording must also be rejected in supplier form when it
appears as a standalone token rather than embedded in a phrase:

```text
Top Quality
Best Quality
PKGod / Pkgod
Batch
1:1
Authentic Quality
Supplier Name
Internal Code
```

The gender-word ban in this section is unchanged and remains the stricter list.
V4.5 does not narrow it.

# 7. SEO Title

With verified SKU:

```text
Product Name + Verified SKU + Reps | Drip Sneakers
```

Without verified SKU:

```text
Product Name + Reps | Drip Sneakers
```

---

# 8. SEO Keywords

Keywords must be:

```text
Relevant
Specific
Product-focused
```

Formatting:

```text
Keyword 1, Keyword 2, Keyword 3, Keyword 4, Keyword 5
```

Use commas.

Recommended composition:

```text
1. Exact Product Name
2. Product-name variation
3. Colorway + Product Type
4. Verified SKU when available
5. High-intent category/product synonym
```

---

# 9. Meta Description — V4.4 SERP Decision Standard

## Purpose

Meta Description is a SERP decision block, not a shortened Product Description.

Its job is:

```text
Exact Product Recognition
+
Search-Intent Match
+
Purchase-Assurance Information
+
Click Decision
```

The user should be able to answer from the search result:

```text
Is this the exact product I searched for?
+
Is this the type of product I want?
+
What purchase assurances do I get if I click?
```

## Mandatory composition

When SKU is verified, default to:

```text
Shop [Exact Product Name] reps ([Verified SKU]) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

When no verified SKU exists:

```text
Shop [Exact Product Name] reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

The Exact Product Name must match the locked product entity used by H1, SEO Title and Schema.

## Information priority

Use Meta Description space in this order:

```text
1. Exact Product Name
2. Reps intent
3. Verified SKU when available
4. Drip Sneakers
5. QC photos
6. 30-day returns
7. 7–20 day shipping
8. Identity-critical product feature only when needed
```

Product features such as materials, laces, graphics, color details or decorative elements are normally lower priority because Key Description, Product Details, images and ALT already carry product-detail information.

## Identity-critical exception

A product feature may enter Meta Description only when removing it would materially weaken exact-product recognition.

Examples:

```text
Collaboration name
Collection name
Identity-critical graphic
Identity-critical variant
Official colorway term needed to distinguish close entities
```

Do not use ordinary feature stacking merely to fill Meta Description space.

## Unsupported-claim guard

Use only site-wide purchase information that is actually supported by the current Drip Sneakers policy and PDP experience.

Default approved wording for V4.4:

```text
QC photos
30-day returns
7–20 day shipping
```

Avoid stronger wording unless separately verified:

```text
real QC photos
guaranteed QC photos
guaranteed delivery
7–20 day delivery
authentic quality
1:1 guaranteed
best quality
```

Reason:

```text
"QC photos" states the available decision asset.
"30-day returns" states the return window.
"7–20 day shipping" states the shipping range without converting it into a delivery guarantee.
```

## Hard rules

```text
Exact entity first.
Do not use an old supplier or legacy product name after entity lock.
Use verified SKU only.
Do not replace purchase-assurance information with low-value feature stuffing.
Do not add unsupported trust claims.
Do not mechanically duplicate the Key Description sentence.
Do not sacrifice entity accuracy merely to force a character count.
```

## Reference implementation

Locked entity:

```text
Louis Vuitton LV Skate Sneaker Black Swarovski Monogram
```

Verified SKU:

```text
1ABMHV
```

V4.4 Meta Description:

```text
Shop Louis Vuitton LV Skate Sneaker Black Swarovski Monogram reps (1ABMHV) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

Rejected pattern:

```text
Shop Louis Vuitton LV Skate Sneaker Black Swarovski Monogram 1ABMHV reps in Black/Silver with Swarovski crystal detailing, rope laces and Monogram accents.
```

Why rejected:

```text
The product is identifiable, but scarce SERP space is consumed by secondary product details already handled elsewhere on the PDP.
Purchase-decision information is missing.
```

---

# 10. URL / Canonical

## New / launch-stage PDP

Preferred with verified SKU:

```text
/product-name-colorway-sku
```

Preferred without verified SKU:

```text
/product-name-colorway
```

## Existing live PDP — stability rule

Do **not** migrate an existing URL merely to make it prettier, reorder words, add a nickname, add `SE` / `SP`, or append a verified SKU when the current URL already identifies the correct entity and contains no harmful token.

Keep the existing URL when all are true:

```text
Correct product entity
+
No supplier / batch wording
+
No wrong or unverified identifier
+
No material ambiguity / collision with another entity
+
No meaningless trailing noise
```

A URL migration is required when the current URL contains:

```text
PKGod / Pkgod / supplier wording
Wrong SKU or unverified supplier number presented as identity
Wrong product / collaboration / variant
Material ambiguity between multiple exact entities
Meaningless trailing hyphens or broken slug residue
```

When changing a live URL:

```text
Old URL -> direct 301 -> final URL
Final URL = 200
Canonical = final URL
Schema / sitemap / internal links = final URL
No redirect chain
```

Canonical must equal the chosen final primary URL.

URL decision priority:

```text
1. Exact entity correctness
2. Verified identifier correctness
3. Remove supplier / misleading noise
4. Avoid ambiguity
5. Existing URL stability
6. Pretty-slug optimization
```

---

# 11. V4.4 Backend Placement Layer

This placement model is inherited unchanged from V4.3.

Drip Sneakers backend fields must be used as follows:

```text
Product Name / H1
        ↓
Price / Size / CTA
        ↓
KEY DESCRIPTION
        ├── One concise natural-language decision sentence
        └── Product Details — exactly 5 verified fields
                └── Brand field carries internal link
        ↓
DESCRIPTION
        └── Product detail images only
        ↓
Size Guide
Shipping / Returns
FAQ / Related Products
```

The semantic roles remain different, but they are physically placed together inside the Key Description field.

---

# 12. Key Description — Mandatory Composition

## Purpose

The Key Description is the primary text decision block closest to the purchase area.

It must answer:

```text
What is visually distinctive about this exact product?
What are the five attributes I need to verify before buying?
```

## Required composition

```text
1 concise natural-language sentence
+
Product Details with exactly 5 verified fields
```

HTML template:

```html
<p>
[One concise verified sentence describing the product's colorway and most distinctive front/back graphic or product-specific feature.]
</p>

<h2>Product Details</h2>

<ul>
<li><strong>Brand:</strong> <a href="[BRAND INTERNAL URL]"><strong>[Brand]</strong></a></li>
<li><strong>Product Type:</strong> [Product Type]</li>
<li><strong>Model:</strong> [Exact Model / Collection]</li>
<li><strong>Colorway:</strong> [Colorway]</li>
<li><strong>SKU or Product-Specific Fact:</strong> [Verified Value]</li>
</ul>
```

---

V4.5 addition — priority of the fifth field when the SKU is unavailable:

```text
1. Verified SKU
2. Verified Collection Fact
3. Verified Material Fact
4. Verified Graphic Fact
5. Verified Release Fact
```

Forbidden in the fifth field:

```text
Unknown SKU
Supplier Code
Country Origin
Unsupported Material Claim
```

Country of origin is forbidden as a fifth-field value. Origin is a claim that
counterfeit-marketplace sources assert freely and inconsistently; without a
brand-official source for the exact entity it cannot be verified, and an
unverified origin claim is worse than a missing field.

# 13. No Redundant Product-Name Repetition

If the full Exact Product Name already appears in:

```text
H1
SEO Title
URL
Product Details → Model
ALT
Schema
```

the Key Description must NOT mechanically repeat the full Product Name as another H2.

Do not default to:

```html
<h2>Hellstar Orange Sports Camo Core Logo T-Shirt Black</h2>
```

inside Key Description.

Instead use a natural sentence:

```html
<p>
This Hellstar T-shirt features a black colorway with an orange camo sports logo on the front and a circular flame graphic on the back.
</p>
```

Reason:

```text
H1 identifies the entity.
Key Description explains the visual distinction.
Product Details verifies the attributes.
```

Each element has a separate decision function.

---

# 14. Product Details — Semantic Role

Product Details remains the structured attribute layer; V4.4 retains the V4.3 rule that physically places it inside Key Description.

Purpose:

> Let the customer verify the exact product attributes quickly.

Default:

```text
Exactly 5 high-value verified fields
```

Priority:

```text
1. Brand
2. Product Type
3. Model / Collection / Collaboration
4. Colorway
5. SKU when verified
   OR one verified product-specific fact when SKU is unavailable
```

Never add weak information just to reach five fields.

If SKU is unavailable, omit SKU and use a verified product-specific fact.

---

# 15. Mandatory Verified Internal Link

The Brand row in Product Details must carry at least one real, crawlable Drip Sneakers internal link. Never invent a category URL.

Link priority:

```text
1. Verified brand hub
2. Verified exact model / collection category
3. Verified broader product category
4. No guessed link; VERIFY if no real link can be established
```

Examples:

```html
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hellstar-T-Shirts/"><strong>Hellstar</strong></a></li>
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Sp5der/"><strong>Sp5der</strong></a></li>
```

Rules:

```text
Use actual brand name as anchor text.
Anchor text must be <strong>.
Destination must return a real current page.
Prefer the most specific verified useful destination.
Do not use "click here".
Do not add a duplicate "Explore more [Brand]" sentence to Key Description.
```

---

# 15A. Brand Architecture Layer

§15 defines the link rule for one PDP. V4.5 adds the site-level structure the
rule has to fit into.

```text
Brand Hub
        ↓
Collection / Model Hub
        ↓
Product PDP
```

Example:

```text
Louis Vuitton
        ↓
Louis Vuitton Trainer
        ↓
Specific LV Trainer Product
```

## Resolution order for the Brand row

Unchanged from §15, restated for batch use:

```text
1. Verified brand hub
2. Verified exact collection hub
3. Verified broader category
4. No guessed link
```

## Hard requirement — link must be probed, not predicted

A destination may be written into an output only after an HTTP probe returns
200 for that exact path. Predicted paths are not evidence.

```text
Probed 200 → may be written
Probed 404 → must never be written
Never probed → must not be written
```

### Verified site state, 2026-09-21

Reachable (200):

```text
/Louis-Vuitton/
/Louis-Vuitton-Skate/
/Gallery-Dept/
/STYLE-PICKS/
/Designer-Sneakers/
/Sneakers/
```

Not reachable (404) — must not appear in any SEO field:

```text
/Louis-Vuitton-Sneakers/
/Size-Guide/
/size-guide/
/streetwear/
/Streetwear/
```

`/Louis-Vuitton-Sneakers/` is the important one. An earlier PDP document listed
it as a predicted path pending verification. It does not exist. Treating a
predicted path as usable is exactly the failure mode §15's "never invent a
category URL" is written to prevent, and it survived into a shipped document.

---

# 16. Description Field — Image-Only Rule

For the current Drip Sneakers backend architecture:

```text
DESCRIPTION = Product detail images
```

Do not duplicate:

```text
Product Name
Key Description sentence
Product Details
Brand navigation sentence
```

inside Description.

The Description field should carry the visual proof/detail gallery.

Every meaningful image should have accurate ALT text.

Example:

```text
Hellstar Orange Sports Camo Core Logo T-Shirt Black Front View
Hellstar Orange Sports Camo Core Logo T-Shirt Black Back View
Hellstar Orange Sports Camo Core Logo T-Shirt Black Graphic Detail
```

---

# 17. Crawlability Hard Gate

The V4.4 placement model is valid only if the Key Description field is rendered as normal visible HTML text on the PDP.

Required:

```text
Visible to users
Present in rendered HTML / DOM
Not baked into an image
Not hidden only inside an inaccessible script
Not loaded in a way that prevents normal crawling
```

If Key Description is not crawlable:

```text
V4.4 Backend Placement = NOT PASS
```

The text must then be moved to a crawlable product-information block.

---

# 17A. Batch Agent Execution Mode

Scope: multi-product intake where an existing catalogue has to be compared
against a candidate set. Applies to LV Trainer backfill, LV Skate expansion,
Prada batch migration and Dior / Balenciaga category builds.

```text
Read Existing Products
        ↓
Build Existing Entity Database
        ↓
Compare Candidate Products
        ↓
Remove Duplicates
        ↓
Entity Verification
        ↓
Generate SEO
        ↓
Publish Queue
```

## Mandatory preconditions

```text
1. The candidate set is frozen before comparison starts.
2. The existing catalogue is read in full, not sampled.
3. The publish queue is a queue, not an action. Nothing is written to the
   backend until a human releases it.
```

## Duplicate detection — required evidence

Forbidden:

```text
same price + same stock + similar description = duplicate
```

Required:

```text
Same physical product
+
Same design
+
Same colorway
+
Same construction
+
Same identifier evidence
```

Output per item:

```json
{
  "duplicate_status": "EXACT_DUPLICATE | COLOR_VARIANT | MODEL_VARIANT | UNIQUE | VERIFY"
}
```

## Why a full catalogue read is mandatory

Observed failure, 2026-09-21. An external gap list for LV Skate was checked
against an existing-catalogue set that had not been read in full. Two results:

```text
Items already present were reported as missing.
Items genuinely missing were not reported at all.
```

A partial comparison set does not fail loudly. It fails in both directions at
once while still producing a plausible-looking list. The precondition exists
because the error is silent.

## Scope boundary

This mode generates a queue. Generating a queue is not authorization to publish.
Publication is a separate, explicitly confirmed action.

---

# 18. Why Product Details Belongs Inside Key Description Physically

This is a placement decision, not a semantic merger.

Semantically:

```text
Key Description Sentence
= fast human understanding

Product Details
= structured attribute verification
```

Physically:

```text
Both belong near the purchase decision area
```

Therefore:

```text
KEY DESCRIPTION FIELD
=
Decision Sentence
+
Product Details
```

This reduces scrolling, avoids duplicate modules, and keeps the strongest entity information close to Price / Size / CTA.

---

# 19. PDP Description vs Backend "Description"

V4.4 retains the V4.3 terminology separation.

## Semantic PDP Description

This means:

```text
The concise natural-language decision sentence.
```

In the Drip Sneakers backend, it is stored inside:

```text
Key Description
```

## Backend Description field

This means:

```text
Product detail images only.
```

Do not confuse the semantic content role with the backend field name.

---

# 20. Product Schema

Schema must reflect the same locked entity.

Minimum:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Product Name]",
  "brand": {
    "@type": "Brand",
    "name": "[Brand]"
  },
  "category": "[Product Type]",
  "color": "[Colorway]"
}
```

If SKU is verified:

```json
"sku": "[Verified SKU]"
```

Otherwise omit `sku`.

---

# 21. Image ALT

Format:

```text
Product Name + View / Detail
```

ALT must match the actual image.

Do not use:

```text
Supplier wording
Fake
Replica
Marketing filler
```

---

§13 restated with the V4.5 addition. ALT text must survive the Image Fingerprint
gate: it must name the specific product, not the category.

Wrong:

```text
Generic Shoe Image
```

Correct:

```text
Louis Vuitton LV Trainer White Blue Front View
```

An ALT that would still be accurate for a different product in the same family
is not specific enough.

# 22. User Decision Layer

Every final PDP must answer:

| Question | Required |
|---|---|
| Does the user need to guess what the product is? | NO |
| Does the user need to compare pages to identify it? | NO |
| Does the user need to leave the PDP to understand it? | NO |
| Does the user need to understand supplier terminology? | NO |

If any answer is YES:

```text
NOT PASS
```

---

# 23. V4.4 Three-Pass Audit

## Pass 1 — Exact Entity

Check:

```text
Brand
Exact Product Name
Product Type
Colorway
Front Graphic
Back Graphic
Collection / Collaboration
Single Item vs Set
```

Question:

> Is this the exact product, not a similar product?

## Pass 2 — Evidence / SKU

Check:

```text
Source hierarchy
Cross-source consistency
SKU belongs to same entity
No supplier ID used as SKU
No component SKU misused as set SKU
Sample / unreleased entity can PASS without SKU only under Section 5A
No conflicting sample code generalized across variants
```

## Pass 3 — SEO + Placement + User Decision

Check:

```text
Product Name
H1
No forbidden gender / supplier / marketing words in public identity fields
SEO Title
Keywords comma-separated
Meta Description exact entity
Meta Description verified SKU when available
Meta Description reps intent
Meta Description QC photos / 30-day returns / 7–20 day shipping
Meta Description unsupported-claim guard
URL decision follows new-vs-existing stability rule
Canonical
Key Description sentence
Exactly 5 Product Details fields
Brand internal link
Description image-only
Image ALT
Schema
Key Description crawlability
```

Only then:

```text
SEO-PDP V4.4 PASS
```

---

# 23A. Machine-Executable vs Human-Attested Validation

The delivered V4.5 text presented a flat 13-key boolean checklist and described
V4.5 as machine-executable. The checklist contains keys that no machine can
evaluate. Splitting them is required, because a checklist that cannot actually
be run will be run anyway, and the unverifiable keys will default to true.

## Group A — machine-checkable

Deterministic. A script can decide these and fail the build.

```json
{
  "sku_class_is_official_or_absent": true,
  "supplier_wording_absent": true,
  "gender_words_absent_from_public_fields": true,
  "seo_title_valid": true,
  "meta_description_template_match": true,
  "meta_description_length_in_range": true,
  "key_description_field_count_equals_5": true,
  "brand_link_present": true,
  "schema_json_parses": true,
  "schema_absent_sku_when_sku_unverified": true,
  "output_field_order_matches_section_25": true
}
```

## Group B — human-attested

Requires judgment or external evidence. A machine may only record that an
attestation exists and who made it. It must never default these to true.

```json
{
  "entity_status": "",
  "visual_match": "",
  "brand_verified": "",
  "model_verified": "",
  "colorway_verified": "",
  "sku_verified_or_omitted": "",
  "attested_by": "",
  "attested_at": "",
  "evidence_urls": []
}
```

## Fail-closed rule

```text
Group A key fails        → build fails
Group B key unattested   → build fails
Group B key absent       → build fails
Group B key false       → build fails
```

Absence is not consent. An unattested Group B key is a HOLD, not a PASS.

## Claim correction

V4.5 is therefore **partially** machine-executable, not machine-executable.
Group A can be automated. Group B cannot, and treating it as automatable is the
single most likely way this standard produces a wrong PASS at scale.

---

# 24. Current Hellstar Reference Implementation

Product Entity:

```text
Hellstar Orange Sports Camo Core Logo T-Shirt Black
```

## Key Description

```html
<p>
This Hellstar T-shirt features a black colorway with an orange camo sports logo on the front and a circular flame graphic on the back.
</p>

<h2>Product Details</h2>

<ul>
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hellstar-T-Shirts/"><strong>Hellstar</strong></a></li>
<li><strong>Product Type:</strong> T-Shirt</li>
<li><strong>Model:</strong> Orange Sports Camo Core Logo T-Shirt</li>
<li><strong>Colorway:</strong> Black</li>
<li><strong>Graphic:</strong> Orange Camo Sports Logo / Circular Flame Back Graphic</li>
</ul>
```

## Description

```text
Product detail images only.
```

No duplicated H2 Product Name is required in the Key Description.

---

# 25. Standard Final SEO-PDP Output Order

When generating a final PDP for backend execution, output only:

```text
1. Product Name
2. H1
3. SEO Title
4. SEO Keywords
5. Meta Description
6. URL Slug
7. Canonical URL
8. Key Description
9. Description Rule / Image ALT when relevant
10. Product Schema
```

Product Details must already be embedded inside `Key Description`.

Do not output internal reasoning in the operational result.

---

# 26. V4.5 Final Gate

```text
SEO-PDP V4.5 PASS

=
Image Fingerprint PASS          (no mismatch; not a verification)
+
Exact Entity PASS
+
Entity Confidence PASS          (ENTITY PASS or PASS WITHOUT SKU)
+
Source Priority PASS            (§3)
+
Evidence PASS                   (§23, Pass 2)
+
SKU Governance PASS             (§5, §5A, §5B)
+
User Decision PASS              (§22)
+
SEO Clean PASS
+
SERP Decision PASS
+
Meta Description Assurance PASS
+
Key Description Placement PASS
+
5-Field Product Details PASS
+
Brand Architecture PASS         (§15, §15A, links probed 200)
+
Description Image-Only PASS
+
Crawlability PASS               (§17)
+
Machine Validation PASS         (§23A Group A)
+
Human Attestation PASS          (§23A Group B, all keys attested)
+
Three-Pass Audit PASS           (§23)
```

A gate may not be satisfied by inference from another gate. Each line is
recorded with its evidence reference.

---

# 27. V4.5 Final Rules

> Do not optimize the wrong product.

> Candidate identification is not entity verification.

> Search finds candidates; cross-verification decides the entity.

> A single item and a set are different purchasing entities.

> Verified SKU is output; unverified SKU is omitted.

> A verified Sample / Unreleased / Friends & Family entity may PASS without a public SKU; use a verified release-status fact instead and keep supplier references internal.

> The full Product Name does not need to be mechanically repeated inside Key Description.

> Key Description = one concise decision sentence + exactly five Product Details fields.

> Product Details is semantically an attribute layer but physically belongs inside the Key Description field.

> The Brand row carries one verified internal link; prefer brand hub, then exact model/category, then broader category. Never invent a URL.

> Backend Description = product detail images only.

> Images provide visual proof; Key Description provides fast understanding; Product Details provides structured verification.

> Meta Description is a SERP decision block, not a shortened Product Description.

> Default Meta Description priority = Exact Product + Reps + Verified SKU + QC Photos + 30-Day Returns + 7–20 Day Shipping.

> Secondary product features do not displace higher-value purchase-assurance information unless they are identity-critical.

> Use "shipping" for the 7–20 day range; do not turn it into a delivery guarantee without separate verification.

> Correct information in the wrong place is still a UX problem.

> Existing correct live URLs are stable by default; migrate only for wrong/unverified identity, supplier noise, ambiguity or broken slug residue.

> Public SEO identity fields exclude gender/sizing-class words unless a later explicit exception is created.

> Candidate is not entity.

> Visual similarity is not identity.

> Brand similarity is not model identity.

> A visual fingerprint can eliminate a candidate; it can never confirm one.

> SKU evidence must belong to the same exact product.

> Supplier references and image codes remain internal and are never identity.

> One identifier field holds one identifier class.

> Images prove. Key Description explains. Product Details verify. Meta Description converts SERP attention.

> An internal link is written only after the destination has been probed and returned 200.

> A batch run produces a queue, never a publication.

> A checklist key that cannot be machine-evaluated must be attested by a named human, or it fails.

> Absence of attestation is not consent.

> V4.5 is partially machine-executable. Group A can be automated; Group B cannot.

> SEO starts only after Exact Entity PASS.
