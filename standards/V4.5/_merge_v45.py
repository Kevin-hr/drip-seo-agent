# -*- coding: utf-8 -*-
"""Build the merged SEO-PDP V4.5 CONSOLIDATED revision from the V4.4 base.

Design rule: V4.4 sections keep their original numbers and text. V4.5 layers are
inserted as suffixed sections (3A, 4A, 5B, 15A, 17A, 23A) so that no existing
cross-reference in code, tests or docs moves. Nothing is deleted.
"""
import hashlib
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(HERE, "..", "V4.4", "Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md")
OUT = os.path.join(HERE, "Drip_Sneakers_SEO-PDP_V4.5_CLEAN_CONSOLIDATED_2026-09-21.md")

with io.open(BASE, encoding="utf-8") as fh:
    text = fh.read()

applied = []


def sub_once(old, new, label):
    global text
    n = text.count(old)
    if n != 1:
        sys.exit("ANCHOR FAIL [%s]: expected 1 occurrence, found %d" % (label, n))
    text = text.replace(old, new, 1)
    applied.append(label)


def insert_before(anchor, block, label):
    global text
    n = text.count(anchor)
    if n != 1:
        sys.exit("ANCHOR FAIL [%s]: expected 1 occurrence of %r, found %d" % (label, anchor, n))
    text = text.replace(anchor, block + anchor, 1)
    applied.append(label)


# ----------------------------------------------------------------------------
# 1. Header / version block
# ----------------------------------------------------------------------------
sub_once(
    "Version: `4.4`  \n"
    "Status: `FINAL \u2014 CONSOLIDATED 2026-09-17`  \n"
    "Scope: Drip Sneakers PDP SEO, Exact Entity Verification, SERP Decision, User Decision, Backend Field Placement, Internal Linking",
    "Version: `4.5`  \n"
    "Status: `FINAL \u2014 ENTITY INTELLIGENCE UPGRADE \u2014 CONSOLIDATED 2026-09-21`  \n"
    "Supersedes: `V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md`  \n"
    "Scope: Drip Sneakers PDP SEO, Exact Entity Verification, Visual Evidence Verification, SKU Governance, SERP Decision, User Decision, Backend Field Placement, Internal Linking, Agent Validation, Batch Execution\n"
    "\n"
    "This revision is a **merge, not a rewrite**. Every V4.4 section is retained under\n"
    "its original number. V4.5 adds six layers as suffixed sections, so no existing\n"
    "cross-reference in code, tests or documentation moves.\n"
    "\n"
    "| Added in V4.5 | Section |\n"
    "|---|---|\n"
    "| Image Fingerprint Hard Gate | \u00a73A |\n"
    "| Entity Confidence Status | \u00a74A |\n"
    "| SKU Field Isolation | \u00a75B |\n"
    "| Brand Architecture Layer | \u00a715A |\n"
    "| Batch Agent Execution Mode | \u00a717A |\n"
    "| Machine-Executable vs Human-Attested Validation | \u00a723A |\n"
    "\n"
    "The summary-style V4.5 text as originally delivered is frozen at\n"
    "`Drip_Sneakers_SEO-PDP_V4.5_STANDARD_AS_DELIVERED_2026-09-21.md`. It is **not**\n"
    "usable as a decision layer: it omits 13 of the 29 V4.4 sections, including\n"
    "Source Priority.\n"
    "See `MIGRATION_NOTES_V4.4_TO_V4.5.md`.",
    "header",
)

# ----------------------------------------------------------------------------
# 1b. Document H1
# ----------------------------------------------------------------------------
sub_once(
    "# Drip Sneakers\uff5cSEO-PDP V4.4 STANDARD \u2014 FINAL\n",
    "# Drip Sneakers\uff5cSEO-PDP V4.5 STANDARD \u2014 FINAL\n"
    "\n"
    "> Section headings below retain their original `V4.4` labels where the section is a\n"
    "> verbatim V4.4 section. That is intentional: the labels are the section identity\n"
    "> used by existing cross-references. The document identity is V4.5.\n",
    "h1-title",
)

