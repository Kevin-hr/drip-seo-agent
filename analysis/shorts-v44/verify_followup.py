"""Follow-up checks: Product schema presence, Key Description crawlability,
detail-image rendering, and the source of the remaining 'dripsneakers.net' string.
"""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
URL = "https://www.dripsneakers.org/dior-oblique-swim-shorts-sky-blue-293b103cb041-c510"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True)
    pg = b.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                       viewport={"width": 1440, "height": 1200}).new_page()
    pg.goto(URL, wait_until="domcontentloaded", timeout=90000)
    pg.wait_for_timeout(9000)

    ld_all = pg.evaluate("""() => [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map(s => s.textContent)""")
    print(f"=== JSON-LD blocks: {len(ld_all)} ===")
    flat = "\n".join(ld_all)
    for k in ["Product", "Offer", '"sku"', "brand", "AggregateRating", "BreadcrumbList"]:
        print(f"  contains {k!r}: {k in flat}")
    types = sorted(set(re.findall(r'"@type"\s*:\s*"([^"]+)"', flat)))
    print("  @types:", types)
    for blk in ld_all:
        m = re.search(r'"@type"\s*:\s*"Product".*', blk, re.S)
        if m:
            print("\n  --- Product node (first 900 chars) ---")
            print("  " + blk[max(0, m.start() - 40):m.start() + 900])

    print("\n=== KEY DESCRIPTION rendering ===")
    kd = pg.evaluate("""() => {
      const h2 = [...document.querySelectorAll('h2')].find(e => e.innerText.trim() === 'Product Details');
      if (!h2) return null;
      let box = h2, up = 0;
      while (box && up < 5) { box = box.parentElement; up++; }
      const brandLink = [...document.querySelectorAll('a')].find(a =>
        a.href.includes('/Dior/') && /Dior/.test(a.innerText));
      return {
        containerText: (box ? box.innerText : '').slice(0, 700),
        brandLinkHref: brandLink ? brandLink.href : null,
        listItems: [...document.querySelectorAll('ul li')].map(li => li.innerText.trim())
                     .filter(t => /^(Brand|Product Type|Model|Colorway|SKU):/.test(t)).slice(0, 8),
        visible: !!(h2.offsetParent !== null)
      };
    }""")
    if kd:
        print("  visible:", kd["visible"])
        print("  brand link:", kd["brandLinkHref"])
        print("  detail rows:", kd["listItems"])
    else:
        print("  'Product Details' H2 NOT FOUND")

    print("\n=== detail images inside description ===")
    det = pg.evaluate("""() => {
      const imgs = [...document.querySelectorAll('img')].filter(i =>
        (i.currentSrc||i.src||'').includes('dior_cd_obi_drawstring_shorts_blue'));
      return {count: imgs.length,
              sample: imgs.slice(0,3).map(i => ({w: i.naturalWidth, h: i.naturalHeight,
                                                 alt: i.alt, src: (i.currentSrc||i.src).slice(-60)}))};
    }""")
    print(" ", det)

    print("\n=== dripsneakers.net occurrences ===")
    hits = pg.evaluate("""() => {
      const out = [];
      document.querySelectorAll('a[href*="dripsneakers.net"]').forEach(a =>
        out.push({tag:'A', href:a.href, txt:(a.innerText||'').slice(0,50)}));
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n, seen = 0;
      while ((n = walker.nextNode()) && seen < 6) {
        if (n.nodeValue && n.nodeValue.includes('dripsneakers.net')) {
          out.push({tag:'TEXT', txt:n.nodeValue.trim().slice(0,120)}); seen++;
        }
      }
      return out;
    }""")
    for h in hits:
        print("  ", h)
    if not hits:
        print("   none found in rendered DOM")

    pg.screenshot(path=str(OUT / "storefront_canary.png"), full_page=False)
    print("\nscreenshot -> storefront_canary.png")
    b.close()

(OUT / "canary_followup.json").write_text(json.dumps(
    {"ld_types": types, "kd": kd, "detail_images": det, "deadlink_hits": hits},
    ensure_ascii=False, indent=1), encoding="utf-8")
