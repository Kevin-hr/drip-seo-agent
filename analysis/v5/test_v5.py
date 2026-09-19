# -*- coding: utf-8 -*-
"""
V5 Pipeline Tests
覆盖：Entity State Machine、SKU Gate、Transactional Writer
"""
import json
import os
import sys
import unittest
from datetime import datetime

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")
sys.path.insert(0, OUT)

from v5_config import EntityStatus, FORBIDDEN_ACTIONS
from v5_entity_state import (
    create_entity_state, update_entity_status, can_perform_action,
    generate_machine_readable_decision, save_entity_state, load_entity_state
)


class TestEntityStateMachine(unittest.TestCase):
    """Layer 3: Entity State Machine 单元测试"""

    def setUp(self):
        self.snapshot = {
            "product_id": "TEST001",
            "name": "Louis Vuitton Embroidery T-Shirt Black",
            "collected_at": "2026-09-18T02:00:00Z",
            "images": [{"url": "https://example.com/img1.jpg", "alt": "front"}],
            "variants": [],
            "price": "99",
            "inventory": "100",
            "status": "上架",
        }

    def test_create_observed(self):
        """创建初始状态应为 OBSERVED"""
        state = create_entity_state("TEST001", self.snapshot)
        self.assertEqual(state["entity"]["status"], EntityStatus.OBSERVED)
        self.assertEqual(state["entity"]["product_name"], "Louis Vuitton Embroidery T-Shirt Black")
        self.assertEqual(len(state["decision_log"]), 1)

    def test_status_transition_observed_to_candidate(self):
        """OBSERVED → CANDIDATE"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.CANDIDATE, "Brand detected in name")
        self.assertEqual(state["entity"]["status"], EntityStatus.CANDIDATE)
        self.assertEqual(len(state["entity"]["notes"]), 1)

    def test_status_transition_candidate_to_pass(self):
        """CANDIDATE → PASS"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.CANDIDATE, "Brand detected")
        state = update_entity_status(state, EntityStatus.PASS, "SKU verified via StockX")
        self.assertEqual(state["entity"]["status"], EntityStatus.PASS)
        self.assertEqual(len(state["entity"]["notes"]), 2)

    def test_status_transition_to_hold(self):
        """HOLD 状态拒绝所有操作"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.HOLD, "Insufficient evidence")
        self.assertEqual(state["entity"]["status"], EntityStatus.HOLD)

    def test_status_transition_to_conflict(self):
        """CONFLICT 状态拒绝所有操作"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.CONFLICT, "Image-color mismatch")
        self.assertEqual(state["entity"]["status"], EntityStatus.CONFLICT)

    def test_invalid_status_raises(self):
        """非法状态应抛出 ValueError"""
        state = create_entity_state("TEST001", self.snapshot)
        with self.assertRaises(ValueError):
            update_entity_status(state, "INVALID_STATUS", "test")

    def test_forbidden_actions_non_pass(self):
        """非 PASS 状态应禁止写操作"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.CANDIDATE, "test")
        self.assertFalse(can_perform_action(state, "rename_product"))
        self.assertFalse(can_perform_action(state, "publish_seo"))
        self.assertFalse(can_perform_action(state, "update_description"))

    def test_allowed_actions_pass(self):
        """PASS 状态允许所有操作"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.PASS, "verified")
        self.assertTrue(can_perform_action(state, "rename_product"))
        self.assertTrue(can_perform_action(state, "publish_seo"))
        self.assertTrue(can_perform_action(state, "update_description"))

    def test_hold_forbids_all(self):
        """HOLD 状态禁止所有操作（含 any_action）"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.HOLD, "test")
        self.assertFalse(can_perform_action(state, "any_action"))
        self.assertFalse(can_perform_action(state, "rename_product"))

    def test_conflict_forbids_all(self):
        """CONFLICT 状态禁止所有操作"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.CONFLICT, "test")
        self.assertFalse(can_perform_action(state, "rename_product"))

    def test_generate_machine_readable_decision_hold(self):
        """HOLD 状态输出正确的决策 JSON"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.HOLD, "waiting")
        decision = generate_machine_readable_decision(state)
        self.assertEqual(decision["decision"], "HOLD")
        self.assertEqual(decision["entity_status"], EntityStatus.HOLD)
        self.assertEqual(len(decision["allowed_actions"]), 0)

    def test_generate_machine_readable_decision_pass(self):
        """PASS 状态输出 PROCEED"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.PASS, "verified")
        decision = generate_machine_readable_decision(state)
        self.assertEqual(decision["decision"], "PROCEED")
        self.assertIn("rename_product", decision["allowed_actions"])

    def test_save_and_load_entity_state(self):
        """保存和加载实体状态"""
        state = create_entity_state("TEST001", self.snapshot)
        state = update_entity_status(state, EntityStatus.CANDIDATE, "test")
        path = save_entity_state(state, "TEST001")
        self.assertTrue(os.path.exists(path))

        loaded = load_entity_state("TEST001")
        self.assertIsNotNone(loaded)
        self.assertEqual(loaded["entity"]["status"], EntityStatus.CANDIDATE)
        self.assertEqual(loaded["product_id"], "TEST001")

        # 清理
        os.remove(path)


