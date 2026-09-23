"""READ-ONLY: batch-read all 70 unpublished /Shorts/ products + audit SEO field damage.

Produces unpublished_detail.json and a fact table used for the razor-scope plan.
"""
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")

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
  const pick = (n) => (res.find(b => b.name === n) || {}).rows || [];
  return {
    prod: pick('dtb_proProduct')[0] || null,
    attr: pick('dtb_proProductAttr'),
    sku:  pick('DTB_proSKU_ref'),
    cates: pick('dtb_proProductCates'),
    tags: pick('dtb_proProductTag')
  };
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
            out[str(pid)] = page.evaluate(JS, [pid])
        except Exception as e:
            out[str(pid)] = {"error": str(e)}
        prod = (out[str(pid)].get("prod") or {})
        print(f"{i:3d}. {pid} | Content={len(prod.get('Content') or '')} | "
              f"ST={len(prod.get('SeoTitle') or '')} SD={len(prod.get('SeoDesc') or '')} "
              f"SK={len(prod.get('SeoKeyword') or '')} | Url={(prod.get('UrlValue') or '')[:45]}")
    ctx.close()

(OUT / "unpublished_detail.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------- damage audit ----------
DEAD = "dripsneakers.net"
rows = []
for pid in [str(m["ProductId"]) for m in off]:
    rec = out.get(pid) or {}
    prod = rec.get("prod") or {}
    content = prod.get("Content") or ""
    imgs = prod.get("ImgList") or []
    if isinstance(imgs, str):
        try:
            imgs = json.loads(imgs)
        except Exception:
            imgs = []
    alt_total = len(imgs)
    alt_empty = sum(1 for im in imgs if isinstance(im, dict) and not (im.get("alt") or im.get("Alt") or "").strip())
    url = prod.get("UrlValue") or ""
    rows.append({
        "pid": pid,
        "name": (prod.get("Name") or "").strip(),
        "is_show": prod.get("IsShow"),
        "state": prod.get("State"),
        "content_len": len(content),
        "v33": 'ds-pdp-description' in content,
        "vendor_html": bool(content) and 'ds-pdp-description' not in content,
        "deadlink": DEAD in content,
        "pkgod": bool(re.search(r'pkgod|perfect kicks', content, re.I)),
        "replica": bool(re.search(r'replica|1:1|exact cop', content, re.I)),
        "goat_residue": 'chakra-' in content or 'css-1qzfqqa' in content,
        "img_count": alt_total,
        "img_alt_empty": alt_empty,
        "seo_title": prod.get("SeoTitle") or "",
        "seo_desc": prod.get("SeoDesc") or "",
        "seo_kw": prod.get("SeoKeyword") or "",
        "url_value": url,
        "brand_id": prod.get("BrandId"),
        "summary": prod.get("Summary") or "",
        "img_list_n": len(imgs),
    })

n = len(rows)
def c(f): return sum(1 for r in rows if r[f])
print("\n================ DAMAGE AUDIT (n=%d) ================" % n)
print(f"Content empty ................ {sum(1 for r in rows if r['content_len']==0)}")
print(f"V3.3 structured Content ...... {c('v33')}")
print(f"Vendor-copied HTML ........... {c('vendor_html')}")
print(f"  > contains deadlink dripsneakers.net ... {c('deadlink')}")
print(f"  > contains Pkgod / Perfect Kicks ....... {c('pkgod')}")
print(f"  > contains replica / 1:1 / exact copies  {c('replica')}")
print(f"  > contains GOAT/StockX chakra残渣 ...... {c('goat_residue')}")
print(f"SeoTitle empty ............... {sum(1 for r in rows if not r['seo_title'].strip())}")
print(f"SeoTitle == ' reps | Drip Sneakers' ... {sum(1 for r in rows if r['seo_title'].strip()=='reps | Drip Sneakers')}")
print(f"SeoDesc empty ................ {sum(1 for r in rows if not r['seo_desc'].strip())}")
print(f"SeoKeyword empty ............. {sum(1 for r in rows if not r['seo_kw'].strip())}")
print(f"UrlValue starts with '-' ..... {sum(1 for r in rows if r['url_value'].startswith('-'))}")
print(f"UrlValue contains 'Top-Quality' {sum(1 for r in rows if 'Top-Quality' in r['url_value'])}")
print(f"UrlValue contains 'Reps' ...... {sum(1 for r in rows if 'rep' in r['url_value'].lower())}")
print(f"BrandId empty ................ {sum(1 for r in rows if not r['brand_id'])}")
print(f"Summary empty ................ {sum(1 for r in rows if not r['summary'].strip())}")
print(f"products with 0 images ....... {sum(1 for r in rows if r['img_list_n']==0)}")
print(f"total empty ALT slots ........ {sum(r['img_alt_empty'] for r in rows)}")
print(f"total image slots ............ {sum(r['img_count'] for r in rows)}")

(OUT / "damage_audit.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

# brand distribution
brands = {}
for r in rows:
    key = re.split(r'[\s-]+', r["name"].strip())[0] if r["name"] else "(empty)"
    brands[key] = brands.get(key, 0) + 1
print("\n---- name-leading-token distribution ----")
for k, v in sorted(brands.items(), key=lambda x: -x[1]):
    print(f"  {v:3d}  {k}")
