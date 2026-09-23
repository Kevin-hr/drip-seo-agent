"""Batch generator: Gate 1 (entity lock) -> V4.4 PDP -> Gate 2/3, for every product
that has evidence. Products with an evidence conflict are HOLDed and produce no SEO.

Run:  python batch_gen.py [pid ...]
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from jev_judgments import judge_legacy_name, judge_colorway, judge_v44_compliance
from gates import gate2_name, gate3_content

CDN = "https://images.mrshopplus.com/"
BRAND_URL = "https://www.dripsneakers.org/Gucci/"
ALT_VIEWS = ["Side View", "Front View", "Back View", "Top View",
             "Sole Detail", "Graphic Detail"]

NAME_MIN = 0.70
COLORWAY_MIN = 0.60
COMPLIANCE_MIN = 0.70

# Semantic style judgements: reported as improvements, not used to hard-block a
# product. The structural requirements they approximate (one sentence that is not
# the product name; exactly five attribute rows) are enforced deterministically by
# Gate 3 instead, so a low score here does not by itself mean the PDP is invalid.
SOFT_KEYS = {"kd_sentence_matches_photo", "details_five_high_value",
             "keywords_not_cannibalising", "kd_not_repeating_entity"}


def build_pdp(pid, ev, record):
    name = ev["proposed_name"]
    sku = ev["sku"]
    imgs = (record.get("prod") or {}).get("ImgList") or []

    sentence = ev["key_sentence"]
    key_description = (
        f"<p>\n{sentence}\n</p>\n\n<h2>Product Details</h2>\n\n<ul>\n"
        f'<li><strong>Brand:</strong> <a href="{BRAND_URL}"><strong>{ev["brand"]}</strong></a></li>\n'
        f'<li><strong>Product Type:</strong> {ev["product_type"]}</li>\n'
        f'<li><strong>Model:</strong> {ev["model"]}</li>\n'
        f'<li><strong>Colorway:</strong> {ev["colorway"]}</li>\n'
        f"<li><strong>SKU:</strong> {sku}</li>\n</ul>"
    )
    slug = f"{name} {sku}".lower().replace(" ", "-")

    return {
        "pid": pid,
        "product_name": name,
        "h1": name,
        "seo_title": f"{name} {sku} Reps | Drip Sneakers",
        "keywords": ", ".join([
            name, f"{name} Sneakers", f"Gucci {ev['colorway']} Sneakers",
            sku, "Gucci Screener Reps"]),
        "meta_description": (f"Shop {name} reps ({sku}) at Drip Sneakers with QC photos, "
                             f"30-day returns and 7\u201320 day shipping."),
        "url_slug": slug,
        "canonical": f"https://www.dripsneakers.org/{slug}",
        "key_description": key_description,
        "key_description_sentence": sentence,
        "description_rule": "product detail images only",
        "description_html": "\n".join(
            f'<img src="{CDN}{im["s"]}" alt="{name} {v}" />'
            for im, v in zip(imgs, ALT_VIEWS)),
        "image_alt": [f"{name} {v}" for v in ALT_VIEWS],
        "photo_observation": ev["observation"],
        "schema": {"@context": "https://schema.org", "@type": "Product", "name": name,
                   "brand": {"@type": "Brand", "name": ev["brand"]},
                   "category": ev["product_type"], "color": ev["colorway"], "sku": sku},
    }


def main():
    evidence = json.loads((HERE / "evidence.json").read_text(encoding="utf-8"))
    detail = json.loads((HERE / "unpublished_detail.json").read_text(encoding="utf-8"))
    only = set(sys.argv[1:])

    report = {"PASS": [], "HOLD": [], "NEEDS_EVIDENCE": []}
    results = {}

    for pid, ev in evidence.items():
        if pid.startswith("_") or (only and pid not in only):
            continue
        name = ev.get("legacy_name") or pid

        if ev.get("conflict"):
            report["HOLD"].append({"pid": pid, "name": name, "reason": ev["conflict"]})
            print(f"HOLD  {pid}  {name}\n      -> {ev['conflict']['detail']}")
            continue

        if not ev.get("observation"):
            report["NEEDS_EVIDENCE"].append({"pid": pid, "name": name})
            print(f"NOEV  {pid}  {name}")
            continue

        nm = judge_legacy_name(ev["observation"], ev.get("legacy_name", ""), ev["proposed_name"])
        cw = judge_colorway(ev["observation"], ev["colorway_options"])
        name_acc = nm["answers"]["proposed_name_accurate"]["noul"]
        legacy_acc = nm["answers"]["legacy_name_accurate"]["noul"]
        cw_conf = cw["answers"]["colorway_term"]["confidence"]

        pdp = build_pdp(pid, ev, detail[pid])
        comp = judge_v44_compliance(pdp)
        cscores = {k: v["noul"] for k, v in comp["answers"].items()}
        weak = {k: v for k, v in cscores.items() if v < COMPLIANCE_MIN}
        weak_hard = {k: v for k, v in weak.items() if k not in SOFT_KEYS}
        weak_soft = {k: v for k, v in weak.items() if k in SOFT_KEYS}

        ok = name_acc >= NAME_MIN and cw_conf >= COLORWAY_MIN and not weak_hard
        gates = {
            "gate2": gate2_name(pdp["product_name"]),
            "gate3": gate3_content({"Content": pdp["description_html"],
                                    "SeoTitle": pdp["seo_title"],
                                    "SeoDesc": pdp["meta_description"],
                                    "SeoKeyword": pdp["keywords"], "Summary": "",
                                    "BrandId": "set-in-key-description",
                                    "UrlValue": pdp["url_slug"], "BasePrice": 1}),
        }
        verdict = "PASS" if (ok and not gates["gate2"] and not gates["gate3"]) else "HOLD"
        (report[verdict]).append({"pid": pid, "name": name})

        print(f"{verdict}  {pid}  {pdp['product_name']}")
        print(f"      legacy_name_accurate={legacy_acc:.2f}  proposed_name_accurate={name_acc:.2f}"
              f"  colorway={cw['answers']['colorway_term']['choice']}(conf {cw_conf:.2f})")
        if weak_hard:
            print(f"      weak compliance (blocking): {json.dumps(weak_hard, ensure_ascii=False)}")
        if weak_soft:
            print(f"      weak compliance (soft, recorded): {json.dumps(weak_soft, ensure_ascii=False)}")
        if gates["gate2"]:
            print(f"      gate2 FAIL: {gates['gate2']}")
        if gates["gate3"]:
            print(f"      gate3 FAIL: {gates['gate3']}")

        results[pid] = {"evidence": ev, "verdict": verdict, "pdp": pdp,
                        "jev": {"naming": nm, "colorway": cw, "compliance": comp},
                        "gates": gates}

    out = HERE / "batch1_results.json"
    out.write_text(json.dumps({"report": report, "results": results},
                              ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 60)
    print(f"PASS {len(report['PASS'])}   HOLD {len(report['HOLD'])}   "
          f"NEEDS_EVIDENCE {len(report['NEEDS_EVIDENCE'])}")
    print(f"wrote {out.name}")


if __name__ == "__main__":
    main()
