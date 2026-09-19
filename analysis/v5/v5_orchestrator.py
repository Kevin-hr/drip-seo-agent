# -*- coding: utf-8 -*-
"""
SEO-PDP Pipeline V5 — Main Orchestrator

第一性原理：
  没有足够证据确认 Exact Product Entity，就没有资格修改商品。

架构：
  Layer 1: Collector (get_product_snapshot)
  Layer 2: Vision Observer (observe_images)
  Layer 3: Entity State Machine (create_entity_state, update_entity_status)
  Layer 4: PDP Generator (generate_seo_payload)
  Layer 5: Transactional Writer (run_transaction)

状态机：
  OBSERVED → CANDIDATE → VERIFY → PASS / HOLD / CONFLICT

KPI 追踪：
  Processed | PASS | HOLD | VERIFY | Published | Rollback | Entity_Error
"""

import json
import os
import sys
from datetime import datetime

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")
os.makedirs(OUT, exist_ok=True)

# 导入各层
from v5_config import EntityStatus
from v5_snapshot import get_product_snapshot, load_existing_snapshot
from v5_vision import observe_images
from v5_entity_state import (
    create_entity_state, update_entity_status,
    generate_machine_readable_decision, save_entity_state, load_entity_state
)
from v5_pdp_generator import generate_seo_payload
from v5_writer import run_transaction