# ----------------------------------------------------------------------------
# 2. Section 0 — add the V4.5 upstream condition
# ----------------------------------------------------------------------------
insert_before(
    "# 1. V4.4 Upgrade from V4.3",
    "V4.5 does not change that principle. It adds one condition upstream of it:\n"
    "\n"
    "```text\n"
    "Search finds candidates.\n"
    "Visual evidence identifies the product fingerprint.\n"
    "Cross-verification decides the entity.\n"
    "SEO starts only after entity confidence is PASS.\n"
    "```\n"
    "\n"
    "Visual evidence is treated as a **falsifier, not a verifier** (\u00a73A). It can\n"
    "eliminate a candidate. It can never on its own promote one to PASS.\n"
    "\n"
    "---\n"
    "\n",
    "s0-core",
)

# ----------------------------------------------------------------------------
# 3. Section 1 — retitle and record V4.5 additions
# ----------------------------------------------------------------------------
sub_once(
    "# 1. V4.4 Upgrade from V4.3",
    "# 1. V4.5 Upgrade from V4.4",
    "s1-title",
)

insert_before(
    "# 2. Mandatory Execution Order",
    "## V4.5 additions over V4.4\n"
    "\n"
    "V4.4 remains fully valid for everything listed above. V4.5 adds:\n"
    "\n"
    "```text\n"
    "Image Fingerprint Hard Gate        (\u00a73A)\n"
    "Entity Confidence Status           (\u00a74A)\n"
    "SKU Evidence Separation            (\u00a75B)\n"
    "Internal Reference Protection      (\u00a75 / \u00a75A, restated)\n"
    "Brand Architecture Layer           (\u00a715A)\n"
    "Batch Product Execution Mode       (\u00a717A)\n"
    "Agent Validation Layer             (\u00a723A)\n"
    "```\n"
    "\n"
    "Scope note on the delivered text: it presented these as seven independent\n"
    "additions. In this revision, **Internal Reference Protection** is recognized as\n"
    "the existing \u00a75 / \u00a75A rule under a new name, and **Agent Validation Layer** is\n"
    "recognized as \u00a723 formalized into a machine-checkable subset. Neither grants\n"
    "new authority, and neither is a new gate.\n"
    "\n"
    "---\n"
    "\n",
    "s1-adds",
)

# ----------------------------------------------------------------------------
# 4. Section 2 — the 12-step V4.5 order
# ----------------------------------------------------------------------------
sub_once(
    "# 2. Mandatory Execution Order\n"
    "\n"
    "Every PDP must follow:\n"
    "\n"
    "```text\n"
    "1. Drip PDP Visual Fingerprint\n"
    "2. High-Authority Source Search\n"
    "3. Candidate Set\n"
    "4. Exact Entity Comparison\n"
    "5. SKU Verification\n"
    "6. Exact Match Hard Gate\n"
    "7. SEO-PDP Generation\n"
    "8. Backend Placement\n"
    "9. Three-Pass Final Audit\n"
    "```\n"
    "\n"
    "SEO fields must NOT be generated before Exact Entity PASS.",
    "# 2. Mandatory Execution Order V4.5\n"
    "\n"
    "Every PDP must follow:\n"
    "\n"
    "```text\n"
    " 1. Product Image Fingerprint          (\u00a73A)\n"
    " 2. High-Authority Source Search       (\u00a73)\n"
    " 3. Candidate Set                      (\u00a74)\n"
    " 4. Exact Entity Comparison            (\u00a74)\n"
    " 5. SKU Evidence Verification          (\u00a75, \u00a75A, \u00a75B)\n"
    " 6. Exact Match Hard Gate              (\u00a74)\n"
    " 7. Entity Confidence Assignment       (\u00a74A)\n"
    " 8. Product Name Cleanup               (\u00a76)\n"
    " 9. SEO-PDP Generation                 (\u00a77\u2013\u00a725)\n"
    "10. Backend Placement                  (\u00a711, \u00a719)\n"
    "11. Machine Validation                 (\u00a723A)\n"
    "12. Three-Pass Final Audit             (\u00a723)\n"
    "```\n"
    "\n"
    "SEO fields must NOT be generated before Exact Entity PASS.\n"
    "\n"
    "> **ORDERING NOTE \u2014 correction applied to the delivered text.**\n"
    "> The delivered V4.5 order placed *Product Name Cleanup* at step 2, ahead of\n"
    "> brand / type / model / colorway confirmation. That inverts the dependency:\n"
    "> \u00a76 cleans a name of supplier and marketing wording, which presupposes the\n"
    "> entity has already been identified. Running cleanup first risks normalizing a\n"
    "> name that later turns out to describe a different product, and then treating\n"
    "> the cleaned name as evidence. In this revision cleanup sits at step 8, after\n"
    "> Entity Confidence Assignment. The substance of \u00a76 is unchanged.",
    "s2-order",
)

