"""Build two contact sheets: our Hellstar shorts candidates vs Hellstar official shorts."""
import json
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

BASE = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
CDN = "https://images.mrshopplus.com/"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
DL = BASE / "hellstar_cmp"
DL.mkdir(parents=True, exist_ok=True)

OURS = [
    ("536027529838621", "777 Blue"),
    ("536027529887261", "777 Yellow"),
    ("536027529918481", "777 White"),
    ("536027529968157", "777 Red"),
    ("536027530031127", "777 Grey"),
    ("536027530064410", "777 Black"),
    ("536027530111770", "778 Black"),
    ("536027530145040", "778 White"),
    ("536027530178071", "778 Red"),
    ("536027530224147", "779 Black"),
    ("536027530274578", "786 Black"),
]


def fetch(url, dst):
    if dst.exists() and dst.stat().st_size > 1000:
        return dst
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45) as r:
            dst.write_bytes(r.read())
        return dst
    except Exception as e:
        print("   FAIL", url[:80], e)
        return None


def sheet(items, out_path, cols=5, cell=270, label_h=26):
    rows = (len(items) + cols - 1) // cols
    W, H = cols * cell, rows * (cell + label_h)
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(canvas)
    for i, (label, path) in enumerate(items):
        r, c = divmod(i, cols)
        x, y = c * cell, r * (cell + label_h)
        d.text((x + 4, y + 4), f"{i+1}. {label[:40]}", fill=(0, 0, 0))
        try:
            im = Image.open(path).convert("RGB")
            im.thumbnail((cell - 8, cell - 8))
            canvas.paste(im, (x + (cell - im.width) // 2, y + label_h + (cell - label_h - im.height) // 2))
        except Exception as e:
            d.text((x + 4, y + 40), f"ERR {e}", fill=(200, 0, 0))
        d.rectangle([x, y, x + cell - 1, y + cell + label_h - 1], outline=(180, 180, 180))
    canvas.save(out_path, quality=88)
    print("  sheet ->", out_path.name, canvas.size)


print("=== OUR Hellstar candidates ===")
detail = json.loads((BASE / "unpublished_detail.json").read_text(encoding="utf-8"))
our_items = []
for pid, label in OURS:
    imgs = (detail.get(pid, {}).get("prod") or {}).get("ImgList") or []
    if isinstance(imgs, str):
        try:
            imgs = json.loads(imgs)
        except Exception:
            imgs = []
    if not imgs:
        print(f"  {label}: NO IMAGE")
        continue
    s = imgs[0]["s"]
    ext = Path(s).suffix or ".jpg"
    dst = DL / f"our__{label.replace(' ', '_')}{ext}"
    p = fetch(CDN + s, dst)
    print(f"  {label:12s} <- {Path(s).name[:62]} {'OK' if p else 'FAIL'}")
    if p:
        our_items.append((label, p))
sheet(our_items, BASE / "sheet_OUR_hellstar.jpg")

print("\n=== Hellstar OFFICIAL shorts ===")
hs = json.loads((BASE / "hellstar_all.json").read_text(encoding="utf-8"))["products"]
shorts = [p for p in hs if "short" in (p["title"] + " " + (p.get("product_type") or "")).lower()]
off_items = []
for p in shorts:
    imgs = p.get("images") or []
    if not imgs:
        continue
    col = sorted({v["title"].split(" / ")[0] for v in p["variants"]})
    label = f"{p['title'][:30]} [{col[0] if len(col)==1 else ','.join(col)[:14]}]"
    src = imgs[0]["src"]
    ext = Path(src.split("?")[0]).suffix or ".jpg"
    dst = DL / f"off__{p['handle'][:40]}{ext}"
    pth = fetch(src, dst)
    if pth:
        off_items.append((label, pth))
sheet(off_items, BASE / "sheet_OFFICIAL_hellstar.jpg")
