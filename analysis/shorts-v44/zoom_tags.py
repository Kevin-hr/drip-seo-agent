"""Read the tag / care-label shots at high magnification - the reference code may be
physically printed on the hangtag or wash label, which outranks any web source."""
import re
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

BASE = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
DL = BASE / "dior_all"

for n in (11, 12, 13):
    src = next(DL.glob(f"{n:02d}.*"), None)
    if not src:
        print(f"#{n}: missing")
        continue
    im = Image.open(src).convert("RGB")
    print(f"#{n}: {src.name} size={im.size}")

    w, h = im.size
    # three horizontal bands, each upscaled 3x with contrast boost
    for band, (y0f, y1f) in enumerate([(0.0, 0.40), (0.30, 0.72), (0.62, 1.0)], 1):
        crop = im.crop((0, int(h * y0f), w, int(h * y1f)))
        crop = crop.resize((crop.width * 3, crop.height * 3), Image.LANCZOS)
        crop = ImageEnhance.Contrast(crop).enhance(1.7)
        crop = ImageEnhance.Sharpness(crop).enhance(2.0)
        out = BASE / f"zoom_{n:02d}_band{band}.png"
        crop.save(out)
        print(f"   band{band} -> {out.name} {crop.size}")

# try OCR if a tesseract binary is reachable
try:
    import pytesseract
    for n in (11, 12, 13):
        src = next(DL.glob(f"{n:02d}.*"), None)
        if not src:
            continue
        im = Image.open(src).convert("L")
        im = im.resize((im.width * 3, im.height * 3), Image.LANCZOS)
        im = ImageOps.autocontrast(im)
        try:
            txt = pytesseract.image_to_string(im)
        except Exception as e:
            print(f"#{n} OCR unavailable: {str(e)[:90]}")
            break
        clean = [l.strip() for l in txt.splitlines() if l.strip()]
        print(f"\n--- OCR #{n} ---")
        for l in clean[:30]:
            print("   ", l)
except ImportError:
    print("pytesseract not installed")
