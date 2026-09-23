"""Precisely locate editor[1] label; dump the full detail payload field values."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
CHROME = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"
OUT = Path(r"C:\Users\Administrator\Documents\drip-seo-agent\analysis\gucci-v44")
PID = 536027265030940

JS_LABEL2 = r"""
() => {
  const t = window.tinymce;
  const main = document.querySelector('main') || document.body;
  const eds = (t && t.editors || []).filter(e => { try { return main.contains(e.getElement()); } catch (x) { return false; } });
  eds.sort((a, b) => (a.getElement().compareDocumentPosition(b.getElement()) & 4) ? -1 : 1);
  return eds.map((e, i) => {
    const el = e.getElement();
    let node = el, found = null, chainTexts = [];
    for (let k = 0; k < 12 && node; k++) {
      const fi = node.closest ? node.closest('.el-form-item') : null;
      if (fi) {
        const lb = fi.querySelector('label');
        found = {label: lb ? lb.innerText.trim() : '(no label)', cls: (fi.className||'').toString().slice(0,100)};
        break;
      }
      chainTexts.push((node.className||'').toString().slice(0,60));
      node = node.parentElement;
    }
    return {idx: i, id: e.id, formItem: found, chainTexts};
  });
}
"""

JS_DETAIL = r"""
async ([pid]) => {
  const r = await fetch('/biz/DTB_proProduct/modify', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({args: [[pid]], additions: {}})
  });
  return await r.json();
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

    print("=== EDITOR -> FORM-ITEM LABEL ===")
    for e in page.evaluate(JS_LABEL2):
        print(f"editor[{e['idx']}] id={e['id']}  formItem={e['formItem']}")

    j = page.evaluate(JS_DETAIL, [PID])
    (OUT / "detail_api_sample.json").write_text(json.dumps(j, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n=== DETAIL PAYLOAD STRUCTURE ===")
    res = j.get("result")
    for i, blk in enumerate(res):
        print(f"[{i}] name={blk.get('name')} rows={len(blk.get('rows') or [])} topkeys={list(blk.keys())}")

    # find the block named dtb_proProduct and inspect its rows
    for blk in res:
        if blk.get("name") == "dtb_proProduct":
            rows = blk.get("rows") or []
            print(f"\n--- dtb_proProduct rows: {len(rows)} ---")
            for r in rows[:80]:
                if isinstance(r, dict):
                    print("   ", {k: (str(v)[:90]) for k, v in r.items() if k in ("name","field","column","value","Id","Name","KeyDescription","Description")} or list(r.keys())[:8])
    ctx.close()
