"""End-to-end verification of the canary write.
A) backend read-back    B) category membership    C) storefront PDP + old-URL redirect
"""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
PID = 536027503505948
SLUG = "dior-oblique-swim-shorts-sky-blue-293b103cb041-c510"
NEW_URL = f"https://www.dripsneakers.org/{SLUG}"
OLD_URL = "https://www.dripsneakers.org/Top-Quality-Dior-CD-Obi-Drawstring-Shorts-Blue"

EXPECT = {
    "Name": "Dior Oblique Swim Shorts Sky Blue",
    "SeoTitle": "Dior Oblique Swim Shorts Sky Blue 293B103CB041_C510 Reps | Drip Sneakers",
    "UrlValue": SLUG,
    "IsShow": True,
}

report = []
sw = sync_playwright().start()

# ---------- A. backend read-back ----------
print("=== A. BACKEND READ-BACK ===")
ctx = sw.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
page = ctx.pages[0] if ctx.pages else ctx.new_page()
page.on("dialog", lambda d: d.dismiss())
page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
page.wait_for_timeout(5000)
back = page.evaluate("""async (pid) => {
  const r = await fetch('/biz/DTB_proProduct/modify', {method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({args: [[pid]], additions: {}})});
  const j = await r.json();
  const row = ((j.result||[]).find(b=>b.name==='dtb_proProduct')||{}).rows?.[0]||null;
  return row;
}""", PID)

checks = []
for k, v in EXPECT.items():
    got = back.get(k)
    ok = (got == v)
    checks.append((k, ok, str(got)[:110]))
alts = back.get("ImgList") or []
if isinstance(alts, str):
    alts = json.loads(alts)
alt_filled = sum(1 for i in alts if (i.get("a") or "").strip())
content = back.get("Content") or ""
checks.append(("Content: no dripsneakers.net dead link", "dripsneakers.net" not in content, f"len={len(content)}"))
checks.append(("Content: no instagram/whatsapp links",
               ("instagram.com" not in content and "whatsapp" not in content.lower()), "links"))
checks.append(("Content: no replica/1:1 wording",
               not re.search(r"replica|1:1|exact cop", content, re.I), "forbidden words"))
checks.append(("Content: <img> count", content.lower().count("<img") == 13, str(content.lower().count("<img"))))
checks.append(("Summary = Key Description present", "Product Details" in (back.get("Summary") or ""),
               str(len(back.get("Summary") or ""))))
checks.append(("ImgList ALT filled", alt_filled == len(alts), f"{alt_filled}/{len(alts)}"))
checks.append(("SeoKeyword", bool(back.get("SeoKeyword")), back.get("SeoKeyword", "")[:90]))
checks.append(("SeoDesc", bool(back.get("SeoDesc")), back.get("SeoDesc", "")[:90]))
checks.append(("Url", back.get("Url") == "/" + SLUG, back.get("Url")))
checks.append(("OldUrlValue preserved", back.get("OldUrlValue") == "Top-Quality-Dior-CD-Obi-Drawstring-Shorts-Blue",
               str(back.get("OldUrlValue"))))
for k, ok, detail in checks:
    print(f"  [{'PASS' if ok else 'FAIL'}] {k}: {detail}")

# ---------- B. category membership ----------
print("\n=== B. CATEGORY MEMBERSHIP (/Shorts/) ===")
cat = page.evaluate("""async (catId) => {
  const r = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({args:[12,0,{CategoryId:catId,Name:'',Orderby:'SortCateProd',OrderbyMethod:'asc'},catId]})});
  const j = await r.json();
  return {total: j.result.queryResult.total, show: j.result.showCount};
}""", 536025126720018)
print(f"  total={cat['total']}  published(showCount)={cat['show']}")
ctx.close()

# ---------- C. storefront ----------
print("\n=== C. STOREFRONT ===")
b = sw.chromium.launch(executable_path=CHROME, headless=True)
p2 = b.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                              "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                   viewport={"width": 1440, "height": 1000}).new_page()

resp = p2.goto(NEW_URL, wait_until="domcontentloaded", timeout=90000)
p2.wait_for_timeout(9000)
print(f"  {NEW_URL}\n    status={resp.status if resp else None}  title={p2.title()[:120]!r}")

front = p2.evaluate("""() => {
  const meta = n => (document.querySelector(`meta[name="${n}"]`)||{}).content || null;
  const og = n => (document.querySelector(`meta[property="og:${n}"]`)||{}).content || null;
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent.slice(0,600));
  const h1 = [...document.querySelectorAll('h1')].map(e=>e.innerText.trim()).filter(Boolean);
  const imgs = [...document.querySelectorAll('img')].map(i=>({src:(i.currentSrc||i.src||'').slice(0,90), alt:i.alt||''}));
  return {title: document.title, desc: meta('description'), keywords: meta('keywords'),
          canonical: (document.querySelector('link[rel=canonical]')||{}).href || null,
          ogTitle: og('title'), h1, ld, imgCount: imgs.length,
          imgAltEmpty: imgs.filter(i=>!i.alt).length,
          imgAltSample: imgs.filter(i=>i.alt).slice(0,4),
          bodyHas: {
            details: document.body.innerText.includes('Product Details'),
            skyblue: document.body.innerText.includes('Sky Blue'),
            sku: document.body.innerText.includes('293B103CB041_C510'),
            deadlink: document.body.innerHTML.includes('dripsneakers.net')
          }};
}""")
print(f"    title      : {front['title'][:130]}")
print(f"    description: {(front['desc'] or '')[:130]}")
print(f"    keywords   : {(front['keywords'] or '')[:130]}")
print(f"    canonical  : {front['canonical']}")
print(f"    h1         : {front['h1']}")
print(f"    images     : {front['imgCount']} (alt empty: {front['imgAltEmpty']})")
for s in front["imgAltSample"]:
    print(f"        alt: {s['alt'][:80]}")
print(f"    body flags : {front['bodyHas']}")
print(f"    JSON-LD    : {len(front['ld'])} block(s)")
for x in front["ld"][:2]:
    print("       ", x[:300])

resp2 = p2.goto(OLD_URL, wait_until="domcontentloaded", timeout=90000)
p2.wait_for_timeout(4000)
print(f"\n  old URL {OLD_URL}\n    status={resp2.status if resp2 else None}  final={p2.url}")

b.close(); sw.stop()

(OUT / "canary_verification.json").write_text(json.dumps(
    {"backend_checks": checks, "category": cat, "storefront": front,
     "old_url": {"status": resp2.status if resp2 else None, "final": p2.url}},
    ensure_ascii=False, indent=1), encoding="utf-8")
print("\nreport -> canary_verification.json")