# ----------------------------------------------------------------------------
# 5. New sections
# ----------------------------------------------------------------------------
insert_before(
    "# 4. Exact Entity Hard Gate",
    "# 3A. Image Fingerprint Hard Gate\n"
    "\n"
    "## Purpose\n"
    "\n"
    "Same brand plus a similar design does not equal the same product.\n"
    "\n"
    "```text\n"
    "Same Brand\n"
    "+\n"
    "Similar Design\n"
    "\u2260\n"
    "Same Product\n"
    "```\n"
    "\n"
    "## Dimensions to observe\n"
    "\n"
    "```text\n"
    "Brand Logo\n"
    "Silhouette\n"
    "Construction\n"
    "Colorway\n"
    "Graphic Placement\n"
    "Signature Detail\n"
    "Material Appearance\n"
    "Collaboration Detail\n"
    "```\n"
    "\n"
    "Example \u2014 wrong:\n"
    "\n"
    "```text\n"
    "Prada Triangle Logo Polo = all Prada polos\n"
    "```\n"
    "\n"
    "Example \u2014 correct:\n"
    "\n"
    "```text\n"
    "Prada Piqu\u00e9 Polo Shirt Black\n"
    "vs\n"
    "Prada Logo Placket Polo Shirt White\n"
    "= Different Entity\n"
    "```\n"
    "\n"
    "## Falsification limit \u2014 mandatory\n"
    "\n"
    "The Image Fingerprint is a **hard gate in one direction only**.\n"
    "\n"
    "```text\n"
    "Fingerprint MISMATCH\n"
    "\u2192 candidate is eliminated\n"
    "\u2192 HOLD\n"
    "\n"
    "Fingerprint MATCH\n"
    "\u2192 candidate advances to evidence stages\n"
    "\u2192 does NOT constitute entity verification\n"
    "```\n"
    "\n"
    "A visual match is never sufficient for PASS. It can only fail to disqualify.\n"
    "\n"
    "### Observed evidence for this limit\n"
    "\n"
    "Drip Sneakers LV Skate intake, 2026-09-21. Two distinct products:\n"
    "\n"
    "```text\n"
    "LV Skate Sneaker White Brown              image batch 1D47CC\n"
    "LV Skate Sneaker White Brown With Rhinestones   image batch 1D47CE\n"
    "```\n"
    "\n"
    "The only entity-distinguishing difference is the presence or absence of gold\n"
    "rhinestones. At normal PDP zoom and image compression the two are routinely\n"
    "confused. They were separated only by slug plus SKU plus per-image checksum\n"
    "comparison, not by looking at them.\n"
    "\n"
    "```text\n"
    "Therefore:\n"
    "Visual identity is a hypothesis.\n"
    "Identifier evidence is the verdict.\n"
    "```\n"
    "\n"
    "## What a vision agent may emit\n"
    "\n"
    "Observation only. Never an identifier.\n"
    "\n"
    "```json\n"
    "{\n"
    "  \"visual_observation\": {\n"
    "    \"brand_visible\": \"\",\n"
    "    \"garment_or_shoe_type\": \"\",\n"
    "    \"base_color_visual\": \"\",\n"
    "    \"graphics\": \"\",\n"
    "    \"construction\": \"\",\n"
    "    \"special_features\": \"\"\n"
    "  },\n"
    "  \"fingerprint_verdict\": \"MATCH | MISMATCH | INSUFFICIENT\",\n"
    "  \"uncertain_points\": []\n"
    "}\n"
    "```\n"
    "\n"
    "Forbidden:\n"
    "\n"
    "```text\n"
    "Visual color      \u2192 Official Colorway\n"
    "Visual silhouette \u2192 Model code\n"
    "Visual detail     \u2192 SKU\n"
    "```\n"
    "These must stay separate fields. See \u00a74A for how the verdict maps to status.\n"
    "\n"
    "---\n"
    "\n",
    "s3A",
)

