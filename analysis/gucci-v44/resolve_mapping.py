"""Resolve (a) the tinyMCE editor -> backend field mapping, (b) the product detail API shape."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
PID = 536027265030940

JS_LABELS = r"""
() => {
  const t = window.tinymce;
  const main = document.querySelector('main') || document.body;
  const eds = (t && t.editors || []).filter(e => { try { return main.contains(e.getElement()); } catch (x) { return false; } });
  eds.sort((a, b) => (a.getElement().compareDocumentPosition(b.getElement()) & 4) ? -1 : 1);
  return eds.map((e, i) => {
    const el = e.getElement();
    // walk up to find a container holding a label
    let node = el, chain = [];
    for (let k = 0; k < 8 && node; k++) {
      chain.push({
        tag: node.tagName,
        cls: (node.className || '').toString().slice(0, 120),
        labelText: (node.querySelector && node.querySelector('label') ? node.querySelector('label').innerText : '') || '',
        ownText: (node.innerText || '').slice(0, 120)
      });
      node = node.parentElement;
    }
    return {idx: i, id: e.id, elId: el.id, name: el.getAttribute('name'), chain};
  });
}
"""

JS_DETAIL = r"""
async ([pid]) => {
  const r = await fetch('/biz/DTB_proProduct/modify', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [[pid]], additions: {}})
  });
  const j = await r.json();
  return j;
}
"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    url = f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B{PID}%5D"
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function(
        "() => { const i = document.querySelector('main input[placeholder=\"请输入商品名称\"]'); return i && i.value && i.value.length>0; }",
        timeout=60000)
    page.wait_for_timeout(4000)

    labels = page.evaluate(JS_LABELS)
    print("=== EDITOR LABEL MAPPING ===")
    for e in labels:
        print(f"editor[{e['idx']}] id={e['id']} name={e.get('name')}")
        for c in e["chain"][:6]:
            if c["labelText"] or "form-item" in c["cls"] or "tox" in c["cls"]:
                print(f"    <{c['tag']} class='{c['cls'][:70]}'> label='{c['labelText'][:60]}' text='{c['ownText'][:70]}'")

    print("\n=== DETAIL API ===")
    try:
        j = page.evaluate(JS_DETAIL, [PID])
        (OUT / "detail_api_sample.json").write_text(json.dumps(j, ensure_ascii=False, indent=2), encoding="utf-8")
        # print keys + interesting values
        def walk(o, prefix="", depth=0):
            if depth > 2: return
            if isinstance(o, dict):
                for k, v in o.items():
                    if isinstance(v, (dict, list)):
                        print(f"  {prefix}{k}: <{type(v).__name__}>")
                        walk(v, prefix + "  ", depth + 1)
                    else:
                        s = str(v)
                        if len(s) < 200:
                            print(f"  {prefix}{k} = {s}")
        res = j.get("result")
        print("top-level result type:", type(res).__name__)
        if isinstance(res, list):
            print("result rows:", len(res))
            if res:
                print("FIRST ROW KEYS:", sorted(res[0].keys()))
                walk(res[0])
        else:
            walk(res)
    except Exception as e:
        print("detail API error:", e)
    ctx.close()