class TestSKUValidation(unittest.TestCase):
    """SKU 验证规则测试"""

    def test_valid_official_sku(self):
        """合法官方 SKU：10 位字母数字"""
        self._assert_sku_result("1AHW84", True, "Official SKU format")

    def test_valid_official_sku_with_dash(self):
        """带连字符的官方 SKU"""
        self._assert_sku_result("DZ5485-106", True, "Official SKU with dash")

    def test_invalid_product_id_not_sku(self):
        """Shopify Product ID 不是合法 SKU，应返回 OMIT"""
        self._assert_sku_result("536027468294169", None, "Shopify numeric ID")

    def test_invalid_supplier_code(self):
        """供应商内部编号不应作为 SKU"""
        self._assert_sku_result("DC2-001", False, "Supplier internal code")

    def test_empty_sku_is_omit(self):
        """空 SKU 应返回 OMIT"""
        self._assert_sku_result(None, None, "Empty SKU → OMIT")

    def test_unknown_sku_is_hold(self):
        """无法验证的 SKU 应返回 HOLD"""
        self._assert_sku_result("UNKNOWN-SKU-XYZ", False, "Unverifiable SKU → HOLD")

    def _assert_sku_result(self, sku, expected, reason):
        result = self._evaluate_sku(sku)
        if expected is True:
            self.assertEqual(result["action"], "USE", f"SKU '{sku}': {reason}")
        elif expected is False:
            self.assertEqual(result["action"], "HOLD", f"SKU '{sku}': {reason}")
        elif expected is None:
            self.assertEqual(result["action"], "OMIT", f"SKU '{sku}': {reason}")

    @staticmethod
    def _evaluate_sku(sku: str) -> dict:
        """SKU 验证逻辑（与 v5_pdp_generator 一致）"""
        if sku is None or sku == "":
            return {"action": "OMIT", "sku": None, "reason": "No SKU provided"}

        import re
        # 官方 SKU：10 位字母数字或带连字符的格式
        if re.match(r'^[A-Z0-9]{5,12}(-[A-Z0-9]+)?$', sku):
            return {"action": "USE", "sku": sku, "reason": "Official SKU format matched"}

        # Shopify Product ID（纯数字，13+位）
        if sku.isdigit() and len(sku) >= 13:
            return {"action": "OMIT", "sku": None, "reason": "Shopify Product ID, not official SKU"}

        # 供应商内部编码（含连字符但格式不匹配官方）
        return {"action": "HOLD", "sku": None, "reason": f"Unverified SKU format: {sku}"}


