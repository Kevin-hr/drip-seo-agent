"""READ-ONLY recon: read ALL members of /Shorts/ (CategoryId 536025126720018).

Verifies the user's stated 113 total / 43 live / 70 unpublished breakdown
against the live backend. Writes members_full.json + a plain-text report.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
OUT.mkdir(parents=True, exist_ok=True)
CAT = 536025126720018  # /Shorts/

JS = r"""
async ([catId, pageSize, pageIndex]) => {
  const r = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [pageSize, pageIndex, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]})
  });
  const j = await r.json();
  const q = j.result.queryResult;
  return {total: q.total, page: q.page, rows: q.data.rows, cate: j.result.cate.rows,
          cond: j.result.cateAndCond, showCount: j.result.showCount};
}
"""

all_rows, meta = [], {}
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    for idx in range(14):
        try:
            res = page.evaluate(JS, [CAT, 12, idx])
        except Exception as e:
            print(f"page {idx}: ERROR {e}")
            break
        meta = {"total": res["total"], "showCount": res["showCount"],
                "cate": res["cate"], "cond": res["cond"]}
        rows = res["rows"] or []
        print(f"page {idx}: {len(rows)} rows (total {res['total']})")
        all_rows.extend(rows)
        if not rows:
            break
    ctx.close()

seen, uniq = set(), []
for r in all_rows:
    if r["ProductId"] not in seen:
        seen.add(r["ProductId"])
        uniq.append(r)

(OUT / "members_full.json").write_text(
    json.dumps({"meta": meta, "rows": uniq}, ensure_ascii=False, indent=2), encoding="utf-8")

live = [r for r in uniq if r.get("IsShow")]
off = [r for r in uniq if not r.get("IsShow")]

lines = []
lines.append("=== /Shorts/ MEMBERSHIP RECON ===")
lines.append(f"category rows returned (unique) = {len(uniq)}")
lines.append(f"server total                    = {meta.get('total')}")
lines.append(f"showCount                       = {meta.get('showCount')}")
lines.append(f"cate meta                       = {json.dumps(meta.get('cate'), ensure_ascii=False)}")
lines.append(f"cateAndCond                     = {json.dumps(meta.get('cond'), ensure_ascii=False)}")
lines.append(f"PUBLISHED (IsShow=1)            = {len(live)}")
lines.append(f"UNPUBLISHED (IsShow=0)          = {len(off)}")
lines.append("")
lines.append("### UNPUBLISHED LIST ###")
for i, r in enumerate(off, 1):
    lines.append(f"{i:3d}. {r['ProductId']} | {r.get('Name')} | Url={r.get('Url')} | "
                 f"Mk={r.get('MarketPrice')} | State={r.get('State')}")
lines.append("")
lines.append("### PUBLISHED LIST ###")
for i, r in enumerate(live, 1):
    lines.append(f"{i:3d}. {r['ProductId']} | {r.get('Name')} | Url={r.get('Url')}")

report = "\n".join(lines)
(OUT / "recon_report.txt").write_text(report, encoding="utf-8")
print()
print(report)
