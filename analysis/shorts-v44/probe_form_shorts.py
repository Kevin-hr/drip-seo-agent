"""Probe the MrShopPlus product form for the canary product: dump every form control,
the TinyMCE editors, and any /biz/ endpoints the page touches. READ-ONLY.
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

DUMP = r"""
() => {
  const out = {controls: [], editors: [], labels: []};

  // every form-item: label text + first input value
  document.querySelectorAll('.el-form-item, .base-prop-item, .fs-item').forEach(fi => {
    const lab = fi.querySelector('label, .el-form-item__label');
    const labTxt = (lab ? lab.innerText : '').trim().replace(/\s+/g, ' ');
    const inp = fi.querySelector('input, textarea');
    const ed = fi.querySelector('.tinymce-container, textarea.tinymce-textarea');
    if (!labTxt && !inp && !ed) return;
    out.controls.push({
      label: labTxt.slice(0, 40),
      hasEditor: !!ed,
      inputTag: inp ? inp.tagName : null,
      inputType: inp ? (inp.type || null) : null,
      placeholder: inp ? (inp.placeholder || null) : null,
      value: inp ? String(inp.value).slice(0, 120) : null,
      cls: fi.className.slice(0, 70)
    });
  });

  // tinymce editors
  document.querySelectorAll('textarea.tinymce-textarea').forEach((t, i) => {
    let chain = [], el = t;
    for (let k = 0; k < 5 && el; k++) {
      el = el.parentElement;
      if (!el) break;
      chain.push({tag: el.tagName, cls: (el.className || '').toString().slice(0, 60),
                  txt: (el.innerText || '').slice(0, 60)});
    }
    out.editors.push({i, id: t.id, chain});
  });

  // any element whose own text is exactly a known SEO label
  const wanted = ['SEO标题', 'SEO关键字', 'SEO描述', 'SEO关键词', 'URL', '商品副标题', '商品名称', '商品上架'];
  document.querySelectorAll('label, .el-form-item__label, .base-prop-item, .left').forEach(e => {
    const t = (e.innerText || '').trim().replace(/\s+/g, ' ');
    if (t.length < 30 && wanted.some(w => t.startsWith(w))) {
      out.labels.push({tag: e.tagName, cls: (e.className || '').toString().slice(0, 60), txt: t});
    }
  });
  return out;
}
"""

reqs = []
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.on("request", lambda r: reqs.append({"m": r.method, "u": r.url, "post": (r.post_data or "")[:600]})
            if "/biz/" in r.url else None)

    page.goto("https://www.mrshopplus.com/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(4000)
    page.goto(FORM_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(4000)

    try:
        page.wait_for_selector('main input[placeholder="请输入商品名称"]', timeout=45000)
        name_val = page.eval_on_selector('main input[placeholder="请输入商品名称"]', "e => e.value")
        print("name input value:", repr(name_val))
    except Exception as e:
        print("name input wait failed:", str(e)[:110])

    page.wait_for_timeout(6000)
    data = page.evaluate(DUMP)
    ctx.close()

(OUT / "form_probe.json").write_text(json.dumps({"dump": data, "requests": reqs}, ensure_ascii=False, indent=1),
                                    encoding="utf-8")

print("\n=== FORM CONTROLS ===")
for c in data["controls"]:
    print(f"  [{c['label'] or '-'}] editor={int(c['hasEditor'])} tag={c['inputTag']} "
          f"ph={c['placeholder']!r} val={c['value']!r}")
print("\n=== TINYMCE EDITORS ===")
for e in data["editors"]:
    print(f"  editor[{e['i']}] id={e['id']}")
    for ch in e["chain"]:
        print(f"      {ch['tag']:8s} {ch['cls'][:52]:54s} {ch['txt'][:40]!r}")
print("\n=== LABELS FOUND ===")
for l in data["labels"][:25]:
    print("  ", l["txt"], "|", l["cls"])
print("\n=== /biz/ REQUESTS ===")
for r in reqs:
    print(f"  {r['m']:5s} {r['u'][:130]}")
    if r["post"]:
        print(f"        body: {r['post'][:200]}")