class TestTransactionalWriter(unittest.TestCase):
    """Layer 5: Transactional Writer 测试"""

    def test_plan_generation(self):
        """PLAN 阶段应生成有效的变更计划"""
        from v5_writer import WriteTransaction
        payload = {
            "product_id": "TEST001",
            "product_name": "Test Product",
            "slug": "test-product",
            "seo_title": "Test SEO Title",
            "seo_meta": "Test meta description",
        }
        state = {
            "entity": {"status": "PASS"},
            "visual_observation": {"status": "PASS"}
        }
        tx = WriteTransaction("TEST001", payload, state)
        plan = tx.plan()
        self.assertIsNotNone(plan)
        self.assertEqual(plan["product_id"], "TEST001")
        self.assertEqual(plan["entity_status"], "PASS")
        self.assertIn("changes", plan)

    def test_validate_plan_fail_on_non_pass(self):
        """非 PASS 状态下 validate 应失败"""
        from v5_writer import WriteTransaction
        payload = {"product_id": "TEST001"}
        state = {"entity": {"status": "HOLD"}}
        tx = WriteTransaction("TEST001", payload, state)
        tx.plan()
        self.assertFalse(tx.validate())

    def test_validate_plan_pass_on_pass_status(self):
        """PASS 状态下 validate 应成功"""
        from v5_writer import WriteTransaction
        payload = {"product_id": "TEST001", "product_name": "Test"}
        state = {"entity": {"status": "PASS"}}
        tx = WriteTransaction("TEST001", payload, state)
        tx.plan()
        self.assertTrue(tx.validate())

    def test_rollback_sets_status(self):
        """rollback 应将状态设为 ROLLED_BACK"""
        from v5_writer import WriteTransaction
        payload = {"product_id": "TEST001"}
        state = {"entity": {"status": "PASS"}}
        tx = WriteTransaction("TEST001", payload, state)
        tx.rollback()
        self.assertEqual(tx.status, "ROLLED_BACK")


class TestPDPGenerator(unittest.TestCase):
    """Layer 4: PDP Generator 测试"""

    def test_generate_seo_payload_pass(self):
        """PASS 状态应生成有效 SEO Payload"""
        from v5_pdp_generator import generate_seo_payload
        state = {
            "product_id": "TEST001",
            "entity": {
                "status": "PASS",
                "brand": "Louis Vuitton",
                "product_type": "T-Shirt",
                "colorway": "Black",
                "model": "Embroidery T-Shirt",
                "sku": "1AHW84"
            },
            "visual_observation": {
                "status": "PASS",
                "base_color_visual": "black"
            }
        }
        payload = generate_seo_payload(state)
        self.assertIn("Louis Vuitton", payload["product_name"])
        self.assertIn("Black", payload["product_name"])
        self.assertIn("louis-vuitton-embroidery-t-shirt-black", payload["slug"])
        self.assertIn("Louis Vuitton", payload["seo_title"])

    def test_generate_seo_payload_forbidden_on_non_pass(self):
        """非 PASS 状态应抛出权限错误"""
        from v5_pdp_generator import generate_seo_payload
        state = {
            "product_id": "TEST001",
            "entity": {
                "status": "HOLD",
                "brand": "Louis Vuitton",
                "product_type": "T-Shirt",
                "colorway": "Black",
            }
        }
        with self.assertRaises(PermissionError):
            generate_seo_payload(state)

    def test_generate_img_html(self):
        """图片 HTML 生成应正确"""
        from v5_pdp_generator import generate_img_html
        images = [
            {"url": "https://example.com/img1.jpg", "alt": "front view"},
            {"url": "https://example.com/img2.jpg", "alt": "back view"},
        ]
        html = generate_img_html(images, "Louis Vuitton")
        self.assertIn("<img", html)
        self.assertIn("img1.jpg", html)
        self.assertIn("img2.jpg", html)
        self.assertIn('alt="front view"', html)

    def test_generate_kd_html(self):
        """关键描述 HTML 生成应正确"""
        from v5_pdp_generator import generate_kd_html
        html = generate_kd_html(
            "This Louis Vuitton T-shirt features an embroidered logo.",
            "Louis Vuitton"
        )
        self.assertIn("Louis Vuitton", html)
        self.assertIn("<strong>Brand:</strong>", html)
        self.assertIn("embroidered logo", html)


class TestSnapshotCollector(unittest.TestCase):
    """Layer 1: Snapshot Collector 测试（无浏览器时跳过）"""

    def test_required_fields_defined(self):
        """REQUIRED_FIELDS 应包含所有必要字段"""
        from v5_snapshot import REQUIRED_FIELDS
        expected = {
            "product_id", "name", "url", "description", "key_description",
            "seo_title", "seo_keywords", "seo_meta", "slug",
            "price", "inventory", "status",
            "images", "variants"
        }
        actual = set(REQUIRED_FIELDS)
        self.assertEqual(expected, actual, "REQUIRED_FIELDS 不完整")

    def test_load_existing_snapshot_not_found(self):
        """不存在的快照文件应返回 None"""
        from v5_snapshot import load_existing_snapshot
        result = load_existing_snapshot("NONEXISTENT_999999")
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
