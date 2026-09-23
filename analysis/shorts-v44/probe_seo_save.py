"""Step 1: open the SEO editor to learn its controls.
Step 2: click Save with all /biz/ traffic intercepted, to capture the exact write payload.
Nothing reaches the server.
"""
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
PID = 536027503505948
FORM_URL = (f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0"
            f"?action=3&pkValues=%5B{PID}%5D")

sw = sync_playwright().start()
browser = sw.chromium.launch_persistent_context(
    user_data_dir=PROFILE, executable_path=CHROME, headless=True)
page = browser.pages[0] if browser.pages else browser.new_page()
page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
page.wait_for_timeout(4000)
page.goto(FORM_URL, wait_until="domcontentloaded", timeout=60000)
try:
    page.wait_for_selector('main input[placeholder="请输入商品名称"]', timeout=45000)
except Exception as e:
    print("form not ready:", str(e)[:90])
page.wait_for_timeout(7000)

# ---------- STEP 1: SEO editor ----------
print("=== open 编辑SEO ===")
opened = page.evaluate("""() => {
  const b = [...document.querySelectorAll('button')]
    .find(x => (x.innerText||'').trim() === '编辑SEO');
  if (!b) return null;
  b.scrollIntoView({block:'center'}); b.click(); return true;
}""")
print("clicked:", opened)
page.wait_for_timeout(6000)

seo_dump = page.evaluate("""() => {
  const dlgs = [...document.querySelectorAll('.el-dialog, .el-drawer, .el-message-box')]
    .filter(d => d.offsetParent !== null);
  const out = [];
  dlgs.forEach((d, di) => {
    const ctrls = [...d.querySelectorAll('input, textarea')].map(e => {
      let lab = null, p = e;
      for (let k=0;k<6 && p;k++){ p = p.parentElement; if(!p) break;
        const l = p.querySelector('label, .el-form-item__label, .base-prop-item, .el-form-item__label-wrap');
        if (l && (l.innerText||'').trim()) { lab = l.innerText.trim().replace(/\\s+/g,' '); break; } }
      return {label: lab, tag: e.tagName, type: e.type||null,
              ph: e.placeholder||null, val: String(e.value||'').slice(0,150)};
    });
    out.push({dialog: di, cls: d.className.slice(0,60),
              title: (d.querySelector('.el-dialog__title, .el-drawer__title')||{}).innerText || null,
              controls: ctrls});
  });
  return out;
}""")
print(json.dumps(seo_dump, ensure_ascii=False, indent=1)[:3500])

page.keyboard.press("Escape")
page.wait_for_timeout(2000)

# ---------- STEP 2: save payload ----------
blocked = []
def handler(route):
    r = route.request
    blocked.append({"m": r.method, "u": r.url, "post": r.post_data})
    route.abort()
page.route("**/biz/**", handler)

print("\n=== click 保存 ===")
clicked = page.evaluate("""() => {
  const b = [...document.querySelectorAll('button')]
    .find(x => (x.innerText||'').trim() === '保存');
  if (!b) return null;
  b.scrollIntoView({block:'center'}); b.click(); return true;
}""")
print("clicked:", clicked)
page.wait_for_timeout(3000)

# possible confirm dialog
page.evaluate("""() => {
  const d = [...document.querySelectorAll('.el-message-box')].filter(x=>x.offsetParent!==null)[0];
  if (!d) return null;
  const b = [...d.querySelectorAll('button')].find(x=>/确\\s*定|保存/.test(x.innerText||''));
  if (b) { b.click(); return true; } return null;
}""")
page.wait_for_timeout(6000)
browser.close(); sw.stop()

(OUT / "seo_editor_dump.json").write_text(json.dumps(seo_dump, ensure_ascii=False, indent=1), encoding="utf-8")
(OUT / "save_probe.json").write_text(json.dumps(blocked, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"\n=== INTERCEPTED: {len(blocked)} ===")
for x in blocked:
    print(f"  {x['m']:5s} {x['u'][:120]}")
    if x["post"]:
        print(f"        POST len={len(x['post'])}")
        print("        " + x["post"][:2500])