class SEOPDPPipelineV5:
    """
    SEO-PDP V5 主调度器
    """

    def __init__(self):
        self.kpi = {
            "processed": 0,
            "pass": 0,
            "hold": 0,
            "verify": 0,
            "published": 0,
            "rollback": 0,
            "entity_error": 0
        }
        self.log_path = os.path.join(OUT, "pipeline_log.txt")

    def _w(self, msg: str):
        ts = datetime.utcnow().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        print(line)
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")

    def run(self, product_id: str, vision_model: str = "openai-gpt4o") -> dict:
        """
        运行完整流水线

        流程：
          1. Collector — 获取 Product Snapshot
          2. Vision — 观察图片，提取视觉指纹
          3. Entity Resolver — 确定实体状态（PASS/HOLD/VERIFY）
          4. PDP Generator — 生成 SEO Payload（仅 PASS）
          5. Transactional Writer — 写入后台 + 验证
        """
        self._w(f"{'='*60}")
        self._w(f"Starting V5 Pipeline for product_id={product_id}")
        self.kpi["processed"] += 1

        # ========== Layer 1: Collector ==========
        self._w("LAYER 1: Collector — Getting product snapshot")
        try:
            snapshot = get_product_snapshot(product_id)
            self._w(f"Snapshot collected: name={snapshot.get('name', '')[:50]!r}, images={len(snapshot.get('images', []))}")
        except Exception as e:
            self._w(f"FAIL: Snapshot collection failed: {e}")
            self.kpi["entity_error"] += 1
            return {"status": "FAIL", "error": str(e)}

        # ========== Layer 2: Vision Observer ==========
        self._w("LAYER 2: Vision Observer — Extracting visual fingerprint")
        image_urls = [img["url"] for img in snapshot.get("images", [])]
        try:
            visual_fp = observe_images(image_urls)
            self._w(f"Visual fingerprint created: {visual_fp['image_count']} images")
        except Exception as e:
            self._w(f"WARNING: Vision observation failed: {e}")
            visual_fp = {"image_count": len(image_urls), "urls": image_urls, "observations": [], "uncertain_features": []}

        # ========== Layer 3: Entity State Machine ==========
        self._w("LAYER 3: Entity State Machine — Determining entity status")

        # 加载或创建 Entity State
        entity_state = load_entity_state(product_id)
        if entity_state is None:
            entity_state = create_entity_state(product_id, snapshot)
            self._w("New entity state created (OBSERVED)")
        else:
            self._w(f"Existing entity state loaded: status={entity_state['entity']['status']}")

        # 更新视觉观察来源
        entity_state["visual_observation"]["status"] = EntityStatus.OBSERVED
        entity_state["visual_observation"]["sources"] = [f"vision_model:{vision_model}"]

        # Entity Resolver（简化版，实际应调用 ChatGPT）
        entity_decision = self._resolve_entity(product_id, entity_state, snapshot, visual_fp)
        entity_state = entity_decision["entity_state"]

        # 保存 Entity State
        save_entity_state(entity_state, product_id)

        # ========== Layer 4: PDP Generator ==========
        self._w("LAYER 4: PDP Generator — Generating SEO payload")

        if entity_state["entity"]["status"] != EntityStatus.PASS:
            self._w(f"HOLD: Entity status is {entity_state['entity']['status']}, not PASS")
            self.kpi["hold"] += 1

            # 生成 Machine-Readable Decision
            decision = generate_machine_readable_decision(entity_state)
            decision_path = os.path.join(OUT, f"decision_{product_id}.json")
            with open(decision_path, "w", encoding="utf-8") as f:
                json.dump(decision, f, ensure_ascii=False, indent=2)

            self._w(f"Decision saved to {decision_path}")
            return {
                "status": "HOLD",
                "entity_status": entity_state["entity"]["status"],
                "decision_path": decision_path
            }

        # PASS 状态，生成 SEO Payload
        try:
            seo_payload = generate_seo_payload(entity_state)
            self._w(f"SEO payload generated: name={seo_payload['product_name'][:50]!r}")
        except Exception as e:
            self._w(f"FAIL: SEO generation failed: {e}")
            self.kpi["entity_error"] += 1
            return {"status": "FAIL", "error": str(e)}

        # ========== Layer 5: Transactional Writer ==========
        self._w("LAYER 5: Transactional Writer — Applying changes")

        result = run_transaction(product_id, seo_payload, entity_state)
        self._w(f"Transaction result: {result['status']}")

        if result["status"] == "COMMITTED":
            self.kpi["published"] += 1
            self._w("SUCCESS: Product published")
        elif result["status"] == "ROLLED_BACK":
            self.kpi["rollback"] += 1
            self._w("ROLLBACK: Transaction rolled back")
        else:
            self.kpi["entity_error"] += 1
            self._w(f"FAIL: Transaction failed with status={result['status']}")

        # ========== 更新 KPI ==========
        self._save_kpi()

        return {
            "status": result["status"],
            "product_id": product_id,
            "kpi": self.kpi
        }

    def _resolve_entity(self, product_id: str, entity_state: dict, snapshot: dict, visual_fp: dict) -> dict:
        """
        Entity Resolver — 当前为简化版，实际应调用 ChatGPT API
        """
        self._w(f"Entity Resolver: Analyzing product {product_id}")

        current_status = entity_state["entity"]["status"]

        # 如果已有 PASS 状态，保持
        if current_status == EntityStatus.PASS:
            self._w("Entity already PASS, skipping resolver")
            return {"entity_state": entity_state, "decision": "KEEP_PASS"}

        # 检查名称是否包含品牌
        name = snapshot.get("name", "")
        has_brand = any(b in name for b in ["Louis Vuitton", "Balenciaga", "Dior", "Nike", "Jordan"])

        if not has_brand:
            entity_state = update_entity_status(entity_state, EntityStatus.HOLD, "No brand in product name")
            return {"entity_state": entity_state, "decision": "HOLD_NO_BRAND"}

        # 检查图片数量
        img_count = len(snapshot.get("images", []))
        if img_count < 3:
            entity_state = update_entity_status(entity_state, EntityStatus.VERIFY, f"Insufficient images: {img_count}")
            return {"entity_state": entity_state, "decision": "VERIFY_LOW_IMAGES"}

        # 默认：标记为 CANDIDATE，等待人工确认
        entity_state = update_entity_status(entity_state, EntityStatus.CANDIDATE, "Initial candidate, awaiting cross-verification")
        return {"entity_state": entity_state, "decision": "CANDIDATE_AWAITING_VERIFICATION"}

    def _save_kpi(self):
        """保存 KPI 到文件"""
        kpi_path = os.path.join(OUT, "kpi.json")
        with open(kpi_path, "w", encoding="utf-8") as f:
            json.dump(self.kpi, f, indent=2)
        self._w(f"KPI saved: {self.kpi}")

    def get_kpi(self) -> dict:
        """获取当前 KPI"""
        return self.kpi


def main():
    """主入口"""
    if len(sys.argv) < 2:
        print("Usage: python v5_orchestrator.py <product_id>")
        print("Example: python v5_orchestrator.py 536027468294169")
        sys.exit(1)

    product_id = sys.argv[1]
    pipeline = SEOPDPPipelineV5()
    result = pipeline.run(product_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