insert_before(
    "# 5. Independent SKU Rule",
    "# 4A. Entity Confidence Status\n"
    "\n"
    "Every product carries exactly one status before SEO generation is authorized.\n"
    "\n"
    "## ENTITY PASS\n"
    "\n"
    "```text\n"
    "Brand Confirmed\n"
    "+\n"
    "Product Type Confirmed\n"
    "+\n"
    "Model Confirmed\n"
    "+\n"
    "Colorway Confirmed\n"
    "+\n"
    "Visual Match Confirmed   (\u00a73A, as falsifier)\n"
    "+\n"
    "SKU Match when available\n"
    "+\n"
    "No conflicting identity-critical evidence\n"
    "```\n"
    "\n"
    "## PASS WITHOUT SKU\n"
    "\n"
    "```text\n"
    "Exact product entity confirmed\n"
    "+\n"
    "No public SKU verified\n"
    "+\n"
    "No conflicting evidence\n"
    "```\n"
    "\n"
    "This is the V4.5 name for the \u00a75A condition. It is a **full PASS**, not a\n"
    "downgrade. It authorizes every output except a SKU, which is omitted.\n"
    "\n"
    "## VERIFY\n"
    "\n"
    "```text\n"
    "Entity mostly confirmed\n"
    "but identifier evidence incomplete\n"
    "```\n"
    "\n"
    "Example: label code found, no official exact-product match.\n"
    "\n"
    "VERIFY does **not** authorize SEO generation. It authorizes more evidence\n"
    "collection, or a request to the user.\n"
    "\n"
    "## HOLD\n"
    "\n"
    "```text\n"
    "Multiple conflicting products\n"
    "Wrong product type\n"
    "Wrong colorway\n"
    "Supplier identity only\n"
    "SKU conflict\n"
    "Visual mismatch\n"
    "```\n"
    "\n"
    "## Authorization map\n"
    "\n"
    "| Status | SEO generation | Backend write | SKU emitted |\n"
    "|---|---|---|---|\n"
    "| ENTITY PASS | allowed | allowed after validation | yes, if verified |\n"
    "| PASS WITHOUT SKU | allowed | allowed after validation | omitted |\n"
    "| VERIFY | forbidden | forbidden | n/a |\n"
    "| HOLD | forbidden | forbidden | n/a |\n"
    "\n"
    "Hard rule:\n"
    "\n"
    "```text\n"
    "HOLD or VERIFY product \u2192 Generate SEO = FAILURE\n"
    "```\n"
    "\n"
    "> Conflict note. `AGENT_CONTRACT_V2.0.md` \u00a73 defines the states\n"
    "> OBSERVED / CANDIDATE / VERIFY / PASS / HOLD. V4.5 introduces no state outside\n"
    "> that machine. PASS WITHOUT SKU is a sub-case of PASS; ENTITY PASS is PASS.\n"
    "> The contract remains valid and needs no amendment.\n"
    "\n"
    "---\n"
    "\n",
    "s4A",
)

