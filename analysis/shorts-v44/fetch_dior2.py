"""Find a reachable Dior regional page for 293B103CB041_C510 and pull its official imagery."""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
OUT.mkdir(parents=True, exist_ok=True)
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"

TARGETS = [
    ("C510", "https://www.dior.com/en_pl/fashion/products/293B103CB041_C510"),
    ("C510", "https://www.dior.com/en_gb/fashion/products/293B103CB041_C510"),
    ("C510", "https://www.dior.com/en_fr/fashion/products/293B103CB041_C510"),
    ("C510", "https://www.dior.com/en_it/fashion/products/293B103CB041_C510"),
    ("C510", "https://www.dior.cn/zh_cn/fashion/products/293B103CB041_C510"),
    ("C565", "https://www.dior.com/en_pl/fashion/products/293B103CB041_C565"),
]

found = {}
with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME, headless=True,
        args=["--disable-blink-features=AutomationControlled"],
    )
    ctx = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        locale="en-US", viewport={"width": 1500, "height": 1000},
    )
    page = ctx.new_page()
    for tag, url in TARGETS:
        hit = []
        page.on("response", lambda r, h=hit: h.append(r.url) if re.search(r"\.(jpg|jpeg|png|webp)", r.url, re.I) else None)
        status, title, nimg = None, "", 0
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=60000)
            status = resp.status if resp else None
            page.wait_for_timeout(6000)
            title = page.title()[:80]
            nimg = len(hit)
            html = page.content()
            (OUT / f"dior_{tag}_{url.split('/')[3]}.html").write_text(html, encoding="utf-8")
        except Exception as e:
            title = f"ERR {str(e)[:60]}"
        print(f"{tag} {url.split('/')[3]:8s} status={status} title={title!r} imgs={nimg}")
        if nimg and "unavailable" not in title.lower():
            found[tag] = hit

    browser.close()

best = {}
for tag, urls in found.items():
    legit = [u for u in urls if "dior" in u and not u.endswith(".svg")]
    if legit:
        best[tag] = sorted(set(u.split("?")[0] for u in legit))
        print(f"\n=== {tag} official image candidates ({len(best[tag])}) ===")
        for u in best[tag][:25]:
            print("  ", u[:170])

(OUT / "dior_images.json").write_text(json.dumps(best, ensure_ascii=False, indent=1), encoding="utf-8")
print("\nsaved dior_images.json:", {k: len(v) for k, v in best.items()})
