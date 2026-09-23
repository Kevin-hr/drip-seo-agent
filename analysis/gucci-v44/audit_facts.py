"""Murphy-audit facts: (1) full auto-category condition list, (2) Gucci brand/category URLs."""
import json
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
CAT = 538124917898005

JS_COND = r"""
async ([catId]) => {
  const r = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [12, 0, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]})
  });
  const j = await r.json();
  return {cond: j.result.cateAndCond, cate: j.result.cate};
}
"""

JS_CATS = r"""
async () => {
  const r = await fetch('/biz/DTB_proCategory/queryList', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [{}, 0, 500]})
  });
  const j = await r.json();
  return (j.result.data.rows || []).map(x => ({Id: x.Id, Name: x.Name, Url: x.Url, IsShow: x.IsShow}));
}
"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)

    c = page.evaluate(JS_COND, [CAT])
    (OUT / "cat_conditions.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    conds = (c.get("cond") or {}).get("rows") or []
    print(f"=== AUTO-CATEGORY CONDITIONS: {len(conds)} ===")
    print("cate:", json.dumps(c.get("cate"), ensure_ascii=False))
    vals = []
    for k in conds:
        print(f"  field={k.get('Field')} op={k.get('Operator')} value={k.get('Value')!r}")
        vals.append(k.get("Value"))
    print("\nEXCLUDED NAME TOKENS:", sorted(set(v for v in vals if v)))

    cats = page.evaluate(JS_CATS)
    (OUT / "categories_all.json").write_text(json.dumps(cats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n=== categories total: {len(cats)} ===")
    print("--- Gucci-related ---")
    for x in cats:
        if "gucci" in (x.get("Name") or "").lower() or "gucci" in (x.get("Url") or "").lower():
            print(f"  {x['Id']} | {x['Name']!r} | {x['Url']} | show={x['IsShow']}")
    ctx.close()

print("\n=== front-end URL probe ===")
for u in ["https://www.dripsneakers.org/Gucci-Sneakers/",
          "https://www.dripsneakers.org/Gucci/",
          "https://www.dripsneakers.org/Gucci-Shoes/"]:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as r:
            body = r.read(4000).decode("utf-8", "ignore")
            print(f"  {r.status}  {u}   (title: {'<title>' in body})")
    except Exception as e:
        print(f"  ERR  {u}  {e}")
