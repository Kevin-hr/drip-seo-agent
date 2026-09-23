"""V4.4 judgement layer — Jev questions for the whole Gucci pipeline.

Design rules followed (from the TypeSafe docs):
  - one narrow, coherent judgement per question
  - entity judgement must NOT be polluted by "is our stored name right" — that is a
    separate question, because a wrong legacy name is not evidence about the entity
  - structured `state`, referenced from `instructions` with backticks
  - every judgement carries criteria that describe concrete situations

Nothing here writes anything. Pure judgement.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from typesafe_client import ask


# ---------------------------------------------------------------- entity layer

def judge_entity_lock(observation: str, sku: str, candidate: dict) -> dict:
    """Is `candidate` the same exact entity as the product we hold?

    Deliberately does NOT pass our stored legacy name — a wrong old name must not
    bias the entity call.
    """
    state = {
        "our_product": {"sku": sku, "photo_observation": observation},
        "candidate": candidate,
    }
    questions = {
        "sku_identity": {
            "type": "noul",
            "instructions": "Is the SKU in `candidate` the SKU of the same single physical product as `our_product`?",
            "criteria": {
                "true": "The SKUs are equivalent forms of one product identifier",
                "false": "The SKUs differ, or one is not a SKU",
            },
        },
        "same_entity": {
            "type": "noul",
            "instructions": (
                "Does `candidate` describe the same exact product as `our_product`? "
                "Weigh the SKU, the model/series, and whether `candidate`'s colorway is "
                "consistent with `our_product.photo_observation`."
            ),
            "criteria": {
                "true": "Same model and same colorway; the candidate could be used to describe our exact item",
                "false": "A different model, or the same model in a materially different colorway",
            },
        },
        "source_tier_adequate": {
            "type": "noul",
            "instructions": (
                "Is `candidate.source_type` strong enough to serve as an independent "
                "authority for this product's identity and SKU, or is it a low-authority "
                "marketplace/supplier listing?"
            ),
            "criteria": {
                "true": "Brand official, authorized retailer, StockX, GOAT, or an established retailer with structured product data",
                "false": "Marketplace seller listing, supplier page, or image recognition only",
            },
        },
    }
    return ask(state, questions)


def judge_legacy_name(observation: str, legacy_name: str, canonical_name: str) -> dict:
    """Is our stored name accurate? Is the proposed new name accurate?"""
    state = {
        "photo_observation": observation,
        "legacy_stored_name": legacy_name,
        "proposed_name": canonical_name,
    }
    questions = {
        "legacy_name_accurate": {
            "type": "noul",
            "instructions": (
                "Is `legacy_stored_name` an accurate consumer-facing name for the product "
                "shown in `photo_observation`?"
            ),
            "criteria": {
                "true": "The name accurately identifies the product including its colorway",
                "false": "The name misdescribes the product, e.g. names a colorway the photo contradicts",
            },
        },
        "proposed_name_accurate": {
            "type": "noul",
            "instructions": (
                "Is `proposed_name` an accurate consumer-facing name for the product shown "
                "in `photo_observation`?"
            ),
            "criteria": {
                "true": "Accurately identifies brand, model and colorway",
                "false": "Mislabels brand, model, or colorway",
            },
        },
    }
    return ask(state, questions)


def judge_colorway(observation: str, candidates: dict) -> dict:
    """Pick the best colorway term from a set we supply."""
    state = {"photo_observation": observation}
    questions = {
        "colorway_term": {
            "type": "choice",
            "instructions": (
                "Which term best and most accurately names the colorway of the product in "
                "`photo_observation`? Prefer the term a retailer or the brand would use, not "
                "a description of a single component."
            ),
            "criteria": {k: v for k, v in candidates.items()},
        },
        "most_identity_critical": {
            "type": "choice",
            "instructions": (
                "Which feature of the product in `photo_observation` most strongly "
                "distinguishes this exact colorway from other colorways of the same model?"
            ),
            "criteria": {
                "panel_artwork": "The artwork/pattern and colour of the side panel that carries the monogram canvas",
                "web_stripe": "The colour combination of the side stripe",
                "sole_and_heel": "The sole material/colour and heel tab",
                "overall_base_colour": "The dominant colour of the main upper leather",
            },
        },
    }
    return ask(state, questions)


# ------------------------------------------------------------- V4.4 compliance

def judge_v44_compliance(pdp: dict) -> dict:
    """Pass-3 style audit of a generated PDP. Judgement only — policy stays in code."""
    state = {"pdp": pdp}
    q = {
        "meta_exact_entity": {
            "type": "noul",
            "instructions": "Does `pdp.meta_description` open by naming the exact product entity, so a searcher can recognise it?",
            "criteria": {"true": "The exact product entity is clearly present",
                         "false": "The entity is absent, vague, or replaced by feature description"},
        },
        "meta_reps_intent": {
            "type": "noul",
            "instructions": "Does `pdp.meta_description` convey reps intent (the shopper is looking for a replica/rep)?",
            "criteria": {"true": "Reps intent is explicit", "false": "Reps intent missing or replaced by other wording"},
        },
        "meta_assurance_trio": {
            "type": "noul",
            "instructions": "Does `pdp.meta_description` include all three purchase assurances: QC photos, 30-day returns, and 7-20 day shipping?",
            "criteria": {"true": "All three assurances appear", "false": "One or more of the three is missing"},
        },
        # NOTE: the unsupported-claim check deliberately lives in Gate 3 as a
        # deterministic blacklist regex, NOT here. Measured on identical text this
        # question returned 0.15 / 0.75 / 0.17 across three phrasings, because it is
        # a policy/wordlist rule rather than a semantic judgement. Known rules stay
        # in code; Jev is used only where meaning must be interpreted.
        "meta_no_feature_stuffing": {
            "type": "noul",
            "instructions": (
                "Does `pdp.meta_description` avoid spending its space on secondary product "
                "features (materials, laces, colour details, decorative elements) instead of "
                "purchase-assurance information?"
            ),
            "criteria": {"true": "Space is not spent on low-priority product features",
                         "false": "Secondary product features displace purchase-assurance information"},
        },
        "kd_not_repeating_entity": {
            "type": "noul",
            "instructions": (
                "Does `pdp.key_description_sentence` explain what is visually distinctive about "
                "this product, rather than mechanically repeating the full product name?"
            ),
            "criteria": {"true": "The sentence adds visual/decision information beyond the name",
                         "false": "The sentence largely restates the product name"},
        },
        "kd_sentence_matches_photo": {
            "type": "noul",
            "instructions": "Is every visual claim in `pdp.key_description_sentence` supported by `pdp.photo_observation`?",
            "criteria": {"true": "All claims are directly supported by the observation",
                         "false": "At least one claim is not supported by the observation"},
        },
        "details_five_high_value": {
            "type": "noul",
            "instructions": (
                "Are all five entries in `pdp.product_details` high-value verified attributes "
                "(brand, product type, model/collection, colorway, and SKU or a verified "
                "product-specific fact), with no weak filler entry?"
            ),
            "criteria": {"true": "All five are high-value verified attributes",
                         "false": "At least one entry is weak filler or unverified"},
        },
        "title_carries_sku_once": {
            "type": "noul",
            "instructions": "Does `pdp.seo_title` contain the verified SKU exactly once?",
            "criteria": {"true": "SKU appears exactly once", "false": "SKU missing or appears more than once"},
        },
        "keywords_not_cannibalising": {
            "type": "noul",
            "instructions": (
                "Are `pdp.keywords` specific to this exact product, rather than generic terms "
                "that would also describe many other products in the same category?"
            ),
            "criteria": {"true": "Keywords are product-specific",
                         "false": "Keywords are mostly generic category terms"},
        },
    }
    return ask(state, q)


if __name__ == "__main__":
    print("import this module; run gen_pdp.py to generate a PDP")
