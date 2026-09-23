"""Discover the save endpoint + exact payload shape by clicking Save with all /biz/ traffic
intercepted and aborted. Nothing is written to the shop by this script.
"""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
PID = 536027503505948
FORM_URL = (f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0"
            f"?action=3&pkValues=%5B{PID}%5D")

blocked = []
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(4000)
    page.goto(FORM_URL, wait_until="domcontentloaded", timeout=60000)
    try:
        page.wait_for_selector('main input[placeholder="请输入商品名称"]', timeout=45000)
    except Exception as e:
        print("form not ready:", str(e)[:100])
    page.wait_for_timeout(7000)

    # now intercept everything so the save cannot reach the server
    def handler(route):
        req = route.request
        blocked.append({"m": req.method, "u": req.url, "post": req.post_data})
        route.abort()
    page.route("**/biz/**", handler)

    btns = page.evaluate("""() => [...document.querySelectorAll('button')]
        .map(b => (b.innerText || '').trim().replace(/\\s+/g,' ')).filter(Boolean)""")
    print("=== BUTTONS ===")
    for b in dict.fromkeys(btns):
        print("  ", repr(b[:60]))

    clicked = page.evaluate("""() => {
        const bs = [...document.querySelectorAll('button')];
        const t = bs.find(b => /保存|确\\s*定|提交|发布/.test(b.innerText || ''));
        if (!t) return null;
        t.scrollIntoView({block:'center'});
        t.click();
        return (t.innerText || '').trim();
    }""")
    print("\nclicked:", repr(clicked))
    page.wait_for_timeout(6000)
    ctx.close()

(OUT / "save_probe.json").write_text(json.dumps(blocked, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n=== INTERCEPTED /biz/ CALLS: {len(blocked)} ===")
for b in blocked:
    print(f"  {b['m']:5s} {b['u'][:120]}")
    if b["post"]:
        print(f"        body[{len(b['post'])}]: {b['post'][:1200]}")
