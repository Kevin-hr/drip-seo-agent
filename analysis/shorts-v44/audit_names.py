"""READ-ONLY: name-quality grading + corrected internal-link mapping + image inventory."""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

BASE = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
GUCCI = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")

detail = json.loads((BASE / "unpublished_detail.json").read_text(encoding="utf-8"))
cats = json.loads((GUCCI / "categories_all.json").read_text(encoding="utf-8"))
by_name = {c["Name"].lower().strip(): c for c in cats}

BRAND_PATTERNS = [
    ("Louis Vuitton", "/Louis-Vuitton-Shorts/"),
    ("Chrome Hearts", "/Chrome-Hearts-Shorts/"),
    ("Thom Browne", "/Thom-Browne/"),
    ("Fear of God", "/Fear-of-God/"),
    ("Gallery Dept", "/Gallery-Dept/"),
    ("Stone Island", "/Stone-Island/"),
    ("Travis Scott", None),
    ("Hellstar", "/Hellstar-Shorts/"),
    ("Trapstar", "/Trapstar/"),
    ("Godspeed", "/Godspeed/"),
    ("Sp5der", "/Sp5der/"),
    ("adidas", "/Adidas/"),
    ("Dior", "/Dior/"),
    ("Fendi", "/Fendi/"),
    ("Rhude", "/Rhude/"),
    ("Balenciaga", "/Balenciaga/"),
]

print("=== E. NAME QUALITY GRADING (n=%d) ===" % len(detail))
grade_rows = []
for pid in [str(k) for k in detail]:
    prod = (detail[pid].get("prod") or {})
    name = (prod.get("Name") or "").strip()
    # A: contains an alphanumeric code with >=2 digits mixed with letters, or a long numeric run
    has_code = bool(re.search(r"\b(?=[A-Z0-9\-]*[A-Z])(?=[A-Z0-9\-]*\d)[A-Z0-9\-]{5,}\b", name))
    has_sku_like = bool(re.search(r"\b\d{6,}\b", name))
    has_supplier_prefix = name.lower().startswith("top quality") or "top-quality" in (prod.get("UrlValue") or "").lower()
    bare_number = bool(re.match(r"^[\w\s\-&']+\s\d{2,4}$", name))
    if has_sku_like:
        g = "A  official-style SKU in name"
    elif has_code:
        g = "B  code-like token in name"
    elif bare_number:
        g = "C  brand+item+bare内部编号"
    else:
        g = "D  descriptive only"
    grade_rows.append((pid, name, g, has_supplier_prefix, len(name)))

for pid, name, g, sup, n in grade_rows:
    print(f"  {pid} | {g[:28]:28s} | sup={int(sup)} | {name}")

print("\n--- grade counts ---")
for k, v in Counter(g[2] for g in grade_rows).most_common():
    print(f"  {v:3d}  {k}")
print("--- supplier-prefixed names (Top Quality) ---")
print("  ", sum(1 for g in grade_rows if g[3]), "/", len(grade_rows))

print("\n=== F. CORRECTED BRAND -> INTERNAL LINK ===")
bcount = Counter()
bhit = {}
for pid, name, g, sup, n in grade_rows:
    for pat, url in BRAND_PATTERNS:
        if name.lower().startswith(pat.lower()) or pat.lower() in name.lower()[:22]:
            bcount[pat] += 1
            bhit[pat] = url
            break
for b, n in bcount.most_common():
    url = bhit[b]
    exists = url and url.lower() in {c["Url"].lower() for c in cats}
    print(f"  {n:3d}  {b:14s} -> {url if url else '(no brand category by design)'} "
          f"{'OK' if exists else ('N/A' if not url else '*** MISSING ***')}")

print("\n=== G. IMAGE INVENTORY ===")
cnt = Counter()
for pid in detail:
    imgs = (detail[pid].get("prod") or {}).get("ImgList") or []
    if isinstance(imgs, str):
        try:
            imgs = json.loads(imgs)
        except Exception:
            imgs = []
    cnt[len(imgs)] += 1
print("images-per-product histogram:", dict(sorted(cnt.items())))
print("total images:", sum(k * v for k, v in cnt.items()))

print("\n=== H. VENDOR BLOB FOREIGN-BRAND BLEED ===")
bleed = Counter()
for pid in detail:
    c = (detail[pid].get("prod") or {}).get("Content") or ""
    for other in ["gucci", "prada", "balenciaga", "dior", "lv", "louis vuitton", "burberry"]:
        if other in c.lower():
            bleed[other] += 1
print("blob mentions (product may not be that brand):", dict(bleed))

print("\n=== I. CONTENT EXTERNAL DOMAINS ===")
dom = Counter()
for pid in detail:
    c = (detail[pid].get("prod") or {}).get("Content") or ""
    for m in re.findall(r'href="(https?://[^/"]+)', c, re.I):
        dom[m.lower()] += 1
for d, n in dom.most_common(15):
    print(f"  {n:4d}  {d}")
