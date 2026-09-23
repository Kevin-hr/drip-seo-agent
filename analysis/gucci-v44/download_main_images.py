"""Download the main image of each of the 27 unpublished products (for entity identification).
Also reports per-product image count and ALT quality for the V4.4 HOLD decision.
"""
import json
import urllib.request
from pathlib import Path

OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
IMG = OUT / "images"
IMG.mkdir(parents=True, exist_ok=True)

d = json.loads((OUT / "unpublished_detail.json").read_text(encoding="utf-8"))
CDN = "https://images.mrshopplus.com/"

rows = []
ok = 0
fail = []
for pid, rec in d.items():
    prod = rec.get("prod") or {}
    imgs = prod.get("ImgList") or []
    if not imgs and prod.get("FirstImg"):
        imgs = [prod["FirstImg"]]
    alts = [ (im.get("a") or "") for im in imgs ]
    rows.append({
        "pid": pid, "name": prod.get("Name"),
        "imgCount": len(imgs),
        "altsEmpty": sum(1 for a in alts if not a.strip()),
        "alts": alts[:5],
        "first": (imgs[0] if imgs else {}).get("s"),
    })
    if not imgs:
        fail.append((pid, "no image"))
        continue
    s = imgs[0].get("s")
    url = CDN + s
    dest = IMG / f"{pid}.jpg"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            dest.write_bytes(r.read())
        ok += 1
    except Exception as e:
        fail.append((pid, str(e)))

(OUT / "image_audit.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"downloaded main images: {ok}/27   failures: {len(fail)}")
for f in fail:
    print("  FAIL", f)
print("\n=== per-product image audit ===")
print(f"{'pid':>16} | imgs | emptyALT | name")
for r in rows:
    print(f"{r['pid']:>16} | {r['imgCount']:>4} | {r['altsEmpty']:>8} | {(r['name'] or '')[:52]}")
