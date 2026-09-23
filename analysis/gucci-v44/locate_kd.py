"""Locate the '关键描述' backend field: search DOM + inspect editor[1] ancestry + attr block."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
PID = 536027265030940

JS = r"""
() => {
  const main = document.querySelector('main') || document.body;
  const out = {formItems: [], editor1: null, kd: []};
  // all form-item labels
  main.querySelectorAll('.el-form-item').forEach(fi => {
    const lb = fi.querySelector('label');
    const hasEditor = fi.querySelector('.tox-tinymce, .mce-tinymce');
    out.formItems.push({label: lb ? lb.innerText.trim().slice(0,40) : '',
                        hasEditor: !!hasEditor,
                        cls: (fi.className||'').toString().slice(0,80),
                        txt: (fi.innerText||'').replace(/\s+/g,' ').slice(0,80)});
  });
  // editor[1] ancestry
  const t = window.tinymce;
  const eds = (t && t.editors || []).filter(e => { try { return main.contains(e.getElement()); } catch(x){ return false; } });
  eds.sort((a,b)=> (a.getElement().compareDocumentPosition(b.getElement()) & 4) ? -1 : 1);
  if (eds[1]) {
    const el = eds[1].getElement();
    const box = el.getBoundingClientRect();
    let node = el, chain=[];
    for (let k=0;k<10 && node;k++){
      chain.push({tag:node.tagName, cls:(node.className||'').toString().slice(0,90), txt:(node.innerText||'').replace(/\s+/g,' ').slice(0,60)});
      node = node.parentElement;
    }
    out.editor1 = {box:{x:Math.round(box.x),y:Math.round(box.y),w:Math.round(box.width),h:Math.round(box.height)}, chain};
  }
  // search for '关键描述' text nodes
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const tx = walker.currentNode.nodeValue || '';
    if (tx.includes('关键描述')) {
      let p = walker.currentNode.parentElement;
      out.kd.push({txt: tx.trim().slice(0,60), parentCls:(p.className||'').toString().slice(0,90),
                   grandTxt:(p.parentElement ? (p.parentElement.innerText||'').replace(/\s+/g,' ').slice(0,120) : '')});
    }
  }
  return out;
}
"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(user_data_dir=PROFILE, executable_path=CHROME, headless=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B{PID}%5D",
              wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function(
        "() => { const i = document.querySelector('main input[placeholder=\"请输入商品名称\"]'); return i && i.value && i.value.length>0; }",
        timeout=60000)
    page.wait_for_timeout(4000)
    r = page.evaluate(JS)
    (OUT / "kd_locate.json").write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")

    print("=== form-items (label | hasEditor) ===")
    for f in r["formItems"]:
        if f["hasEditor"] or f["label"]:
            print(f"  '{f['label']}' editor={f['hasEditor']}  txt='{f['txt'][:70]}'")
    print("\n=== editor[1] ===")
    print(json.dumps(r["editor1"], ensure_ascii=False, indent=2)[:1500])
    print("\n=== '关键描述' occurrences ===")
    for k in r["kd"]:
        print("  ", k)
    ctx.close()
