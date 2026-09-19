# -*- coding: utf-8 -*-
"""
V5 Architecture Summary — 第一性原理重构完成

核心变更：
  - 从"AI 一条龙"改为"五层职责分离"
  - 状态机替代 soft confidence
  - Transactional writer 替代直接写入
  - KPI 从"完成数"改为"正确数"

文件位置：analysis/v5/

使用方法：
  python v5_orchestrator.py <product_id>

状态机：
  OBSERVED → CANDIDATE → VERIFY → PASS / HOLD / CONFLICT

禁止行为：
  entity.status != PASS 时，禁止所有写后台操作
"""