insert_before(
    "# 6. Product Naming Standard",
    "# 5B. SKU Field Isolation\n"
    "\n"
    "V4.4 \u00a75 requires the SKU to belong to the same exact entity. V4.5 adds the\n"
    "storage separation that makes that rule enforceable in a batch pipeline.\n"
    "\n"
    "Four distinct identifier classes exist and must never be stored in one field:\n"
    "\n"
    "```text\n"
    "Official SKU        brand / authorized-retailer / StockX / GOAT product code\n"
    "Internal SKU        Drip product ID\n"
    "Supplier Reference  supplier catalog number, batch code, DC2, PKGod code\n"
    "Image Code          image filename, hex prefix, upload-batch identifier\n"
    "```\n"
    "\n"
    "Routing:\n"
    "\n"
    "```text\n"
    "Official SKU\n"
    "        \u2192 front-end SEO allowed\n"
    "\n"
    "Internal SKU\n"
    "        \u2192 backend only\n"
    "\n"
    "Supplier Reference\n"
    "        \u2192 backend only, never public\n"
    "\n"
    "Image Code\n"
    "        \u2192 never used as identity, ever\n"
    "```\n"
    "\n"
    "Forbidden promotions:\n"
    "\n"
    "```text\n"
    "Supplier ID     \u2192 SKU\n"
    "Image Filename  \u2192 SKU\n"
    "URL ID          \u2192 SKU\n"
    "Batch Code      \u2192 SKU\n"
    "Drip product ID \u2192 SKU\n"
    "```\n"
    "\n"
    "## Why this is a storage rule and not a wording rule\n"
    "\n"
    "In a batch run the four classes arrive in the same row. If they share one\n"
    "column, a correct-looking value can pass a wording check while being the wrong\n"
    "class of identifier. Isolation makes the error impossible to express rather\n"
    "than merely forbidden. See \u00a717A for the pipeline that consumes these fields.\n"
    "\n"
    "---\n"
    "\n",
    "s5B",
)

insert_before(
    "# 7. SEO Title",
    "V4.5 addition \u2014 forbidden wording must also be rejected in supplier form when it\n"
    "appears as a standalone token rather than embedded in a phrase:\n"
    "\n"
    "```text\n"
    "Top Quality\n"
    "Best Quality\n"
    "PKGod / Pkgod\n"
    "Batch\n"
    "1:1\n"
    "Authentic Quality\n"
    "Supplier Name\n"
    "Internal Code\n"
    "```\n"
    "\n"
    "The gender-word ban in this section is unchanged and remains the stricter list.\n"
    "V4.5 does not narrow it.\n"
    "\n",
    "s6-names",
)

insert_before(
    "# 13. No Redundant Product-Name Repetition",
    "V4.5 addition \u2014 priority of the fifth field when the SKU is unavailable:\n"
    "\n"
    "```text\n"
    "1. Verified SKU\n"
    "2. Verified Collection Fact\n"
    "3. Verified Material Fact\n"
    "4. Verified Graphic Fact\n"
    "5. Verified Release Fact\n"
    "```\n"
    "\n"
    "Forbidden in the fifth field:\n"
    "\n"
    "```text\n"
    "Unknown SKU\n"
    "Supplier Code\n"
    "Country Origin\n"
    "Unsupported Material Claim\n"
    "```\n"
    "\n"
    "Country of origin is forbidden as a fifth-field value. Origin is a claim that\n"
    "counterfeit-marketplace sources assert freely and inconsistently; without a\n"
    "brand-official source for the exact entity it cannot be verified, and an\n"
    "unverified origin claim is worse than a missing field.\n"
    "\n",
    "s12-fifth",
)

