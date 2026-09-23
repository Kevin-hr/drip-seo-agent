"""Fetch the Dior official product page with a real browser (site blocks plain urllib)."""
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"

URLS = [
    "https://www.dior.com/en_us/fashion/products/293B103CB041_C510",
    "https://www.dior.com/en_se/fashion/products/293B103CB041_C510",
]

captured = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, headless=True)
    ctx = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        locale="en-US",
        viewport={"width": 1440, "height": 1000},
    )
    page = ctx.new_page()

    def on_resp(resp):
        u = resp.url
        if re.search(r"\.(jpg|jpeg|png|webp)", u, re.I) and "dior" in u:
            captured.append(u)

    page.on("response", on_resp)

    for url in URLS:
        print(f"\n=== {url} ===")
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_timeout(9000)
        except Exception as e:
            print("  goto issue:", str(e)[:120])

        title = page.title()
        print("  title:", title[:150])
        try:
            html = page.content()
        except Exception:
            html = ""
        (OUT / "dior_page.html").write_text(html, encoding="utf-8")
        print("  html len:", len(html))

        # JSON-LD
        for m in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
            try:
                j = json.loads(m.strip())
            except Exception:
                continue
            s = json.dumps(j, ensure_ascii=False)
            if "sku" in s.lower() or "product" in s.lower():
                print("  JSON-LD:", s[:900])

        # reference / sku mentions
        for pat in [r'"sku"\s*:\s*"([^"]+)"', r'Reference\s*[:\s]*([A-Z0-9_\-]{8,})',
                    r'productReference["\']?\s*[:=]\s*["\']([^"\']+)']:
            found = sorted(set(re.findall(pat, html, re.I)))[:6]
            if found:
                print(f"  ref pat {pat[:32]}: {found}")

        if captured:
            print("  images captured so far:", len(captured))
            break

    browser.close()

uniq = []
seen = set()
for u in captured:
    base = u.split("?")[0]
    if base in seen:
        continue
    seen.add(base)
    uniq.append(u)

(OUT / "dior_images.json").write_text(json.dumps(uniq, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n=== unique image urls: {len(uniq)} ===")
for u in uniq[:40]:
    print("  ", u[:160])
