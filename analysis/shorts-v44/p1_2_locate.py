"""Pinpoint exactly where the legacy dripsneakers.net string sits in the PDP DOM,
so the P1-2 fix targets the right data source.
"""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
URL = "https://www.dripsneakers.org/dior-oblique-swim-shorts-sky-blue-293b103cb041-c510"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True)
    pg = b.new_context(user_agent=UA, viewport={"width": 1440, "height": 1100}).new_page()
    pg.goto(URL, wait_until="domcontentloaded", timeout=90000)
    pg.wait_for_timeout(8000)
    pg.mouse.wheel(0, 6000)
    pg.wait_for_timeout(5000)

    hits = pg.evaluate("""() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.nodeValue || '';
        if (!t.includes('dripsneakers.net') && !t.includes('FAQPage')) continue;
        const chain = [];
        let el = n.parentElement;
        for (let k = 0; k < 9 && el; k++) {
          chain.push({
            tag: el.tagName,
            id: el.id || null,
            cls: (el.className || '').toString().slice(0, 70) || null,
            dataAttrs: [...el.attributes].filter(a => a.name.startsWith('data-'))
                          .map(a => a.name + '=' + a.value).slice(0, 4)
          });
          el = el.parentElement;
        }
        out.push({snippet: t.trim().slice(0, 320), chain});
      }
      return out;
    }""")

    print(f"=== text nodes containing the string: {len(hits)} ===")
    for i, h in enumerate(hits):
        print(f"\n--- hit {i+1} ---")
        print("  snippet:", h["snippet"][:300].replace("\n", " "))
        for j, c in enumerate(h["chain"]):
            print(f"   {'  ' * j}<- {c['tag']} id={c['id']} cls={c['cls']} {c['dataAttrs']}")

    # Is it a <script type="application/ld+json"> or a visible text block?
    kind = pg.evaluate("""() => {
      const s = [...document.querySelectorAll('script')].filter(x =>
        (x.textContent||'').includes('dripsneakers.net'));
      const pre = [...document.querySelectorAll('pre, code, textarea')].filter(x =>
        (x.textContent||'').includes('dripsneakers.net'));
      return {inScriptTags: s.length, inPreCodeTextarea: pre.length};
    }""")
    print("\n=== containment ===", kind)

    b.close()

(OUT / "p1_2_dom.json").write_text(json.dumps({"hits": hits, "containment": kind},
                                              ensure_ascii=False, indent=1), encoding="utf-8")
print("\n-> p1_2_dom.json")
