# -*- coding: utf-8 -*-
"""
迁移脚本：将 V4 刺绣批次迁移到 V5 架构

已验证状态：
- 1_ts_black (536027468294169) — PASS，已上架
- 2_ts_white (536027468342801) — PASS，已上架
- 3_shorts_lightblue (536027552571158) — HOLD（颜色未验证）
- 4_shorts_dc2 (536027552602386) — HOLD（疑似重复品）
"""

import json
import os
from datetime import datetime

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")
os.makedirs(OUT, exist_ok=True)


def migrate_product(pid: str, decision: str, notes: list, entity_status: str = "PASS") -> dict:
    """
    迁移单个商品到 V5 Entity State 格式
    """
    state = {
        "product_id": pid,
        "collected_at": datetime.utcnow().isoformat() + "Z",
        "migrated_at": datetime.utcnow().isoformat() + "Z",
        "source": "v4_migration",
        "entity": {
            "status": entity_status,
            "brand": "Louis Vuitton",
            "product_name": None,
            "product_type": None,
            "colorway": None,
            "sku": None,
            "notes": [
                {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "from": "MIGRATION",
                    "to": entity_status,
                    "reason": notes[-1] if notes else "Initial migration"
                }
            ]
        },
        "visual_observation": {
            "status": "OBSERVED",
            "base_color_visual": None,
            "garment_type": None,
            "logo_type": None,
            "logo_position": None,
            "sources": ["v4_decision_log"]
        },
        "duplicate_check": {
            "status": "OBSERVED",
            "candidates": [],
            "evidence": []
        },
        "decision_log": [
            {
                "action": "migrate_from_v4",
                "decision": decision,
                "notes": notes,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        ]
    }

    path = os.path.join(OUT, f"entity_state_{pid}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)

    return state


def main():
    """
    迁移所有刺绣批次商品
    """
    migrations = [
        {
            "pid": "536027468294169",
            "decision": "PASS",
            "entity_status": "PASS",
            "notes": [
                "V4 batch: Black T-Shirt, color verified via Pillow chromatic analysis",
                "Frontend URL verified: /louis-vuitton-embroidery-t-shirt-black",
                "Backend 10/10 checks passed",
                "Published successfully"
            ]
        },
        {
            "pid": "536027468342801",
            "decision": "PASS",
            "entity_status": "PASS",
            "notes": [
                "V4 batch: White T-Shirt, color verified via Pillow chromatic analysis",
                "Frontend URL verified: /louis-vuitton-embroidery-t-shirt-white",
                "Backend 10/10 checks passed",
                "Published successfully"
            ]
        },
        {
            "pid": "536027552571158",
            "decision": "HOLD",
            "entity_status": "HOLD",
            "notes": [
                "V4 batch: Shorts #3 (原版)",
                "Color observation: light blue appearance (chromatic b-g=+9.7/+10.9)",
                "BUT: no official SKU verification, no visual confirmation of embroidery pattern",
                "Decision: User requested '只做 #3，按图集实际颜色命名'",
                "Migration status: HOLD — awaiting human confirmation of color name"
            ]
        },
        {
            "pid": "536027552602386",
            "decision": "HOLD",
            "entity_status": "HOLD",
            "notes": [
                "V4 batch: Shorts #4 (-DC2)",
                "Duplicate check: price=99, inventory=3996, description md5 identical to #3",
                "BUT: image perceptual hash 0 matches, color profile different (dark/navy)",
                "Decision: HOLD — suspected duplicate but evidence insufficient",
                "Recommendation: Human review required before any action"
            ]
        }
    ]

    results = []
    for m in migrations:
        state = migrate_product(m["pid"], m["decision"], m["notes"], m["entity_status"])
        results.append({
            "product_id": m["pid"],
            "decision": m["decision"],
            "entity_status": state["entity"]["status"],
            "path": os.path.join(OUT, f"entity_state_{m['pid']}.json")
        })
        print(f"Migrated {m['pid']}: {m['decision']} → {state['entity']['status']}")

    # 保存迁移摘要
    summary = {
        "migrated_at": datetime.utcnow().isoformat() + "Z",
        "source": "v4_embroidery_batch",
        "total": len(results),
        "pass": sum(1 for r in results if r["entity_status"] == "PASS"),
        "hold": sum(1 for r in results if r["entity_status"] == "HOLD"),
        "results": results
    }

    summary_path = os.path.join(OUT, "migration_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\nMigration summary: {summary['pass']} PASS, {summary['hold']} HOLD")
    print(f"Summary saved to: {summary_path}")


if __name__ == "__main__":
    main()
