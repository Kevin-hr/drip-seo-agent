"""Download main images for the candidate set, so the entity can be read from the
IMAGE, not the (unreliable) supplier filename."""
import json
import urllib.request
from pathlib import Path

BASE = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
OUT = BASE / "candidates"
OUT.mkdir(parents=True, exist_ok=True)
CDN = "https://images.mrshopplus.com/"

detail = json.loads((BASE / "unpublished_detail.json").read_text(encoding="utf-8"))

CANDIDATES = {
    "536027348411920": "Fendi-FF-Motif-Shorts-Black-Brown",
    "536027440058641": "Rhude-RH-Logo-Shorts-Blue",
    "536027538115355": "ChromeHearts-Denim-Shorts-Black",
    "536027516802079": "Sp5der-OG-Web-Shorts",
    "536027457059613": "Godspeed-CourtSide-Shorts-GreenWash",
    "536027503505948": "Dior-CD-Obi-Drawstring-Shorts-Blue",
    "536027485749012": "ThomBrowne-Diagonal-Stripe-Track-Shorts",
}

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

for pid, label in CANDIDATES.items():
    rec = detail.get(pid) or {}
    prod = rec.get("prod") or {}
    imgs = prod.get("ImgList") or []
    if isinstance(imgs, str):
        try:
            imgs = json.loads(imgs)
        except Exception:
            imgs = []
    print(f"\n=== {pid} | {prod.get('Name')} | {len(imgs)} imgs ===")
    for i, im in enumerate(imgs[:4]):
        s = (im or {}).get("s")
        if not s:
            continue
        ext = Path(s).suffix or ".jpg"
        dst = OUT / f"{label}__{i+1}{ext}"
        try:
            req = urllib.request.Request(CDN + s, headers=UA)
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            dst.write_bytes(data)
            print(f"  [{i+1}] {len(data):>8,}B  {Path(s).name[:70]}  -> {dst.name}")
        except Exception as e:
            print(f"  [{i+1}] FAIL {e}  {s[:70]}")
