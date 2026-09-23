"""P1-2 root-cause: locate the source of the legacy dripsneakers.net references that the
storefront injects via schema, and check how widely they spread.
"""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    "https://www.dripsneakers.org/dior-oblique-swim-shorts-sky-blue-293b103cb041-c510",
    "https://www.dripsneakers.org/Shorts/",
    "https://www.dripsneakers.org/",
]

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

summary = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True)
    pg = b.new_context(user_agent=UA, viewport={"width": 1440, "height": 1100}).new_page()
    for url in PAGES:
        print(f"\n{'='*80}\n{url}")
        try:
            pg.goto(url, wait_until="domcontentloaded", timeout=90000)
            pg.wait_for_timeout(7000)
            html = pg.content()
        except Exception as e:
            print("  FAIL", str(e)[:120])
            continue

        safe = re.sub(r"[^a-z0-9]+", "_", url.split("//")[-1])[:50]
        (OUT / f"front_{safe}.html").write_text(html, encoding="utf-8")

        legacy = re.findall(r"https?://(?:www\.)?dripsneakers\.net[^\"'\s<>\\]*", html)
        print(f"  raw HTML legacy-domain refs: {len(legacy)}")
        for u in sorted(set(legacy))[:12]:
            print("     ", u[:120])

        ld = pg.evaluate("""() => [...document.querySelectorAll('script[type="application/ld+json"]')]
                                  .map(s => s.textContent)""")
        all_ld = "\n".join(ld)
        # pull FAQPage node
        faq = None
        for blk in ld:
            if '"FAQPage"' in blk:
                try:
                    j = json.loads(blk)
                except Exception:
                    faq = blk
                    continue
                graph = j.get("@graph") if isinstance(j, dict) else None
                node = j
                if graph:
                    node = next((g for g in graph if g.get("@type") == "FAQPage"), j)
                faq = json.dumps(node, ensure_ascii=False, indent=1)
        if faq:
            print("  --- FAQPage node ---")
            print("  " + faq[:1600].replace("\n", "\n  "))
        else:
            print("  no FAQPage node")

        summary[url] = {"legacy_refs": sorted(set(legacy)), "has_faqpage": bool(faq),
                        "faq": faq}
    b.close()

(OUT / "p1_2_rootcause.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
print("\n-> p1_2_rootcause.json")