insert_before(
    "# 16. Description Field \u2014 Image-Only Rule",
    "# 15A. Brand Architecture Layer\n"
    "\n"
    "\u00a715 defines the link rule for one PDP. V4.5 adds the site-level structure the\n"
    "rule has to fit into.\n"
    "\n"
    "```text\n"
    "Brand Hub\n"
    "        \u2193\n"
    "Collection / Model Hub\n"
    "        \u2193\n"
    "Product PDP\n"
    "```\n"
    "\n"
    "Example:\n"
    "\n"
    "```text\n"
    "Louis Vuitton\n"
    "        \u2193\n"
    "Louis Vuitton Trainer\n"
    "        \u2193\n"
    "Specific LV Trainer Product\n"
    "```\n"
    "\n"
    "## Resolution order for the Brand row\n"
    "\n"
    "Unchanged from \u00a715, restated for batch use:\n"
    "\n"
    "```text\n"
    "1. Verified brand hub\n"
    "2. Verified exact collection hub\n"
    "3. Verified broader category\n"
    "4. No guessed link\n"
    "```\n"
    "\n"
    "## Hard requirement \u2014 link must be probed, not predicted\n"
    "\n"
    "A destination may be written into an output only after an HTTP probe returns\n"
    "200 for that exact path. Predicted paths are not evidence.\n"
    "\n"
    "```text"
    "\n"
    "Probed 200 \u2192 may be written\n"
    "Probed 404 \u2192 must never be written\n"
    "Never probed \u2192 must not be written\n"
    "```"
    "\n"
    "\n"
    "### Verified site state, 2026-09-21\n"
    "\n"
    "Reachable (200):\n"
    "\n"
    "```text\n"
    "/Louis-Vuitton/\n"
    "/Louis-Vuitton-Skate/\n"
    "/Gallery-Dept/\n"
    "/STYLE-PICKS/\n"
    "/Designer-Sneakers/\n"
    "/Sneakers/\n"
    "```\n"
    "\n"
    "Not reachable (404) \u2014 must not appear in any SEO field:\n"
    "\n"
    "```text\n"
    "/Louis-Vuitton-Sneakers/\n"
    "/Size-Guide/\n"
    "/size-guide/\n"
    "/streetwear/\n"
    "/Streetwear/\n"
    "```\n"
    "\n"
    "`/Louis-Vuitton-Sneakers/` is the important one. An earlier PDP document listed\n"
    "it as a predicted path pending verification. It does not exist. Treating a\n"
    "predicted path as usable is exactly the failure mode \u00a715's \"never invent a\n"
    "category URL\" is written to prevent, and it survived into a shipped document.\n"
    "\n"
    "---\n"
    "\n",
    "s15A",
)

insert_before(
    "# 18. Why Product Details Belongs Inside Key Description Physically",
    "# 17A. Batch Agent Execution Mode\n"
    "\n"
    "Scope: multi-product intake where an existing catalogue has to be compared\n"
    "against a candidate set. Applies to LV Trainer backfill, LV Skate expansion,\n"
    "Prada batch migration and Dior / Balenciaga category builds.\n"
    "\n"
    "```text\n"
    "Read Existing Products\n"
    "        \u2193\n"
    "Build Existing Entity Database\n"
    "        \u2193\n"
    "Compare Candidate Products\n"
    "        \u2193\n"
    "Remove Duplicates\n"
    "        \u2193\n"
    "Entity Verification\n"
    "        \u2193\n"
    "Generate SEO\n"
    "        \u2193\n"
    "Publish Queue\n"
    "```\n"
    "\n"
    "## Mandatory preconditions\n"
    "\n"
    "```text\n"
    "1. The candidate set is frozen before comparison starts.\n"
    "2. The existing catalogue is read in full, not sampled.\n"
    "3. The publish queue is a queue, not an action. Nothing is written to the\n"
    "   backend until a human releases it.\n"
    "```\n"
    "\n"
    "## Duplicate detection \u2014 required evidence\n"
    "\n"
    "Forbidden:\n"
    "\n"
    "```text\n"
    "same price + same stock + similar description = duplicate\n"
    "```\n"
    "\n"
    "Required:\n"
    "\n"
    "```text\n"
    "Same physical product\n"
    "+\n"
    "Same design\n"
    "+\n"
    "Same colorway\n"
    "+\n"
    "Same construction\n"
    "+\n"
    "Same identifier evidence\n"
    "```\n"
    "\n"
    "Output per item:\n"
    "\n"
    "```json\n"
    "{\n"
    "  \"duplicate_status\": \"EXACT_DUPLICATE | COLOR_VARIANT | MODEL_VARIANT | UNIQUE | VERIFY\"\n"
    "}\n"
    "```\n"
    "\n"
    "## Why a full catalogue read is mandatory\n"
    "\n"
    "Observed failure, 2026-09-21. An external gap list for LV Skate was checked\n"
    "against an existing-catalogue set that had not been read in full. Two results:\n"
    "\n"
    "```text\n"
    "Items already present were reported as missing.\n"
    "Items genuinely missing were not reported at all.\n"
    "```\n"
    "\n"
    "A partial comparison set does not fail loudly. It fails in both directions at\n"
    "once while still producing a plausible-looking list. The precondition exists\n"
    "because the error is silent.\n"
    "\n"
    "## Scope boundary\n"
    "\n"
    "This mode generates a queue. Generating a queue is not authorization to publish.\n"
    "Publication is a separate, explicitly confirmed action.\n"
    "\n"
    "---\n"
    "\n",
    "s17A",
)

