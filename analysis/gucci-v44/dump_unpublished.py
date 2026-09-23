"""Dump full backend records for the 27 unpublished Gucci-Sneakers products. Read-only."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")

members = json.loads((OUT / "members_full.json").read_text(encoding="utf-8"))
off = [r for r in members["rows"] if not r.get("IsShow")]
print(f"unpublished to dump: {len(off)}")

JS = r"""
async ([pid]) => {
  const r = await fetch('/biz/DTB_proProduct/queryList', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [{Id: pid}, 0, 5], additions: {Stoke: true}})
  });
  const j = await r.json();
  const rows = (j.result && j.result.data && j.result.data.rows) || [];
  return {total: j.result && j.result.total, rows};
}
"""

out = []
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    for i, m in enumerate(off, 1):
        pid = m["ProductId"]
        try:
            res = page.evaluate(JS, [pid])
        except Exception as e:
            res = {"error": str(e)}
        rows = res.get("rows") or []
        rec = rows[0] if rows else {"_notfound": True, "_pid": pid}
        rec["_catName"] = m.get("Name")
        rec["_catUrl"] = m.get("Url")
        out.append(rec)
        # print a compact line with the interesting fields
        keys = ["Id", "Name", "IsShow", "Url", "BasePrice", "MarketPrice", "CostPrice", "FirstImg", "SeoTitle", "SeoKeyword", "SeoDesc", "UrlValue", "ProCategoryId", "SubTitle"]
        brief = {k: rec.get(k) for k in keys if k in rec}
        print(f"{i:2d}. {json.dumps(brief, ensure_ascii=False)[:400]}")
    ctx.close()

(OUT / "unpublished_full.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print("\nwrote unpublished_full.json")
if out:
    print("field keys of first record:")
    print(sorted(out[0].keys()))
