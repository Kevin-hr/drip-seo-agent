"""Locate the official Sky Blue Dior Oblique Swim Shorts imagery.
Tries: (a) Bing image index for the exact reference, (b) dealer feeds that mirror the official shots.
"""
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}


def get(url, timeout=40):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()


print("=== A. Bing image index ===")
hits = []
for q in ["Dior Oblique Swim Shorts Sky Blue 293B103CB041",
          "Dior Oblique Swim Shorts C510",
          "Dior Oblique Swim Shorts sky blue technical fabric"]:
    u = "https://www.bing.com/images/search?q=" + urllib.parse.quote(q) + "&form=HDRSC2&first=1"
    try:
        html = get(u).decode("utf-8", "ignore")
    except Exception as e:
        print("  FAIL", q, str(e)[:70])
        continue
    murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+?)&quot;', html)
    print(f"  q={q!r} -> {len(murls)} images")
    for m in murls[:14]:
        hits.append(m)
        print("     ", m[:150])

print("\n=== B. dealer feeds (visual cross-check only; NOT an SKU authority) ===")
for host, slug in [("https://www.unatelier.store", "products/dior-oblique-swim-shorts"),
                   ("https://plugsjb.com", "products/dior-oblique-swim-shorts")]:
    for path in [f"/{slug}.json", f"/{slug}"]:
        url = host + path
        try:
            d = get(url)
            print("  OK", url, len(d))
            if path.endswith(".json"):
                p = json.loads(d).get("product", {})
                print("     title:", p.get("title"))
                print("     variants:", [(v.get("title"), v.get("sku")) for v in p.get("variants", [])][:8])
                print("     images:", [i.get("src") for i in (p.get("images") or [])][:6])
            else:
                html = d.decode("utf-8", "ignore")
                og = re.findall(r'property="og:image"\s+content="([^"]+)"', html)
                print("     og:image:", og[:3])
            break
        except Exception as e:
            print("  --", url, str(e)[:70])

(OUT / "bing_images.json").write_text(json.dumps(hits, ensure_ascii=False, indent=1), encoding="utf-8")
print("\nsaved bing_images.json:", len(hits))
