"""Reach Dior's official AE boutique with a real browser and harvest the Oblique swim shorts data."""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"

PAGES = [
    "https://shop-couture.dior.ae/products/dior-oblique-swim-shorts-blue-technical-fabric",
    "https://shop-couture.dior.ae/search?q=oblique+swim+shorts",
    "https://shop-couture.dior.ae/collections/swimwear",
]

imgs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True,
                          args=["--disable-blink-features=AutomationControlled"])
    ctx = b.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        locale="en-US", viewport={"width": 1500, "height": 1100})
    pg = ctx.new_page()
    pg.on("response", lambda r: imgs.append(r.url) if re.search(r"\.(jpg|jpeg|png|webp)", r.url, re.I) else None)

    for url in PAGES:
        print(f"\n=== {url} ===")
        try:
            resp = pg.goto(url, wait_until="domcontentloaded", timeout=70000)
            pg.wait_for_timeout(8000)
            print("  status:", resp.status if resp else None, "| title:", pg.title()[:90])
            html = pg.content()
            (OUT / ("diorae_" + re.sub(r"[^a-z0-9]+", "_", url.split("/", 3)[-1])[:50] + ".html")).write_text(html, encoding="utf-8")
            txt = re.sub(r"<[^>]+>", " ", html)
            txt = re.sub(r"\s+", " ", txt)
            for kw in ["293B103", "C510", "C520", "Sky Blue", "Blue Technical"]:
                if kw.lower() in txt.lower():
                    i = txt.lower().find(kw.lower())
                    print(f"  [{kw}] ...{txt[max(0,i-90):i+130]}...")
        except Exception as e:
            print("  ERR", str(e)[:110])
    b.close()

uniq = sorted({u.split("?")[0] for u in imgs if "dior" in u})
print(f"\n=== dior images seen: {len(uniq)} ===")
for u in uniq[:30]:
    print("  ", u[:165])
(OUT / "diorae_images.json").write_text(json.dumps(uniq, ensure_ascii=False, indent=1), encoding="utf-8")
