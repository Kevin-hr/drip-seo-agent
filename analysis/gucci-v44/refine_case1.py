"""Iterate on our own output using Jev.

1. Compare several naming candidates in ONE call (fan-out over hypotheses).
2. Re-ask the unsupported-claim question with sharper criteria, to separate a
   false positive from a real problem.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from typesafe_client import ask

OBS = (
    "Low-top sneaker. Off-white / light-grey leather upper. A purple GG monogram "
    "canvas side panel containing red GG lettering. A red and green Web stripe "
    "running down the side. Gum / brown rubber sole with a distressed vintage "
    "finish. White heel tab carrying a GG logo."
)

NAME_CANDIDATES = [
    "Gucci Screener Series GG Red Green",
    "Gucci Screener GG Red Green Sneaker",
    "Gucci Screener Series GG Sneaker Red Green",
    "Gucci Screener Sneaker Red Green",
    "Gucci Screener Series GG 'Red Green'",
]

META = ("Shop Gucci Screener Series GG Red Green reps (570443-9SFR0-5270) at Drip "
        "Sneakers with QC photos, 30-day returns and 7\u201320 day shipping.")

state = {"photo_observation": OBS, "candidate_names": NAME_CANDIDATES, "meta": META}

questions = {
    "best_name": {
        "type": "choice",
        "instructions": (
            "Which entry in `candidate_names` is the most accurate consumer-facing product "
            "name for the item in `photo_observation`? Prefer brand + model/collection + "
            "colourway, without supplier wording, and without quoting marks unless the "
            "retail name requires them."
        ),
        "criteria": {n: None for n in NAME_CANDIDATES},
    },
    "claim_verdict": {
        "type": "choice",
        "instructions": (
            "Does `meta` contain any unsupported or over-strong trust claim? The only "
            "approved purchase wording is the exact set: QC photos, 30-day returns, "
            "7-20 day shipping. Anything stronger, such as real QC photos, guaranteed "
            "delivery, 1:1 guaranteed, authentic quality, best quality, or turning the "
            "shipping range into a delivery promise, is unsupported."
        ),
        "criteria": {
            "clean": "The meta text contains only approved wording and no unsupported claim",
            "has_unsupported_claim": "The meta text contains at least one unsupported or over-strong claim",
        },
    },
    "which_part_unsupported": {
        "type": "choice",
        "instructions": (
            "If `meta` contains an unsupported claim, which part of it is the unsupported "
            "one? If none is unsupported, choose 'none'."
        ),
        "criteria": {
            "none": "Nothing in the text is unsupported",
            "the QC photos phrase": "The wording about QC photos is too strong",
            "the returns phrase": "The wording about returns is too strong",
            "the shipping phrase": "The wording about shipping is too strong",
            "the reps phrase": "The wording about reps is the problem",
            "the opening verb": "The opening verb (Shop) is the problem",
        },
    },
}

if __name__ == "__main__":
    res = ask(state, questions)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    (HERE / "jev_refine_case1.json").write_text(
        json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
