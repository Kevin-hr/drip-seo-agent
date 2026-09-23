"""Generate a V4.4 PDP for one product, with Jev as the judgement layer.

Evidence (entity lock) is supplied per product. Visual observations come from
reading the actual product photos — never from filenames.

Run:  python gen_pdp.py <pid>
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

# ---------------------------------------------------------------------------
# Entity evidence, established per product by: reading the photos + independent
# Tier 1-4 sources. `observation` is what the photos actually show.
# ---------------------------------------------------------------------------
CASES = {
    "536027265030940": {
        "legacy_name": "Gucci Women's Screener Sneaker Pink",
        "observation": (
            "Low-top sneaker. Off-white / light-grey leather upper. A purple GG monogram "
            "canvas side panel containing red GG lettering. A red and green Web stripe "
            "running down the side. Gum / brown rubber sole with a distressed vintage "
            "finish. White heel tab carrying a GG logo."
        ),
        "sku": "570443-9SFR0-5270",
        "brand": "Gucci",
        "product_type": "Sneakers",
        "model": "Screener Series GG",
        "colorway": "Red Green",
        "proposed_name": "Gucci Screener Series GG Red Green",
        "sources": [
            {"source_type": "established sneaker retailer (KicksCrew)",
             "title": "(WMNS) Gucci Screener Series GG 'Red Green'",
             "sku": "570443-9SFR0-5270", "colorway": "red/green",
             "series": "Screener Sneaker", "release_date": "2021-07-27"},
        ],
        "colorway_options": {
            "Red Green": "The retailer/brand colorway term describing the stripe colours",
            "Pink": "Names the product pink",
            "Purple GG": "Names only the monogram canvas panel colour",
            "White Leather": "Names only the upper material colour",
        },
        "alt_views": ["Side View", "Front View", "Back View", "Top View",
                      "Sole Detail", "Graphic Detail"],
    },
}


def build_pdp(pid: str, ev: dict, record: dict) -> dict:
    name = ev["proposed_name"]
    sku = ev["sku"]
    imgs = record.get("prod", {}).get("ImgList") or []

    seo_title = f"{name} {sku} Reps | Drip Sneakers"
    keywords = [
        name,
        f"{name} Sneakers",
        f"Gucci {ev['colorway']} Sneakers",
        sku,
        "Gucci Screener Reps",
    ]
    meta = (f"Shop {name} reps ({sku}) at Drip Sneakers with QC photos, "
            f"30-day returns and 7\u201320 day shipping.")

    key_desc_sentence = (
        "This Gucci Screener pairs an off-white leather upper with a purple GG canvas "
        "side panel, a red and green Web stripe and a gum rubber sole."
    )
    key_description = (
        f"<p>\n{key_desc_sentence}\n</p>\n\n"
        "<h2>Product Details</h2>\n\n<ul>\n"
        f'<li><strong>Brand:</strong> <a href="{BRAND_URL}"><strong>Gucci</strong></a></li>\n'
        f"<li><strong>Product Type:</strong> {ev['product_type']}</li>\n"
        f"<li><strong>Model:</strong> {ev['model']}</li>\n"
        f"<li><strong>Colorway:</strong> {ev['colorway']}</li>\n"
        f"<li><strong>SKU:</strong> {sku}</li>\n"
        "</ul>"
    )

    slug = f"{name} {sku}".lower().replace(" ", "-")
    canonical = f"https://www.dripsneakers.org/{slug}"

    desc_html = "\n".join(
        f'<img src="{CDN}{im["s"]}" alt="{name} {view}" />'
        for im, view in zip(imgs, ev["alt_views"])
    )

    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "brand": {"@type": "Brand", "name": ev["brand"]},
        "category": ev["product_type"],
        "color": ev["colorway"],
        "sku": sku,
    }

    return {
        "pid": pid,
        "product_name": name,
        "h1": name,
        "seo_title": seo_title,
        "keywords": ", ".join(keywords),
        "meta_description": meta,
        "url_slug": slug,
        "canonical": canonical,
        "key_description": key_description,
        "key_description_sentence": key_desc_sentence,
        "description_rule": "product detail images only",
        "description_html": desc_html,
        "image_alt": [f"{name} {v}" for v in ev["alt_views"]],
        "schema": schema,
        "photo_observation": ev["observation"],
    }


def main():
    pid = sys.argv[1] if len(sys.argv) > 1 else "536027265030940"
    ev = CASES[pid]
    detail = json.loads((HERE / "unpublished_detail.json").read_text(encoding="utf-8"))
    record = detail[pid]

    pdp = build_pdp(pid, ev, record)

    print("=" * 78)
    print("JEV: naming judgement")
    print("=" * 78)
    nm = judge_legacy_name(ev["observation"], ev["legacy_name"], ev["proposed_name"])
    print(json.dumps(nm, ensure_ascii=False, indent=2))

    print("=" * 78)
    print("JEV: colorway + identity-critical feature")
    print("=" * 78)
    cw = judge_colorway(ev["observation"], ev["colorway_options"])
    print(json.dumps(cw, ensure_ascii=False, indent=2))

    print("=" * 78)
    print("JEV: V4.4 compliance audit")
    print("=" * 78)
    comp = judge_v44_compliance(pdp)
    print(json.dumps(comp, ensure_ascii=False, indent=2))

    print("=" * 78)
    print("DETERMINISTIC GATES")
    print("=" * 78)
    g2 = gate2_name(pdp["product_name"])
    print(f"Gate 2 naming: {'PASS' if not g2 else 'FAIL ' + str(g2)}")
    fake_prod = {
        "Content": pdp["description_html"],
        "SeoTitle": pdp["seo_title"],
        "SeoDesc": pdp["meta_description"],
        "SeoKeyword": pdp["keywords"],
        "Summary": "",
        "BrandId": "x",          # brand link is written into Key Description in V4.4
        "UrlValue": pdp["url_slug"],
        "BasePrice": 0,
    }
    g3 = gate3_content(fake_prod)
    print(f"Gate 3 content: {'PASS' if not g3 else 'FAIL'}")
    for e in g3:
        print("   -", e)

    out = HERE / f"pdp_{pid}.json"
    out.write_text(json.dumps(
        {"evidence": ev, "pdp": pdp,
         "jev": {"naming": nm, "colorway": cw, "compliance": comp},
         "gates": {"gate2": g2, "gate3": g3}},
        ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nwrote {out.name}")


if __name__ == "__main__":
    main()