insert_before(
    "# 22. User Decision Layer",
    "\u00a713 restated with the V4.5 addition. ALT text must survive the Image Fingerprint\n"
    "gate: it must name the specific product, not the category.\n"
    "\n"
    "Wrong:\n"
    "\n"
    "```text\n"
    "Generic Shoe Image\n"
    "```\n"
    "\n"
    "Correct:\n"
    "\n"
    "```text\n"
    "Louis Vuitton LV Trainer White Blue Front View\n"
    "```\n"
    "\n"
    "An ALT that would still be accurate for a different product in the same family\n"
    "is not specific enough.\n"
    "\n",
    "s21-alt",
)

insert_before(
    "# 24. Current Hellstar Reference Implementation",
    "# 23A. Machine-Executable vs Human-Attested Validation\n"
    "\n"
    "The delivered V4.5 text presented a flat 13-key boolean checklist and described\n"
    "V4.5 as machine-executable. The checklist contains keys that no machine can\n"
    "evaluate. Splitting them is required, because a checklist that cannot actually\n"
    "be run will be run anyway, and the unverifiable keys will default to true.\n"
    "\n"
    "## Group A \u2014 machine-checkable\n"
    "\n"
    "Deterministic. A script can decide these and fail the build.\n"
    "\n"
    "```json\n"
    "{\n"
    "  \"sku_class_is_official_or_absent\": true,\n"
    "  \"supplier_wording_absent\": true,\n"
    "  \"gender_words_absent_from_public_fields\": true,\n"
    "  \"seo_title_valid\": true,\n"
    "  \"meta_description_template_match\": true,\n"
    "  \"meta_description_length_in_range\": true,\n"
    "  \"key_description_field_count_equals_5\": true,\n"
    "  \"brand_link_present\": true,\n"
    "  \"schema_json_parses\": true,\n"
    "  \"schema_absent_sku_when_sku_unverified\": true,\n"
    "  \"output_field_order_matches_section_25\": true\n"
    "}\n"
    "```\n"
    "\n"
    "## Group B \u2014 human-attested\n"
    "\n"
    "Requires judgment or external evidence. A machine may only record that an\n"
    "attestation exists and who made it. It must never default these to true.\n"
    "\n"
    "```json\n"
    "{\n"
    "  \"entity_status\": \"\",\n"
    "  \"visual_match\": \"\",\n"
    "  \"brand_verified\": \"\",\n"
    "  \"model_verified\": \"\",\n"
    "  \"colorway_verified\": \"\",\n"
    "  \"sku_verified_or_omitted\": \"\",\n"
    "  \"attested_by\": \"\",\n"
    "  \"attested_at\": \"\",\n"
    "  \"evidence_urls\": []\n"
    "}\n"
    "```\n"
    "\n"
    "## Fail-closed rule\n"
    "\n"
    "```text\n"
    "Group A key fails        \u2192 build fails\n"
    "Group B key unattested   \u2192 build fails\n"
    "Group B key absent       \u2192 build fails\n"
    "Group B key false       \u2192 build fails\n"
    "```\n"
    "\n"
    "Absence is not consent. An unattested Group B key is a HOLD, not a PASS.\n"
    "\n"
    "## Claim correction\n"
    "\n"
    "V4.5 is therefore **partially** machine-executable, not machine-executable.\n"
    "Group A can be automated. Group B cannot, and treating it as automatable is the\n"
    "single most likely way this standard produces a wrong PASS at scale.\n"
    "\n"
    "---\n"
    "\n",
    "s23A",
)

