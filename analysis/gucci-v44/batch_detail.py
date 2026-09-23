"""Batch-read all 27 unpublished products' full backend records via the detail API."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")

members = json.loads((OUT / "members_full.json").read_text(encoding="utf-8"))
off = [r for r in members["rows"] if not r.get("IsShow")]

JS = r"""
async ([pid]) => {
  const r = await fetch('/biz/DTB_proProduct/modify', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [[pid]], additions: {}})
  });
  const j = await r.json();
  const res = j.result || [];
  const prod = (res.find(b => b.name === 'dtb_proProduct') || {}).rows?.[0] || null;
  const attr = (res.find(b => b.name === 'dtb_proProductAttr') || {}).rows || [];
  const sku = (res.find(b => b.name === 'DTB_proSKU_ref') || {}).rows || [];
  const cates = (res.find(b => b.name === 'dtb_proProductCates') || {}).rows || [];
  return {prod, attr, sku, cates};
}
"""

out = {}
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    for i, m in enumerate(off, 1):
        pid = m["ProductId"]
        try:
            r = page.evaluate(JS, [pid])
        except Exception as e:
            r = {"error": str(e)}
        out[str(pid)] = r
        prod = r.get("prod") or {}
        content = prod.get("Content") or ""
        print(f"{i:2d}. {pid} | IsShow={prod.get('IsShow')} | Content={len(content)}ch | "
              f"SeoTitle={(prod.get('SeoTitle') or '')[:60]!r} | Url={(prod.get('UrlValue') or '')[:50]!r}")
    ctx.close()

(OUT / "unpublished_detail.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

print("\n=== SUMMARY ===")
with_content = sum(1 for r in out.values() if (r.get("prod") or {}).get("Content"))
with_seotitle = sum(1 for r in out.values() if (r.get("prod") or {}).get("SeoTitle"))
with_seodesc = sum(1 for r in out.values() if (r.get("prod") or {}).get("SeoDesc"))
bad_desc = [k for k, r in out.items() if "real QC" in ((r.get("prod") or {}).get("SeoDesc") or "")]
no_brand = [k for k, r in out.items() if not (r.get("prod") or {}).get("BrandId")]
print(f"total={len(out)} withContent={with_content} withSeoTitle={with_seotitle} withSeoDesc={with_seodesc}")
print(f"SeoDesc uses forbidden 'real QC photos': {len(bad_desc)}")
print(f"BrandId empty: {len(no_brand)}")

# dump the attr block of the first record to hunt for a 'key description' field
first = list(out.values())[0]
print("\n=== sample attr rows ===")
for a in (first.get("attr") or []):
    print("  ", json.dumps(a, ensure_ascii=False)[:220])
