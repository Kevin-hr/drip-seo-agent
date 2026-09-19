# -*- coding: utf-8 -*-
"""
Layer 3: Entity State Machine

状态机：
  OBSERVED → CANDIDATE → VERIFY → PASS / HOLD / CONFLICT

规则：
  - entity.status != PASS 时，禁止所有写后台操作
  - 每个字段独立追踪状态
  - 输出 Machine-Readable Decision JSON
"""

import json
import os
from typing import Optional, List, Dict, Any

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")


class EntityStatus:
    OBSERVED = "OBSERVED"
    CANDIDATE = "CANDIDATE"
    VERIFY = "VERIFY"
    PASS = "PASS"
    HOLD = "HOLD"
    CONFLICT = "CONFLICT"


FORBIDDEN_ACTIONS = {
    EntityStatus.OBSERVED: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description"],
    EntityStatus.CANDIDATE: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description"],
    EntityStatus.VERIFY: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description"],
    EntityStatus.HOLD: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description", "any_action"],
    EntityStatus.CONFLICT: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description", "any_action"],
}


def create_entity_state(product_id: str, snapshot: Dict[str, Any]) -> Dict[str, Any]:
    """
    从 Snapshot 创建初始 Entity State（OBSERVED）
    """
    state = {
        "product_id": product_id,
        "collected_at": snapshot.get("collected_at"),
        "entity": {
            "status": EntityStatus.OBSERVED,
            "brand": None,
            "product_name": None,
            "product_type": None,
            "colorway": None,
            "sku": None,
            "notes": []
        },
        "visual_observation": {
            "status": EntityStatus.OBSERVED,
            "base_color_visual": None,
            "garment_type": None,
            "logo_type": None,
            "logo_position": None,
            "sources": []  # 来源：vision_model / manual / search
        },
        "duplicate_check": {
            "status": EntityStatus.OBSERVED,
            "candidates": [],
            "evidence": []
        },
        "seo_payload": {
            "status": EntityStatus.OBSERVED,
            "data": None
        },
        "decision_log": []
    }

    # 从 snapshot 提取初始观察
    if snapshot.get("name"):
        state["entity"]["product_name"] = snapshot["name"]
        state["decision_log"].append({
            "action": "extract_name_from_snapshot",
            "value": snapshot["name"],
            "source": "snapshot"
        })

    return state


def update_entity_status(state: Dict[str, Any], new_status: str, reason: str = "") -> Dict[str, Any]:
    """
    更新实体状态，记录决策日志
    """
    if new_status not in [EntityStatus.OBSERVED, EntityStatus.CANDIDATE, EntityStatus.VERIFY,
                          EntityStatus.PASS, EntityStatus.HOLD, EntityStatus.CONFLICT]:
        raise ValueError(f"Invalid status: {new_status}")

    old_status = state["entity"]["status"]
    state["entity"]["status"] = new_status
    state["entity"]["notes"].append({
        "from": old_status,
        "to": new_status,
        "reason": reason,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z"
    })

    # 记录到 decision_log
    state["decision_log"].append({
        "action": "update_status",
        "from": old_status,
        "to": new_status,
        "reason": reason
    })

    return state


def can_perform_action(state: Dict[str, Any], action: str) -> bool:
    """
    检查是否允许执行某操作
    """
    status = state["entity"]["status"]

    if status == EntityStatus.PASS:
        return True

    forbidden = FORBIDDEN_ACTIONS.get(status, [])
    if "any_action" in forbidden:
        return False

    return action not in forbidden


def generate_machine_readable_decision(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    生成机器可读的决策输出（供 ChatGPT Entity Resolver 或本地 Agent 使用）
    """
    status = state["entity"]["status"]

    decision = {
        "product_id": state["product_id"],
        "entity_status": status,
        "decision": "HOLD" if status != EntityStatus.PASS else "PROCEED",
        "allowed_actions": [] if status != EntityStatus.PASS else ["rename_product", "change_url", "write_sku", "publish_seo", "update_description"],
        "forbidden_actions": FORBIDDEN_ACTIONS.get(status, []) if status != EntityStatus.PASS else [],
        "evidence_summary": {
            "visual_observation": state["visual_observation"],
            "duplicate_check": state["duplicate_check"],
        },
        "next_steps": _get_next_steps(state)
    }

    return decision


def _get_next_steps(state: Dict[str, Any]) -> List[str]:
    """
    根据当前状态生成下一步建议
    """
    status = state["entity"]["status"]
    steps = []

    if status == EntityStatus.OBSERVED:
        steps.append("Call Vision Observer to extract visual fingerprint")
        steps.append("Search for official product entity")

    elif status == EntityStatus.CANDIDATE:
        steps.append("Cross-verify with external sources (StockX, GOAT, brand site)")
        steps.append("Check SKU against known database")

    elif status == EntityStatus.VERIFY:
        steps.append("Request human review for ambiguous fields")
        steps.append("Gather additional evidence")

    elif status == EntityStatus.PASS:
        steps.append("Generate SEO payload")
        steps.append("Apply transactional update")

    elif status == EntityStatus.HOLD:
        steps.append("Wait for human decision")

    elif status == EntityStatus.CONFLICT:
        steps.append("Resolve conflicting evidence")
        steps.append("Escalate to human review")

    return steps


def save_entity_state(state: Dict[str, Any], product_id: str) -> str:
    """
    保存 Entity State 到 JSON 文件
    """
    path = os.path.join(OUT, f"entity_state_{product_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    return path


def load_entity_state(product_id: str) -> Optional[Dict[str, Any]]:
    """
    加载已有 Entity State
    """
    path = os.path.join(OUT, f"entity_state_{product_id}.json")
    if os.path.isfile(path):
        return json.load(open(path, encoding="utf-8"))
    return None


if __name__ == "__main__":
    # 测试
    test_snapshot = {
        "product_id": "123456",
        "name": "Louis Vuitton Embroidery T-Shirt Black",
        "collected_at": "2026-09-18T02:00:00Z",
        "images": [],
        "variants": []
    }

    state = create_entity_state("123456", test_snapshot)
    print(json.dumps(state, indent=2, ensure_ascii=False))

    # 测试状态转换
    state = update_entity_status(state, EntityStatus.CANDIDATE, "Initial candidate from name extraction")
    print("\nAfter CANDIDATE:")
    print(json.dumps(state["entity"], indent=2, ensure_ascii=False))

    # 测试权限检查
    print(f"\nCan rename? {can_perform_action(state, 'rename_product')}")
    print(f"Can publish SEO? {can_perform_action(state, 'publish_seo')}")
