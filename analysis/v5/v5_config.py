# -*- coding: utf-8 -*-
"""
SEO-PDP Pipeline V5 — First Principles Architecture

第一性原理：没有足够证据确认 Exact Product Entity，就没有资格修改商品。

架构：
  Layer 1: Collector — get_product_snapshot() → 完整商品事实快照
  Layer 2: Vision Observer — 只负责"看"，输出 Visual Observation
  Layer 3: Entity Resolver — 决定 entity 状态 (OBSERVED / CANDIDATE / VERIFY / PASS / HOLD / CONFLICT)
  Layer 4: PDP Generator — 仅在 PASS 状态下生成 SEO payload
  Layer 5: Transactional Writer — PLAN → VALIDATE → APPLY → VERIFY → COMMIT / ROLLBACK

状态机：
  entity.status ∈ {OBSERVED, CANDIDATE, VERIFY, PASS, HOLD, CONFLICT}
  forbidden_actions when status != PASS:
    - rename_product
    - change_url
    - write_sku
    - publish_seo
    - update_description

KPI:
  Processed | PASS | HOLD | VERIFY | Published | Rollback | Entity_Error
"""

import json
import os
from datetime import datetime
from typing import Optional

# ========== 配置 ==========
OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")
if not os.path.isdir(OUT):
    os.makedirs(OUT, exist_ok=True)

BRAND_LINKS = {
    "Louis Vuitton": "https://www.dripsneakers.org/Louis-Vuitton/",
    "Balenciaga": "https://www.dripsneakers.org/Balenciaga/",
    "Dior": "https://www.dripsneakers.org/Dior/",
    "Nike": "https://www.dripsneakers.org/Nike/",
    "Jordan": "https://www.dripsneakers.org/Jordan/",
}

BANNED_WORDS = [
    "Women", "Women's", "WMNS", "Men", "Men's",
    "GS", "PS", "TD", "Kids", "Unisex",
    "Top Quality", "PKGod", "Pkgod", "1:1",
    "Made in", "Country of Origin",
]

# ========== 状态定义 ==========
class EntityState:
    OBSERVED = "OBSERVED"      # 已收集原始数据，未做推断
    CANDIDATE = "CANDIDATE"    # 有候选实体，但证据不足
    VERIFY = "VERIFY"          # 需要外部验证（SKU、官方颜色名、实体搜索）
    PASS = "PASS"              # 所有字段已通过交叉验证
    HOLD = "HOLD"              # 暂停：等待人工裁决
    CONFLICT = "CONFLICT"      # 发现矛盾证据，需人工介入

    ALL = (OBSERVED, CANDIDATE, VERIFY, PASS, HOLD, CONFLICT)

from v5_entity_state import EntityStatus, FORBIDDEN_ACTIONS

__all__ = ["EntityStatus", "FORBIDDEN_ACTIONS", "BRAND_LINKS", "BANNED_WORDS"]
