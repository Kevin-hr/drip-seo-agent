# -*- coding: utf-8 -*-
"""
Layer 1: Collector — get_product_snapshot()

输入：product_id
输出：完整商品事实快照 JSON

缺失任何关键字段 → SNAPSHOT_INCOMPLETE → STOP
"""

import json
import os
import sys
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from playwright.sync_api import sync_playwright

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")
PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
EXE = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"

REQUIRED_FIELDS = [
    "product_id", "name", "url", "description", "key_description",
    "seo_title", "seo_keywords", "seo_meta", "slug",
    "price", "inventory", "status",
    "images", "variants"
]


def get_product_snapshot(product_id: str, browser_profile: str = PROFILE, chrome_exe: str = EXE) -> dict:
    """
    一次性抓取商品完整事实快照。
    返回 dict，包含所有必需字段。
    任何字段缺失 → 抛出 ValueError
    """
    url = f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B{product_id}%5D"

    log_path = os.path.join(OUT, f"snapshot_{product_id}.log.txt")
    snap_path = os.path.join(OUT, f"snapshot_{product_id}.json")
    log = open(log_path, "w", encoding="utf-8", buffering=1)

    def w(s):
        log.write(str(s) + "\n")

    snapshot = {
        "product_id": product_id,
        "collected_at": datetime.utcnow().isoformat() + "Z",
        "browser": "playwright-headless",
    }

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=browser_profile, executable_path=chrome_exe,
            headless=True, viewport={"width": 1600, "height": 1000})
        page = ctx.new_page()
        page.on("dialog", lambda d: d.accept())

        w(f"Navigating to {url}")
        page.goto(url, timeout=60000)
        try:
            page.wait_for_function(
                "() => { const el = document.querySelector('main input[placeholder=\"请输入商品名称\"]'); return el && el.value && el.value.length > 3; }",
                timeout=45000)
            w("Page hydrated OK")
        except Exception as e:
            w(f"HYDRATION TIMEOUT: {e}")
            log.close(); ctx.close()
            raise TimeoutError(f"Product page did not hydrate: {product_id}")

        page.wait_for_timeout(3000)

        # 1. Extract all fields via one JS call
        data = page.evaluate(r"""
        (() => {
          const main = document.querySelector('main');
          if (!main) return { error: 'main element not found' };

          const getVal = (ph) => {
            const el = main.querySelector(`input[placeholder="${ph}"]`) ||
                       main.querySelector(`textarea[placeholder="${ph}"]`);
            return el ? el.value : null;
          };

          const getHTML = (ph) => {
            // Find editor containers
            const editors = [];
            const iframes = document.querySelectorAll('iframe[srcdoc], iframe[data-sandbox]');
            for (const iframe of iframes) {
              try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc) editors.push(doc.body?.innerHTML || '');
              } catch(e) {}
            }
            // Also try tinymce
            if (window.tinymce && window.tinymce.editors) {
              for (const ed of window.tinymce.editors) {
                const el = ed.getElement?.();
                if (el && main.contains(el)) {
                  editors.push(ed.getContent?.() || '');
                }
              }
            }
            return editors;
          };

          // Tags
          const getTags = () => {
            const dialogs = [...document.querySelectorAll('[role=dialog], .el-dialog')]
              .filter(el => (el.textContent || '').includes('SEO标题') && el.querySelector('input, textarea'));
            const d = dialogs[dialogs.length - 1];
            if (!d) return [];
            return [...d.querySelectorAll('.el-select__tags .el-tag')]
              .map(t => (t.firstChild?.textContent || t.textContent || '').trim()).filter(Boolean);
          };

          // Variants / SKUs
          const getVariants = () => {
            const rows = main.querySelectorAll('table tbody tr, .variant-row, [class*=variant]');
            const variants = [];
            for (const row of rows) {
              const cells = row.querySelectorAll('td, th, [class*=cell]');
              if (cells.length >= 2) {
                const size = cells[0]?.textContent?.trim() || '';
                const sku = cells[1]?.textContent?.trim() || '';
                const stock = cells[2]?.textContent?.trim() || '';
                if (size || sku) variants.push({ size, sku, stock });
              }
            }
            return variants.slice(0, 20); // cap
          };

          // Images
          const getImages = () => {
            const imgs = main.querySelectorAll('img');
            const results = [];
            for (const img of imgs) {
              const src = img.src || img.dataset?.src || '';
              const alt = img.alt || '';
              if (src && (src.includes('mrshopplus') || src.includes('yupoo'))) {
                results.push({ url: src, alt: alt, position: results.length + 1 });
              }
            }
            return results.slice(0, 30);
          };

          return {
            name: getVal('请输入商品名称') || '',
            key_description: getVal('关键描述') || getVal('Key Description') || '',
            description_raw: getHTML('关键描述'),
            images: getImages(),
            variants: getVariants(),
            seo_tags: getTags(),
          };
        })()
        """)

        if "error" in data:
            raise RuntimeError(f"JS extraction error: {data['error']}")

        # 2. Build snapshot
        snapshot["name"] = data.get("name", "") or None
        snapshot["key_description"] = data.get("key_description", "") or None
        snapshot["description_raw"] = data.get("description_raw", [])
        snapshot["images"] = data.get("images", [])
        snapshot["variants"] = data.get("variants", [])
        snapshot["seo_tags"] = data.get("seo_tags", [])

        # 3. Read SEO fields from separate dialog
        seo_data = page.evaluate(r"""
        (() => {
          const dialogs = [...document.querySelectorAll('[role=dialog], .el-dialog')]
            .filter(el => (el.textContent || '').includes('SEO') && el.querySelector('input'));
          const d = dialogs[dialogs.length - 1];
          if (!d) return {};
          const get = (ph) => d.querySelector(`input[placeholder="${ph}"]`)?.value || '';
          return {
            title: get('SEO标题'),
            keywords: get('SEO关键词'),
            meta: get('Meta描述'),
            slug: get('URL关键字'),
          };
        })()
        """)
        snapshot["seo_title"] = seo_data.get("title") or None
        snapshot["seo_keywords"] = seo_data.get("keywords") or None
        snapshot["seo_meta"] = seo_data.get("meta") or None
        snapshot["slug"] = seo_data.get("slug") or None

        # 4. Price & Inventory
        price_data = page.evaluate(r"""
        (() => {
          const getVal = (ph) => {
            const el = document.querySelector(`input[placeholder="${ph}"]`);
            return el ? el.value : null;
          };
          return {
            price: getVal('价格') || getVal('售价') || getVal('Price') || '',
            mkt_price: getVal('市场价') || '',
            stock: getVal('库存') || getVal('Inventory') || '',
          };
        })()
        """)
        snapshot["price"] = price_data.get("price") or None
        snapshot["mkt_price"] = price_data.get("mkt_price") or None
        snapshot["inventory"] = price_data.get("stock") or None

        # 5. Status
        status_el = page.evaluate(r"""
        (() => {
          // Look for status indicator
          const els = document.querySelectorAll('[class*=status], [class*=IShow]');
          for (const el of els) {
            const text = el.textContent || '';
            if (text.includes('上架') || text.includes('IsShow') || text.includes('显示')) {
              return { status: text.trim(), raw: el.outerHTML.slice(0, 100) };
            }
          }
          // Fallback: check a common pattern
          const btn = document.querySelector('button[class*=上架], button[class*=show]');
          return btn ? { status: btn.textContent.trim(), raw: '' } : { status: 'UNKNOWN', raw: '' };
        })()
        """)
        snapshot["status"] = status_el.get("status", "UNKNOWN")

        w(f"Snapshot extracted: name={snapshot['name'][:50]!r}, images={len(snapshot['images'])}, variants={len(snapshot['variants'])}")

    log.close()

    # 6. Validate required fields
    missing = [f for f in REQUIRED_FIELDS if not snapshot.get(f)]
    if missing:
        raise ValueError(f"SNAPSHOT_INCOMPLETE — missing fields: {missing}")

    # 7. Save
    with open(snap_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2)

    w(f"Snapshot saved to {snap_path}")
    return snapshot


def load_existing_snapshot(product_id: str) -> Optional[dict]:
    snap_path = os.path.join(OUT, f"snapshot_{product_id}.json")
    if os.path.isfile(snap_path):
        return json.load(open(snap_path, encoding="utf-8"))
    return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python v5_snapshot.py <product_id>")
        sys.exit(1)
    pid = sys.argv[1]
    try:
        snap = get_product_snapshot(pid)
        print(f"OK: {pid} — name={snap['name'][:60]!r}, images={len(snap['images'])}")
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(2)
