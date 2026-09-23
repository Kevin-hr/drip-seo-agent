"""Last attempt at an authoritative reference image: DuckDuckGo image index (JSON API)."""
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://duckduckgo.com/"}


def get(url, extra=None):
    h = dict(UA)
    if extra:
        h.update(extra)
    return urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=40).read()


QUERIES = [
    "Dior Oblique Swim Shorts sky blue",
    "Dior Oblique Swim Shorts 293B103CB041",
    "Dior Oblique swim shorts light blue technical fabric",
]

results = []
for q in QUERIES:
    try:
        html = get("https://duckduckgo.com/?q=" + urllib.parse.quote(q) + "&iax=images&ia=images").decode("utf-8", "ignore")
        m = re.search(r'vqd=["\']([\d-]+)["\']', html) or re.search(r'vqd=([\d-]+)&', html)
        if not m:
            print(f"q={q!r}: no vqd token")
            continue
        vqd = m.group(1)
        u = ("https://duckduckgo.com/i.js?l=us-en&o=json&q=" + urllib.parse.quote(q)
             + "&vqd=" + vqd + "&f=,,,&p=1")
        data = json.loads(get(u, {"Referer": "https://duckduckgo.com/"}).decode("utf-8", "ignore"))
        imgs = data.get("results", [])
        print(f"q={q!r}: {len(imgs)} results")
        for it in imgs[:20]:
            src = it.get("image")
            title = (it.get("title") or "")[:70]
            if src:
                results.append({"q": q, "image": src, "title": title, "url": it.get("url")})
                print("   ", src[:140])
    except Exception as e:
        print(f"q={q!r} FAIL {type(e).__name__} {str(e)[:80]}")

(OUT / "ddg_images.json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
print("\ntotal:", len(results))
print("dior.com-hosted:", sum(1 for r in results if "dior.com" in r["image"]))
for r in results:
    if "dior.com" in r["image"] or "stockx" in r["image"]:
        print("  AUTHORITATIVE:", r["image"][:150])
