"""Build the V4.4 write payload for the canary product from the captured saveModify body.

Default: dry-run, writes the payload to disk for inspection.
--live : POST it to /biz/DTB_proProduct/saveModify using the logged-in browser session.

Rollback: post canary_rollback_payload.json back through the same endpoint.
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
BASE = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
LIVE = "--live" in sys.argv

NAME = "Dior Oblique Swim Shorts Sky Blue"
SKU = "293B103CB041_C510"
SLUG = "dior-oblique-swim-shorts-sky-blue-293b103cb041-c510"
SEO_TITLE = f"{NAME} {SKU} Reps | Drip Sneakers"
SEO_KW = (f"{NAME}, Dior Oblique Swim Shorts, Sky Blue Swim Shorts, "
          f"{SKU}, Dior Oblique Reps Swim Shorts")
SEO_DESC = (f"Shop {NAME} reps ({SKU}) at Drip Sneakers with QC photos, "
            f"30-day returns and 7–20 day shipping.")

KEY_DESC = (
    "<p>"
    "This Dior swim short is crafted in sky blue technical fabric with a tonal allover "
    "Dior Oblique print and a lace-up drawstring waist finished with Dior-engraved metal tips."
    "</p>\n\n"
    "<h2>Product Details</h2>\n\n"
    "<ul>\n"
    '<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Dior/"><strong>Dior</strong></a></li>\n'
    "<li><strong>Product Type:</strong> Swim Shorts</li>\n"
    "<li><strong>Model:</strong> Oblique Swim Shorts</li>\n"
    "<li><strong>Colorway:</strong> Sky Blue</li>\n"
    f"<li><strong>SKU:</strong> {SKU}</li>\n"
    "</ul>"
)

ALTS = [
    "Dior Oblique Swim Shorts Sky Blue Front View",
    "Dior Oblique Swim Shorts Sky Blue Side View with Flap Pocket",
    "Dior Oblique Swim Shorts Sky Blue Worn Front View",
    "Dior Oblique Swim Shorts Sky Blue Front View on Hanger",
    "Dior Oblique Swim Shorts Sky Blue Side View on Hanger",
    "Dior Oblique Swim Shorts Sky Blue Drawstring Waist Detail",
    "Dior Oblique Swim Shorts Sky Blue Waistband Detail",
    "Dior Oblique Swim Shorts Sky Blue Lace-Up Drawstring Detail",
    "Dior Oblique Swim Shorts Sky Blue Waist Detail Side Angle",
    "Dior Oblique Swim Shorts Sky Blue Flap Pocket Detail",
    "Dior Oblique Swim Shorts Sky Blue Inner Label Detail",
    "Dior Oblique Swim Shorts Sky Blue Dior Hangtag",
    "Dior Oblique Swim Shorts Sky Blue Care Label Detail",
]

raw = json.loads(json.load(open(BASE / "save_probe.json", encoding="utf-8"))[0]["post"])

# immutable rollback snapshot
(BASE / "canary_rollback_payload.json").write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")

row = raw["args"][0][0]["rows"][0]
imgs = row.get("ImgList") or []
if isinstance(imgs, str):
    imgs = json.loads(imgs)
print(f"images: {len(imgs)}  alts: {len(ALTS)}")
assert len(imgs) == len(ALTS), "ALT count must match image count"

# ---- Content: V4.4 §16 = product detail images only, every image carries ALT ----
blocks = []
for im, alt in zip(imgs, ALTS):
    url = "https://images.mrshopplus.com/" + im["s"]
    blocks.append(
        f'<p><img src="{url}" alt="{alt}" '
        f'style="max-width:100%;height:auto;display:block;margin:0 auto;" /></p>'
    )
CONTENT = "\n".join(blocks)

before = {k: row.get(k) for k in ("Name", "SeoTitle", "SeoKeyword", "SeoDesc", "UrlValue",
                                  "Url", "Summary", "IsShow")}
before["Content_len"] = len(row.get("Content") or "")
before["Content_imgs"] = (row.get("Content") or "").lower().count("<img")

row["Name"] = NAME
row["SeoTitle"] = SEO_TITLE
row["SeoKeyword"] = SEO_KW
row["SeoDesc"] = SEO_DESC
row["UrlValue"] = SLUG
row["Url"] = "/" + SLUG
row["Summary"] = KEY_DESC
row["Content"] = CONTENT
row["IsShow"] = True
row["OldUrlValue"] = before["UrlValue"]
row["SeoUrlChangeTo301"] = True

for im, alt in zip(imgs, ALTS):
    im["a"] = alt
row["ImgList"] = imgs
if isinstance(row.get("FirstImg"), dict) and imgs:
    row["FirstImg"]["a"] = ALTS[0]

after = {k: row.get(k) for k in ("Name", "SeoTitle", "SeoKeyword", "SeoDesc", "UrlValue",
                                 "Url", "Summary", "IsShow")}
after["Content_len"] = len(CONTENT)
after["Content_imgs"] = CONTENT.lower().count("<img")

print("\n=== CHANGES ===")
for k in before:
    b, a = before[k], after[k]
    if str(b) != str(a):
        print(f"  {k}:\n    - {str(b)[:180]}\n    + {str(a)[:180]}")
    else:
        print(f"  {k}: unchanged ({str(b)[:70]})")

(BASE / "canary_payload.json").write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
print("\npayload saved -> canary_payload.json")

if not LIVE:
    print("\nDRY RUN. re-run with --live to POST.")
    sys.exit(0)

print("\n=== LIVE POST ===")
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    payload = json.dumps(raw, ensure_ascii=False)
    res = page.evaluate("""async (body) => {
      const r = await fetch('/biz/DTB_proProduct/saveModify', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body
      });
      return {status: r.status, text: (await r.text()).slice(0, 800)};
    }""", payload)
    print("HTTP", res["status"])
    print(res["text"])
    ctx.close()
