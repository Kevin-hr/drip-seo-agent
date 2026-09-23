"""Probe pagination base + cross-check with product search. Read-only."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
CAT = 538124917898005

JS_PAGE = r"""
async ([catId, pageSize, pageIndex]) => {
  const r = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [pageSize, pageIndex, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]})
  });
  const j = await r.json();
  const q = j.result.queryResult;
  return {total: q.total, page: q.page, n: (q.data.rows||[]).length, ids: (q.data.rows||[]).map(x=>x.ProductId)};
}
"""

JS_SEARCH = r"""
async ([page, pageSize]) => {
  const r = await fetch('/biz/DTB_proProduct/queryList', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [{}, page, pageSize], additions: {Stoke: true}})
  });
  const j = await r.json();
  const res = j.result || {};
  return {total: res.total, n: (res.data && res.data.rows || []).length, rows: (res.data && res.data.rows || [])};
}
"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)

    print("=== pagination probe (pageSize=12) ===")
    for idx in range(0, 6):
        r = page.evaluate(JS_PAGE, [CAT, 12, idx])
        print(f"  pageIndex={idx}: page={r['page']} n={r['n']} total={r['total']} first={r['ids'][:2]}")

    print("=== product search total ===")
    s = page.evaluate(JS_SEARCH, [0, 5])
    print(f"  all products total={s['total']} sample={s['n']}")

    # pull all products and filter for gucci-ish names
    allp = []
    pg = 0
    while True:
        s = page.evaluate(JS_SEARCH, [pg, 200])
        rows = s["rows"] or []
        print(f"  search page {pg}: {len(rows)} / total {s['total']}")
        allp.extend(rows)
        pg += 1
        if not rows or len(allp) >= (s["total"] or 0) or pg > 40:
            break
    (OUT / "all_products.json").write_text(json.dumps(allp, ensure_ascii=False, indent=2), encoding="utf-8")
    gucci = [x for x in allp if "gucci" in (x.get("Name") or "").lower()]
    print(f"\nall products={len(allp)}  name~gucci={len(gucci)}")
    for x in gucci:
        print(f"  {x.get('Id')} | {x.get('Name')} | show={x.get('IsShow')} | {x.get('Url')}")
    ctx.close()
