"""Gate 2 (naming compliance) + Gate 3 (content compliance) — deterministic checkers.

These two gates require no external service. They are the only defense against
the two silent-failure classes the Murphy audit identified as most dangerous:
  - C1: a new product name that silently drops the product out of the auto-category
  - A4/A5/D1: forbidden supplier wording, dead-domain links, or text left in Content

Run against the CURRENT state to establish a quantified baseline.
"""
import json
import re
from pathlib import Path

OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")

# --- the auto-category condition, derived from the live API (11 rows) ---
REQUIRED_TOKEN = "gucci"
EXCLUDE_TOKENS = ["short", "tee", "jacket", "pants", "necklace", "polo",
                  "bag", "scarf", "t-shirt", "shirt"]

# --- V4.4 unsupported-claim guard + supplier leakage ---
BLACKLIST = [
    "pkgod", "perfect kicks", "pk factory", "1:1", "replica",
    "best quality", "authentic quality", "guaranteed delivery",
    "guaranteed qc", "real qc photos", "top quality", "high-quality replica",
]
DEAD_DOMAIN = "dripsneakers.net"


def gate2_name(name: str) -> list:
    """Returns list of violations. Empty list == PASS."""
    errs = []
    n = (name or "").strip().lower()
    if REQUIRED_TOKEN not in n:
        errs.append(f'MISSING required token "{REQUIRED_TOKEN}" -> drops out of category')
    for t in EXCLUDE_TOKENS:
        if t in n:
            errs.append(f'HIT exclude token "{t}" -> drops out of category')
    return errs


def gate3_content(prod: dict) -> list:
    """Returns list of violations on the product record. Empty list == PASS."""
    errs = []
    content = prod.get("Content") or ""
    lc = content.lower()

    # A5 dead domain
    if DEAD_DOMAIN in lc:
        errs.append(f"A5 Content contains dead domain {DEAD_DOMAIN} "
                    f"({lc.count(DEAD_DOMAIN)}x)")
    # A4 blacklist across all written fields
    fields = {"Content": content,
              "SeoTitle": prod.get("SeoTitle") or "",
              "SeoDesc": prod.get("SeoDesc") or "",
              "SeoKeyword": prod.get("SeoKeyword") or "",
              "Summary": prod.get("Summary") or ""}
    for fname, val in fields.items():
        v = val.lower()
        for b in BLACKLIST:
            if b in v:
                errs.append(f'A4 {fname}: forbidden phrase "{b}"')
    # D1 Content must be image-only
    n_img = lc.count("<img")
    has_text = bool(re.sub(r"<[^>]+>", "", content).strip())
    if n_img == 0:
        errs.append("D1 Content has no <img> (V4.4 requires image-only)")
    if has_text:
        errs.append("D1 Content still carries visible text (V4.4 requires image-only)")
    # F8 residual CSS from scraped GOAT/StockX pages
    if "chakra-" in lc:
        errs.append("F8 Content retains scraped CSS class (chakra-)")
    # D2 legacy V3.3 structure
    if 'data-version="3.3"' in lc:
        errs.append("D2 Content is legacy V3.3 structure")
    # SEO field integrity
    if not (prod.get("SeoTitle") or "").strip() or \
       (prod.get("SeoTitle") or "").strip().lower().startswith(" reps"):
        errs.append("F4 SeoTitle missing product name")
    if not (prod.get("BrandId") or prod.get("BrandName")):
        errs.append("D5 BrandId/BrandName empty -> brand internal link has no anchor")
    if (prod.get("UrlValue") or "").startswith("-"):
        errs.append("C3 UrlValue has leading '-' (dirty slug)")
    # E1 price
    if not prod.get("BasePrice"):
        errs.append("E1 BasePrice is 0/empty")
    return errs


def main():
    d = json.loads((OUT / "unpublished_detail.json").read_text(encoding="utf-8"))
    rows = []
    for pid, rec in d.items():
        prod = rec.get("prod") or {}
        name = prod.get("Name") or ""
        rows.append({
            "pid": pid,
            "name": name,
            "gate2": gate2_name(name),
            "gate3": gate3_content(prod),
        })

    (OUT / "gate_baseline.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    print("=" * 78)
    print("GATE 2 — naming compliance (current state)")
    print("=" * 78)
    g2_pass = [r for r in rows if not r["gate2"]]
    print(f"PASS {len(g2_pass)}/{len(rows)}")
    for r in rows:
        if r["gate2"]:
            print(f"  FAIL {r['pid']} {(r['name'] or '')[:50]!r}: {r['gate2']}")

    print()
    print("=" * 78)
    print("GATE 3 — content compliance (current state)")
    print("=" * 78)
    from collections import Counter
    cats = Counter()
    g3_pass = 0
    for r in rows:
        if not r["gate3"]:
            g3_pass += 1
        for e in r["gate3"]:
            cats[e.split(" ")[0]] += 1
    print(f"PASS {g3_pass}/{len(rows)}")
    print("\nviolation counts by code:")
    for code, n in cats.most_common():
        print(f"  {code}: {n}")

    print("\nper-product violation counts:")
    for r in rows:
        print(f"  {r['pid']} | gate2={len(r['gate2'])} gate3={len(r['gate3']):2d} | {(r['name'] or '')[:44]}")

    total = sum(len(r["gate3"]) for r in rows)
    print(f"\nTOTAL Gate3 violations across 27 products: {total}")
    print(f"products fully clean: {g3_pass}/27")


if __name__ == "__main__":
    main()
