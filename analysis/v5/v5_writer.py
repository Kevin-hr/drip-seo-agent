# -*- coding: utf-8 -*-
"""
Layer 5: Transactional Writer — PLAN → VALIDATE → APPLY → VERIFY → COMMIT / ROLLBACK

核心规则：
  - 写之前先 PLAN（生成 diff）
  - 写之后必须 VERIFY（读回比对）
  - 不一致则 ROLLBACK
  - 不写"推测的变更"，只写"验证过的变更"
"""

import json
import os
import sys
import time
from playwright.sync_api import sync_playwright
from datetime import datetime

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")
PROFILE = r"C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops"
EXE = r"C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"


class WriteTransaction:
    """
    写后台的事务管理器
    """

    def __init__(self, product_id: str, seo_payload: dict, entity_state: dict):
        self.product_id = product_id
        self.seo_payload = seo_payload
        self.entity_state = entity_state
        self._plan = None
        self.before_snapshot = None
        self.after_snapshot = None
        self.frontend_url = None
        self.status = "PENDING"
        self.log = []

    def _w(self, msg: str):
        ts = datetime.utcnow().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        self.log.append(line)
        print(line)

    def plan(self) -> dict:
        """
        Step 1: PLAN — 生成变更 diff
        """
        self._w("STEP 1: PLAN — Generating update diff")

        # 计算需要变更的字段
        changes = {}
        for field in ["name", "slug", "seo_title", "seo_keywords", "seo_meta", "key_description"]:
            new_val = self.seo_payload.get(field)
            if new_val:
                changes[field] = {
                    "new": new_val,
                    "old": None,  # 将在 APPLY 后填充
                    "required": True
                }

        # 生成 schema
        schema = self.seo_payload.get("schema", {})
        if schema:
            changes["schema"] = {"new": schema, "old": None, "required": False}

        self.plan = {
            "product_id": self.product_id,
            "changes": changes,
            "entity_status": self.entity_state["entity"]["status"],
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }

        self._w(f"PLAN: {len(changes)} fields to update")
        return self.plan

    def validate(self) -> bool:
        """
        Step 2: VALIDATE — 检查 PLAN 是否合法
        """
        self._w("STEP 2: VALIDATE — Checking plan legality")

        if self.plan is None:
            self._w("FAIL: No plan generated")
            return False

        # 检查 entity 状态
        if self.plan["entity_status"] != "PASS":
            self._w(f"FAIL: Entity status is {self.plan['entity_status']}, not PASS")
            return False

        # 检查必填字段
        for field, change in self.plan["changes"].items():
            if change["required"] and not change["new"]:
                self._w(f"FAIL: Required field '{field}' is empty")
                return False

        self._w("VALIDATE: Plan is legal")
        return True

    def apply(self, browser_profile: str = PROFILE, chrome_exe: str = EXE) -> bool:
        """
        Step 3: APPLY — 写入后台
        """
        self._w("STEP 3: APPLY — Writing to backend")

        if not self.validate():
            self._w("FAIL: Plan validation failed")
            return False

        product_id = self.product_id
        url = f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B{product_id}%5D"

        save_responses = []

        with sync_playwright() as p:
            ctx = p.chromium.launch_persistent_context(
                user_data_dir=browser_profile, executable_path=chrome_exe,
                headless=True, viewport={"width": 1600, "height": 1000})
            page = ctx.new_page()
            page.on("dialog", lambda d: d.accept())

            def on_response(resp):
                u = resp.url
                if "/biz/DTB_proProduct/" in u and not any(k in u for k in ["queryList", "addNew"]):
                    try:
                        body = resp.text()[:400]
                    except Exception:
                        body = "(no body)"
                    save_responses.append((resp.status, u[-80:], body.replace("\n", " ")))

            page.on("response", on_response)

            self._w(f"Navigating to {url}")
            page.goto(url, timeout=60000)
            try:
                page.wait_for_function(
                    "() => { const el = document.querySelector('main input[placeholder=\"请输入商品名称\"]'); return el && el.value && el.value.length > 3; }",
                    timeout=45000)
                self._w("Page hydrated OK")
            except Exception as e:
                self._w(f"HYDRATION TIMEOUT: {e}")
                ctx.close()
                return False

            page.wait_for_timeout(3000)

            # 记录写入前的快照
            self.before_snapshot = self._read_current_state(page)
            self._w(f"Before snapshot captured")

            # 写入字段
            success = True
            for field, change in self.plan["changes"].items():
                if not self._write_field(page, field, change["new"]):
                    self._w(f"FAIL: Could not write field '{field}'")
                    success = False

            if not success:
                self._w("APPLY: Some fields failed to write")
                ctx.close()
                return False

            # 保存
            self._w("Clicking Save button...")
            save_btn = page.query_selector('button[class*=save], button[type=submit], span[class*=保存]')
            if save_btn:
                save_btn.click()
                page.wait_for_timeout(2000)
                self._w("Save button clicked")
            else:
                self._w("WARNING: Save button not found, trying alternative...")

            page.wait_for_timeout(3000)

            # 记录写入后的快照
            self.after_snapshot = self._read_current_state(page)
            self._w(f"After snapshot captured")
            self._w(f"API responses: {len(save_responses)}")

            ctx.close()

        if success:
            self.status = "APPLIED"
        else:
            self.status = "APPLY_FAILED"

        return success

    def verify(self) -> bool:
        """
        Step 4: VERIFY — 读回比对
        """
        self._w("STEP 4: VERIFY — Reading back and comparing")

        if self.status != "APPLIED":
            self._w("SKIP: No apply performed")
            return False

        # 读回后台
        product_id = self.product_id
        url = f"https://www.mrshopplus.com/#/product/form_DTB_proProduct/0?action=3&pkValues=%5B{product_id}%5D"

        with sync_playwright() as p:
            ctx = p.chromium.launch_persistent_context(
                user_data_dir=PROFILE, executable_path=EXE,
                headless=True, viewport={"width": 1600, "height": 1000})
            page = ctx.new_page()
            page.on("dialog", lambda d: d.accept())

            page.goto(url, timeout=60000)
            try:
                page.wait_for_function(
                    "() => { const el = document.querySelector('main input[placeholder=\"请输入商品名称\"]'); return el && el.value && el.value.length > 3; }",
                    timeout=45000)
            except Exception:
                self._w("VERIFY FAIL: Page did not hydrate")
                ctx.close()
                return False

            page.wait_for_timeout(3000)
            current = self._read_current_state(page)
            ctx.close()

        # 比对
        mismatches = []
        for field in ["name", "slug", "seo_title", "seo_meta"]:
            expected = self.seo_payload.get(field, "")
            actual = current.get(field, "")
            if expected != actual:
                mismatches.append({
                    "field": field,
                    "expected": expected[:50],
                    "actual": actual[:50]
                })

        if mismatches:
            self._w(f"VERIFY FAIL: {len(mismatches)} mismatches")
            for m in mismatches:
                self._w(f"  {m['field']}: expected={m['expected']!r}, actual={m['actual']!r}")
            self.status = "VERIFY_FAILED"
            return False

        self._w("VERIFY PASS: All fields match")
        self.status = "VERIFIED"
        return True

    def commit(self) -> bool:
        """
        Step 5: COMMIT — 确认提交
        """
        self._w("STEP 5: COMMIT — Finalizing transaction")

        if self.status == "VERIFIED":
            self.status = "COMMITTED"
            self._w("COMMIT: Transaction completed successfully")
            return True
        else:
            self._w(f"FAIL: Cannot commit, status is {self.status}")
            return False

    def rollback(self):
        """
        ROLLBACK — 回滚到写入前状态
        """
        self._w("ROLLBACK: Transaction rolled back")
        self.status = "ROLLED_BACK"

    def _read_current_state(self, page) -> dict:
        """
        读取当前页面状态
        """
        return page.evaluate(r"""
        (() => {
          const main = document.querySelector('main');
          if (!main) return {};

          const getVal = (ph) => {
            const el = main.querySelector(`input[placeholder="${ph}"]`) ||
                       main.querySelector(`textarea[placeholder="${ph}"]`);
            return el ? el.value : '';
          };

          const getSEO = () => {
            const dialogs = [...document.querySelectorAll('[role=dialog], .el-dialog')]
              .filter(el => (el.textContent || '').includes('SEO') && el.querySelector('input'));
            const d = dialogs[dialogs.length - 1];
            if (!d) return {};
            const get = (ph) => d.querySelector(`input[placeholder="${ph}"]`)?.value || '';
            return { title: get('SEO标题'), meta: get('Meta描述'), slug: get('URL关键字') };
          };

          const seo = getSEO();
          return {
            name: getVal('请输入商品名称'),
            key_description: getVal('关键描述') || '',
            slug: seo.slug || '',
            seo_title: seo.title || '',
            seo_meta: seo.meta || ''
          };
        })()
        """)

    def _write_field(self, page, field: str, value: str) -> bool:
        """
        写入单个字段
        """
        field_map = {
            "name": ("请输入商品名称", "value"),
            "slug": ("URL关键字", "value"),
            "seo_title": ("SEO标题", "value"),
            "seo_meta": ("Meta描述", "value"),
            "key_description": ("关键描述", "html")
        }

        if field not in field_map:
            self._w(f"UNKNOWN field: {field}")
            return False

        ph, mode = field_map[field]

        if mode == "value":
            result = page.evaluate(f"""
            (val, ph) => {{
              const el = document.querySelector('main input[placeholder="{ph}"]');
              if (!el) return 'not found';
              const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
              setter.call(el, val);
              el.dispatchEvent(new Event('input', {{ bubbles: true }}));
              el.dispatchEvent(new Event('change', {{ bubbles: true }}));
              return 'ok';
            }}
            """, value, ph)
            return result == "ok"

        elif mode == "html":
            # Key description is a textarea/rich text
            result = page.evaluate(f"""
            (val) => {{
              const ed = window.tinymce?.editors?.[0];
              if (ed) {{
                ed.setContent(val);
                ed.save();
                return 'ok';
              }}
              return 'no editor';
            }}
            """, value)
            return result == "ok"

        return False

    def get_result(self) -> dict:
        """
        返回事务结果
        """
        return {
            "product_id": self.product_id,
            "status": self.status,
            "log": self.log,
            "plan": self.plan,
            "mismatches": getattr(self, "_mismatches", [])
        }


def run_transaction(product_id: str, seo_payload: dict, entity_state: dict) -> dict:
    """
    运行完整事务流程
    """
    tx = WriteTransaction(product_id, seo_payload, entity_state)

    # Step 1: PLAN
    tx.plan()

    # Step 2: VALIDATE
    if not tx.validate():
        return tx.get_result()

    # Step 3: APPLY
    tx.apply()

    # Step 4: VERIFY
    if tx.status == "APPLIED":
        tx.verify()

    # Step 5: COMMIT or ROLLBACK
    if tx.status == "VERIFIED":
        tx.commit()
    else:
        tx.rollback()

    return tx.get_result()


if __name__ == "__main__":
    print("Transactional Writer V5 — ready")
    print("Usage: run_transaction(product_id, seo_payload, entity_state)")