# ----------------------------------------------------------------------------
# 6. Final gate and final rules
# ----------------------------------------------------------------------------
sub_once(
    "# 26. V4.4 Final Gate\n"
    "\n"
    "```text\n"
    "SEO-PDP V4.4 PASS\n"
    "=\n"
    "Exact Entity PASS\n"
    "+\n"
    "Evidence PASS\n"
    "+\n"
    "SKU PASS when SKU exists\n"
    "+\n"
    "User Decision PASS\n"
    "+\n"
    "SEO Clean PASS\n"
    "+\n"
    "SERP Decision PASS\n"
    "+\n"
    "Meta Description Assurance PASS\n"
    "+\n"
    "Key Description Placement PASS\n"
    "+\n"
    "5-Field Product Details PASS\n"
    "+\n"
    "Brand Internal Link PASS\n"
    "+\n"
    "Description Image-Only PASS\n"
    "+\n"
    "Crawlability PASS\n"
    "```",
    "# 26. V4.5 Final Gate\n"
    "\n"
    "```text\n"
    "SEO-PDP V4.5 PASS\n"
    "\n"
    "=\n"
    "Image Fingerprint PASS          (no mismatch; not a verification)\n"
    "+\n"
    "Exact Entity PASS\n"
    "+\n"
    "Entity Confidence PASS          (ENTITY PASS or PASS WITHOUT SKU)\n"
    "+\n"
    "Source Priority PASS            (\u00a73)\n"
    "+\n"
    "Evidence PASS                   (\u00a723, Pass 2)\n"
    "+\n"
    "SKU Governance PASS             (\u00a75, \u00a75A, \u00a75B)\n"
    "+\n"
    "User Decision PASS              (\u00a722)\n"
    "+\n"
    "SEO Clean PASS\n"
    "+\n"
    "SERP Decision PASS\n"
    "+\n"
    "Meta Description Assurance PASS\n"
    "+\n"
    "Key Description Placement PASS\n"
    "+\n"
    "5-Field Product Details PASS\n"
    "+\n"
    "Brand Architecture PASS         (\u00a715, \u00a715A, links probed 200)\n"
    "+\n"
    "Description Image-Only PASS\n"
    "+\n"
    "Crawlability PASS               (\u00a717)\n"
    "+\n"
    "Machine Validation PASS         (\u00a723A Group A)\n"
    "+\n"
    "Human Attestation PASS          (\u00a723A Group B, all keys attested)\n"
    "+\n"
    "Three-Pass Audit PASS           (\u00a723)\n"
    "```\n"
    "\n"
    "A gate may not be satisfied by inference from another gate. Each line is\n"
    "recorded with its evidence reference.",
    "s26-gate",
)

sub_once(
    "# 27. V4.4 Final Rules",
    "# 27. V4.5 Final Rules",
    "s27-title",
)

insert_before(
    "> SEO starts only after Exact Entity PASS.",
    "> Candidate is not entity.\n"
    "\n"
    "> Visual similarity is not identity.\n"
    "\n"
    "> Brand similarity is not model identity.\n"
    "\n"
    "> A visual fingerprint can eliminate a candidate; it can never confirm one.\n"
    "\n"
    "> SKU evidence must belong to the same exact product.\n"
    "\n"
    "> Supplier references and image codes remain internal and are never identity.\n"
    "\n"
    "> One identifier field holds one identifier class.\n"
    "\n"
    "> Images prove. Key Description explains. Product Details verify. Meta Description converts SERP attention.\n"
    "\n"
    "> An internal link is written only after the destination has been probed and returned 200.\n"
    "\n"
    "> A batch run produces a queue, never a publication.\n"
    "\n"
    "> A checklist key that cannot be machine-evaluated must be attested by a named human, or it fails.\n"
    "\n"
    "> Absence of attestation is not consent.\n"
    "\n"
    "> V4.5 is partially machine-executable. Group A can be automated; Group B cannot.\n"
    "\n",
    "s27-rules",
)

# ----------------------------------------------------------------------------
# Write
# ----------------------------------------------------------------------------
with io.open(OUT, "w", encoding="utf-8", newline="\n") as fh:
    fh.write(text)

digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
print("OK  applied %d transforms" % len(applied))
for item in applied:
    print("    - " + item)
print("out   %s" % OUT)
print("lines %d" % len(text.splitlines()))
print("bytes %d" % len(text.encode("utf-8")))
print("sha256 %s" % digest)
