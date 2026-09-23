"""Read the Gucci-Sneakers category membership from the MrShopPlus backend.

Read-only. Uses the persisted Chrome profile so the login session is reused.
Outputs JSON to analysis/gucci-v44/category_members.json
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
OUT.mkdir(parents=True, exist_ok=True)

JS_FIND_CATEGory = r"""
async () => {
  const r = await fetch('/biz/DTB_proCategory/queryList', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [{}, 0, 500]})
  });
  const j = await r.json();
  const rows = (j && j.result && j.result.data && j.result.data.rows) || [];
  return {total: j && j.result && j.result.total, rows: rows.map(x => ({Id: x.Id, Name: x.Name, Url: x.Url, IsShow: x.IsShow}))};
}
"""

JS_MEMBERS = r"""
async ([catId]) => {
  const r = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [200, 1, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]})
  });
  const j = await r.json();
  const q = j && j.result && j.result.queryResult;
  const rows = (q && q.data && q.data.rows) || [];
  return {
    total: q && q.total,
    showCount: j && j.result && j.result.showCount,
    isAutomatic: j && j.result && j.result.cate && j.result.cate.IsAutomatic,
    rows: rows.map(x => ({ProductId: x.ProductId, Name: x.Name, Url: x.Url, IsShow: x.IsShow, BasePrice: x.BasePrice, MarketPrice: x.MarketPrice, State: x.State, FirstImg: x.FirstImg, SortCateProd: x.SortCateProd, SubTitle: x.SubTitle}))
  };
}
"""


def main() -> int:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE,
            executable_path=CHROME,
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(5000)

        cats = page.evaluate(JS_FIND_CATEGory)
        (OUT / "categories_raw.json").write_text(json.dumps(cats, ensure_ascii=False, indent=2), encoding="utf-8")

        target = [c for c in cats["rows"] if (c.get("Url") or "").strip().lower() == "/gucci-sneakers/"]
        print("category total:", cats.get("total"))
        print("matched Gucci-Sneakers:", json.dumps(target, ensure_ascii=False))
        if not target:
            print("NO MATCH. Sample rows:")
            for c in cats["rows"][:60]:
                print("  ", c.get("Id"), c.get("Name"), c.get("Url"))
            ctx.close()
            return 2

        cat_id = target[0]["Id"]
        members = page.evaluate(JS_MEMBERS, [cat_id])
        (OUT / "category_members.json").write_text(json.dumps(members, ensure_ascii=False, indent=2), encoding="utf-8")

        rows = members["rows"]
        live = [r for r in rows if r.get("IsShow")]
        off = [r for r in rows if not r.get("IsShow")]
        print(f"members={len(rows)} total={members.get('total')} showCount={members.get('showCount')}")
        print(f"published(IsShow=1)={len(live)}  unpublished(IsShow=0)={len(off)}")
        print("--- UNPUBLISHED ---")
        for r in off:
            print(f"  {r['ProductId']}\t{r.get('Name')}\t{r.get('Url')}")
        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
