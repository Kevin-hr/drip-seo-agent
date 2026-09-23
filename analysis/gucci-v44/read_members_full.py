"""Read ALL 36 members of Gucci-Sneakers (pageSize=24, paginate). Read-only."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
CAT = 538124917898005

JS = r"""
async ([catId, pageSize, pageIndex]) => {
  const r = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [pageSize, pageIndex, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]})
  });
  const j = await r.json();
  const q = j.result.queryResult;
  return {total: q.total, page: q.page, rows: q.data.rows, cate: j.result.cate.rows, cond: j.result.cateAndCond, showCount: j.result.showCount};
}
"""

all_rows = []
meta = {}
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    for idx in (0, 1, 2, 3, 4):
        res = page.evaluate(JS, [CAT, 12, idx])
        meta = {"total": res["total"], "showCount": res["showCount"], "cate": res["cate"]}
        rows = res["rows"] or []
        print(f"page {idx}: {len(rows)} rows (total {res['total']})")
        all_rows.extend(rows)
        if not rows:
            break
    ctx.close()

# dedupe by ProductId preserving order
seen = set()
uniq = []
for r in all_rows:
    if r["ProductId"] not in seen:
        seen.add(r["ProductId"])
        uniq.append(r)

(OUT / "members_full.json").write_text(json.dumps({"meta": meta, "rows": uniq}, ensure_ascii=False, indent=2), encoding="utf-8")

live = [r for r in uniq if r.get("IsShow")]
off = [r for r in uniq if not r.get("IsShow")]
cond = meta.get("cate")
print(f"\nTOTAL={meta.get('total')} unique={len(uniq)} showCount={meta.get('showCount')} published={len(live)} unpublished={len(off)}")
print("### PUBLISHED (IsShow=1) ###")
for r in live:
    print(f"  {r['ProductId']} | {r.get('Name')} | {r.get('Url')}")
print("\n### UNPUBLISHED (IsShow=0) ###")
for i, r in enumerate(off, 1):
    print(f"{i:2d}. {r['ProductId']} | {r.get('Name')} | {r.get('Url')} | Mk={r.get('MarketPrice')} | State={r.get('State')}")
