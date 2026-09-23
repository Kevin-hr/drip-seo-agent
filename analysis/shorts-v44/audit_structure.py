"""READ-ONLY local audit on top of unpublished_detail.json.

Answers the questions that decide scope:
  - do the vendor blobs contain images at all (V4.4 §16 needs image-only Description)
  - what does the SKU block look like (V4.4 §5)
  - does every brand in this batch have a live internal-link category
  - how far can per-Model conclusions be reused across colorways
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

BASE = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
GUCCI = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")

detail = json.loads((BASE / "unpublished_detail.json").read_text(encoding="utf-8"))
cats = json.loads((GUCCI / "categories_all.json").read_text(encoding="utf-8"))
cat_by_url = {c["Url"].lower(): c for c in cats}
cat_by_name = {c["Name"].lower(): c for c in cats}

print("=== A. CONTENT BLOB STRUCTURE (n=%d) ===" % len(detail))
with_img = 0
with_a = 0
tag_counter = Counter()
for pid, rec in detail.items():
    c = (rec.get("prod") or {}).get("Content") or ""
    imgs = len(re.findall(r"<img", c, re.I))
    as_ = len(re.findall(r"<a\s", c, re.I))
    if imgs:
        with_img += 1
    if as_:
        with_a += 1
    for t in re.findall(r"<(\w+)", c):
        tag_counter[t.lower()] += 1
print(f"Content contains <img>  : {with_img}/{len(detail)}")
print(f"Content contains <a>    : {with_a}/{len(detail)}")
print("top tags:", tag_counter.most_common(12))

sample = (list(detail.values())[0].get("prod") or {}).get("Content") or ""
print("\n--- sample Content (first 700 chars) ---")
print(sample[:700])

print("\n=== B. SKU BLOCK SAMPLE ===")
rec0 = list(detail.values())[0]
for r in (rec0.get("sku") or [])[:3]:
    print("  ", json.dumps(r, ensure_ascii=False)[:300])
print("sku row count:", len(rec0.get("sku") or []))
for r in (rec0.get("attr") or [])[:3]:
    print("   attr:", json.dumps(r, ensure_ascii=False)[:200])

print("\n=== C. BRAND -> INTERNAL LINK TARGET ===")
rows = json.loads((BASE / "damage_audit.json").read_text(encoding="utf-8"))
brands = Counter()
for r in rows:
    toks = re.split(r"[\s-]+", r["name"].strip())
    brand = " ".join(toks[:2]) if toks[0].lower() in ("denim", "fear", "louis", "chrome") else toks[0]
    brands[brand] += 1
for b, n in brands.most_common():
    cand_shorts = cat_by_name.get((b + " shorts").lower())
    cand_plain = cat_by_name.get(b.lower())
    tgt = cand_shorts or cand_plain
    print(f"  {n:3d}  {b:22s} -> {tgt['Url'] if tgt else '*** NO CATEGORY ***'}")

print("\n=== D. MODEL-LEVEL REUSE OPPORTUNITY ===")
model_of = defaultdict(list)
for r in rows:
    m = r["name"].strip()
    m2 = re.sub(r"[\s\-]*(#?\d{2,4}[A-Z]?\d*)\s*$", "", m).strip()
    model_of[m2].append(m)
multi = {k: v for k, v in model_of.items() if len(v) > 1}
print(f"distinct model-groups with >1 colorway: {len(multi)}")
for k, v in sorted(multi.items(), key=lambda x: -len(x[1]))[:10]:
    print(f"  {len(v):2d}x  {k}")
