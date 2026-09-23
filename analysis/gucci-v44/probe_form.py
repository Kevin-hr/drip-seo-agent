"""Probe ONE product form page: capture XHR, read TinyMCE content, SEO fields, gallery. Read-only."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
PID = 536027265030940  # Gucci Women's Screener Sneaker Pink

JS_TINY = r"""
() => {
  const t = window.tinymce;
  if (!t || !t.editors) return {error: 'no tinymce'};
  const main = document.querySelector('main') || document.body;
  const eds = t.editors.filter(e => { try { return main.contains(e.getElement()); } catch (x) { return false; } });
  eds.sort((a, b) => {
    const A = a.getElement(), B = b.getElement();
    return (A.compareDocumentPosition(B) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
  });
  return {
    count: eds.length,
    items: eds.map((e, i) => ({idx: i, id: e.id, len: (e.getContent()||'').length, html: (e.getContent()||'').slice(0, 3000)}))
  };
}
"""

JS_INPUTS = r"""
() => {
  const main = document.querySelector('main') || document.body;
  const ins = [...main.querySelectorAll('input,textarea')].filter(e => e.offsetParent !== null || e.type === 'hidden');
  return ins.slice(0, 80).map(e => ({
    tag: e.tagName, type: e.type, name: e.name || '', ph: e.placeholder || '',
    val: (e.value || '').slice(0, 200), cls: (e.className || '').toString().slice(0, 80)
  }));
}
"""

JS_IMGS = r"""
() => {
  const main = document.querySelector('main') || document.body;
  return [...main.querySelectorAll('img')].map(i => ({src: i.src.slice(0, 300), alt: i.alt || '', w: i.naturalWidth, h: i.naturalHeight}));
}
"""

reqs = []
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()

    def on_req(r):
        u = r.url
        if "/biz/" in u or "/api/" in u:
            try:
                body = r.post_data or ""
            except Exception:
                body = ""
            reqs.append({"m": r.method, "u": u, "b": body[:300]})

    page.on("request", on_req)
    url = f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B{PID}%5D"
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    try:
        page.wait_for_function(
            "() => { const i = document.querySelector('main input[placeholder=\"请输入商品名称\"]'); return i && i.value && i.value.length > 0; }",
            timeout=60000,
        )
        print("form loaded OK")
    except Exception as e:
        print("wait name field FAILED:", e)
    page.wait_for_timeout(4000)

    name_val = page.evaluate("() => { const i = document.querySelector('main input[placeholder=\"请输入商品名称\"]'); return i ? i.value : null; }")
    print("name field value:", repr(name_val))

    tiny = page.evaluate(JS_TINY)
    inputs = page.evaluate(JS_INPUTS)
    imgs = page.evaluate(JS_IMGS)

    dump = {"pid": PID, "name_field": name_val, "tinymce": tiny, "inputs": inputs, "imgs": imgs, "requests": reqs}
    (OUT / "probe_form_sample.json").write_text(json.dumps(dump, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n--- requests ---")
    for r in reqs:
        print(" ", r["m"], r["u"][:160], "| body:", r["b"][:160])
    print("\n--- tinymce ---")
    print(json.dumps(tiny, ensure_ascii=False)[:2000])
    print("\n--- inputs (non-empty or named) ---")
    for i in inputs:
        if i["val"] or i["ph"]:
            print("  ", i["tag"], i["type"], "| ph=", i["ph"], "| name=", i["name"], "| val=", i["val"][:120])
    print("\n--- imgs ---")
    for i in imgs[:25]:
        print("  ", i["w"], "x", i["h"], "|", i["src"][:140], "| alt=", i["alt"][:60])
    ctx.close()
