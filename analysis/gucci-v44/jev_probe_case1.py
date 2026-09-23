"""Probe Jev's ability on a REAL case: does it detect that our stored name misdescribes the entity?

Case: pid 536027265030940, stored name "Gucci Women's Screener Sneaker Pink",
SKU 570443 9SFR0 5270, observed in photo as off-white leather + purple GG canvas + red/green Web.
Independent retail sources name this entity "(WMNS) Gucci Screener Series GG 'Red Green'".
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from typesafe_client import ask

TARGET = {
    "our_stored_name": "Gucci Women's Screener Sneaker Pink",
    "sku": "570443 9SFR0 5270",
    "our_photo_observation": (
        "Low-top sneaker. Off-white / light grey leather upper. A purple GG monogram "
        "canvas panel on the side containing red GG lettering. A red-and-green Web "
        "stripe running down the side. Gum / brown rubber sole. White heel tab with "
        "a GG logo. Distressed / vintage finish on the sole edges."
    ),
}

CANDIDATE = {
    "source_type": "established sneaker retailer (KicksCrew)",
    "title": "(WMNS) Gucci Screener Series GG 'Red Green'",
    "sku": "570443-9SFR0-5270",
    "colorway": "red/green",
    "series": "Screener Sneaker",
    "release_date": "2021-07-27",
}

state = {"target": TARGET, "candidate": CANDIDATE}

questions = {
    "sku_identity": {
        "type": "noul",
        "instructions": "Is the SKU in `candidate` the SKU of the exact same physical product as `target`?",
        "criteria": {
            "true": "The SKUs are equivalent and refer to one product",
            "false": "The SKUs differ or refer to different products",
        },
    },
    "candidate_same_entity": {
        "type": "noul",
        "instructions": (
            "Does `candidate` describe the same exact product as `target`, taking into "
            "account the SKU, the series, and whether `candidate`'s colorway is consistent "
            "with `target.our_photo_observation`?"
        ),
        "criteria": {
            "true": "Same exact model, collaboration/collection and colorway",
            "false": "A different product, or a different colorway of the same model",
        },
    },
    "our_name_accurate": {
        "type": "noul",
        "instructions": (
            "Is `target.our_stored_name` an accurate consumer-facing name for this entity, "
            "or does it misdescribe the product's appearance?"
        ),
        "criteria": {
            "true": "The name accurately identifies this product, including its colorway",
            "false": "The name misdescribes the product, for example naming a colorway that "
                     "is not what the photo shows",
        },
    },
    "colorway_term": {
        "type": "choice",
        "instructions": "Which colorway term best and accurately describes this exact entity?",
        "criteria": {
            "Red Green": "Describes the Web stripe colors as the retail colorway term",
            "Pink": "Describes the product as pink",
            "Purple GG": "Describes only the monogram canvas panel color",
            "White Leather": "Describes only the upper material color",
        },
    },
    "identity_critical_features": {
        "type": "choice",
        "instructions": "Which single feature is most identity-critical for distinguishing this exact entity from other Gucci Screener colorways?",
        "criteria": {
            "canvas panel color and pattern": "The GG canvas panel's color and patterning",
            "web stripe colors": "The red-green stripe",
            "sole type": "Gum vs white sole",
            "heel tab": "The heel tab",
        },
    },
}

if __name__ == "__main__":
    res = ask(state, questions)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    (Path(__file__).parent / "jev_probe_case1.json").write_text(
        json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
