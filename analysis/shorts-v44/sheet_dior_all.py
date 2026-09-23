"""Contact sheet of ALL images for the chosen Dior product - detail shots may carry the
care label / tag with the reference number, which is the strongest possible SKU evidence."""
import json
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

BASE = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
DL = BASE / "dior_all"
DL.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

PID = "536027503505948"  # Dior CD Obi Drawstring Shorts Blue
detail = json.loads((BASE / "unpublished_detail.json").read_text(encoding="utf-8"))
prod = detail[PID]["prod"]
imgs = prod["ImgList"]
if isinstance(imgs, str):
    imgs = json.loads(imgs)
print("product:", prod["Name"], "| images:", len(imgs))

files = []
for i, im in enumerate(imgs):
    s = im["s"]
    ext = Path(s).suffix or ".jpg"
    dst = DL / f"{i:02d}{ext}"
    try:
        with urllib.request.urlopen(urllib.request.Request(
                "https://images.mrshopplus.com/" + s, headers=UA), timeout=60) as r:
            dst.write_bytes(r.read())
        files.append((i + 1, dst))
        print(f"  [{i+1:2d}] ok  {Path(s).name[:72]}")
    except Exception as e:
        print(f"  [{i+1:2d}] FAIL {e}")

cols, cell, lab = 4, 330, 22
rows = (len(files) + cols - 1) // cols
canvas = Image.new("RGB", (cols * cell, rows * (cell + lab)), (255, 255, 255))
d = ImageDraw.Draw(canvas)
for i, (n, p) in enumerate(files):
    r, c = divmod(i, cols)
    x, y = c * cell, r * (cell + lab)
    d.text((x + 5, y + 5), f"#{n}", fill=(0, 0, 0))
    try:
        im = Image.open(p).convert("RGB")
        im.thumbnail((cell - 10, cell - 10))
        canvas.paste(im, (x + (cell - im.width) // 2, y + lab + (cell - lab - im.height) // 2))
    except Exception as e:
        d.text((x + 5, y + 40), str(e)[:30], fill=(200, 0, 0))
    d.rectangle([x, y, x + cell - 1, y + cell + lab - 1], outline=(170, 170, 170))
canvas.save(BASE / "sheet_DIOR_all.jpg", quality=90)
print("sheet ->", (BASE / "sheet_DIOR_all.jpg").name, canvas.size)
