"""Identify which saveModify payload field carries the backend '关键描述' (Key Description).
Method: inject a unique marker into editor[1], click Save with /biz/ intercepted, then locate
the marker inside the captured payload. Nothing reaches the server.
"""
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\shorts-v44")
PID = 536027503505948
MARKER = "KD-MARKER-7F3A2B"
FORM_URL = (f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0"
            f"?action=3&pkValues=%5B{PID}%5D")

sw = sync_playwright().start()
ctx = sw.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
page = ctx.pages[0] if ctx.pages else ctx.new_page()
page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
page.wait_for_timeout(4000)
page.goto(FORM_URL, wait_until="domcontentloaded", timeout=60000)
try:
    page.wait_for_selector('main input[placeholder="请输入商品名称"]', timeout=45000)
except Exception as e:
    print("form not ready:", str(e)[:80])
page.wait_for_timeout(8000)

inject = page.evaluate("""(marker) => {
  const tas = [...document.querySelectorAll('textarea.tinymce-textarea')];
  if (tas.length < 2) return 'only ' + tas.length + ' editors';
  const ta = tas[1];
  const id = ta.id;
  const tm = window.tinymce;
  if (tm) {
    const ed = tm.get(id) || (tm.editors || []).find(e => e.id === id || (e.targetElm && e.targetElm.id === id));
    if (ed) { ed.setContent('<p>' + marker + '</p>'); ed.fire('change'); ed.fire('input'); return 'tinymce-api:' + id; }
  }
  const cont = ta.closest('.tinymce-container') || ta.parentElement;
  const ifr = cont && cont.querySelector('iframe');
  if (ifr && ifr.contentDocument) {
    ifr.contentDocument.body.innerHTML = '<p>' + marker + '</p>';
    return 'iframe-fallback';
  }
  return 'no method';
}""", MARKER)
print("inject result:", inject)
page.wait_for_timeout(2500)

blocked = []
def handler(route):
    r = route.request
    blocked.append({"u": r.url, "post": r.post_data})
    route.abort()
page.route("**/biz/**", handler)

page.evaluate("""() => {
  const b = [...document.querySelectorAll('button')].find(x => (x.innerText||'').trim()==='保存');
  if (b) { b.scrollIntoView({block:'center'}); b.click(); }
}""")
page.wait_for_timeout(3000)
page.evaluate("""() => {
  const d = [...document.querySelectorAll('.el-message-box')].filter(x=>x.offsetParent!==null)[0];
  if (!d) return;
  const b = [...d.querySelectorAll('button')].find(x=>/确\\s*定|保存/.test(x.innerText||''));
  if (b) b.click();
}""")
page.wait_for_timeout(6000)
ctx.close(); sw.stop()

print(f"\nintercepted {len(blocked)} call(s)")
for c in blocked:
    if not c["post"]:
        continue
    print("  URL:", c["u"])
    if MARKER in c["post"]:
        print("  *** MARKER FOUND IN PAYLOAD ***")
        j = json.loads(c["post"])
        found = []
        def scan(o, path=""):
            if isinstance(o, str):
                if MARKER in o:
                    found.append((path, o[:160]))
            elif isinstance(o, dict):
                for k, v in o.items():
                    scan(v, f"{path}.{k}")
            elif isinstance(o, list):
                for i, v in enumerate(o[:50]):
                    scan(v, f"{path}[{i}]")
        scan(j)
        for p, v in found:
            print(f"    FIELD -> {p}   value={v!r}")
        (OUT / "kd_field_probe.json").write_text(json.dumps({"field_paths": found}, ensure_ascii=False, indent=1),
                                                encoding="utf-8")
    else:
        print("  marker NOT present. payload len:", len(c["post"]))
        print("  ", c["post"][:400])
