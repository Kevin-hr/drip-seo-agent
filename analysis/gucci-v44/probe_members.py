"""Dump the RAW GetCatesOfProductsPage response to find the real row path."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
CAT = 538124917898005

JS = r"""
async ([catId]) => {
  const out = {};
  const bodies = [
    {tag: 'ps200', body: {args: [200, 1, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]}},
    {tag: 'ps100', body: {args: [100, 1, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]}},
    {tag: 'ps24',  body: {args: [24, 1, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]}},
    {tag: 'arr2',  body: {args: [1, 200, {CategoryId: catId, Name: '', Orderby: 'SortCateProd', OrderbyMethod: 'asc'}, catId]}},
  ];
  for (const b of bodies) {
    try {
      const r = await fetch('/biz/DTB_proCategory/GetCatesOfProductsPage', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(b.body)
      });
      const txt = await r.text();
      out[b.tag] = {status: r.status, len: txt.length, sample: txt.slice(0, 1200)};
    } catch (e) { out[b.tag] = {error: String(e)}; }
  }
  return out;
}
"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    res = page.evaluate(JS, [CAT])
    (OUT / "probe_members_raw.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    for k, v in res.items():
        print("=====", k, "status", v.get("status"), "len", v.get("len"))
        print(v.get("sample", v.get("error"))[:1000])
        print()
    ctx.close()
