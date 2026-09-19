# -*- coding: utf-8 -*-
"""
V5 架构文档 — 第一性原理重构

## 核心原则

**没有足够证据确认 Exact Product Entity，就没有资格修改商品。**

## 架构分层

| Layer | 职责 | 工具 | 输出 |
|-------|------|------|------|
| 1 | Collector | `get_product_snapshot()` | 完整商品事实快照 |
| 2 | Vision Observer | `observe_images()` | Visual Fingerprint |
| 3 | Entity Resolver | `create_entity_state()` | Entity State (OBSERVED/CANDIDATE/VERIFY/PASS/HOLD/CONFLICT) |
| 4 | PDP Generator | `generate_seo_payload()` | SEO Payload JSON |
| 5 | Transactional Writer | `run_transaction()` | COMMIT / ROLLBACK |

## 状态机

```
OBSERVED → CANDIDATE → VERIFY → PASS / HOLD / CONFLICT
```

### 规则
- `entity.status != PASS` 时，禁止所有写后台操作
- 每个字段独立追踪状态
- 输出 Machine-Readable Decision JSON

## 文件结构

```
v5/
├── v5_config.py              # 配置、常量、状态定义
├── v5_snapshot.py            # Layer 1: Collector
├── v5_vision.py              # Layer 2: Vision Observer
├── v5_entity_state.py        # Layer 3: Entity State Machine
├── v5_pdp_generator.py       # Layer 4: PDP Generator
├── v5_writer.py              # Layer 5: Transactional Writer
├── v5_orchestrator.py        # 主调度器
├── README.md                 # 本文档
└── outputs/                  # 输出目录
    ├── snapshot_{pid}.json
    ├── entity_state_{pid}.json
    ├── seo_payload_{pid}.json
    ├── decision_{pid}.json
    └── pipeline_log.txt
```

## 迁移策略

### 已有商品
- 刺绣批次（LV Embroidery）：2 款已 PASS（T 恤），1 款 HOLD（Shorts）
- 迁移方式：创建 entity_state.json，标记历史决策日志

### 新商品
- 从 Layer 1 开始全新流程
- 每个阶段独立验证，不允许跳过

## KPI 追踪

不要只统计"今天完成 30 款"，应同时追踪：
- Processed（处理数）
- PASS（通过验证数）
- HOLD（暂停待裁决数）
- VERIFY（需人工验证数）
- Published（成功发布数）
- Rollback（回滚数）
- Entity Error（实体错误数）

示例：
```
今日处理：30
PASS：21
HOLD：6
VERIFY：3
成功发布：21
错误写入：0
Rollback：0
```

**21 个正确 > 30 个看起来完成。**

## 设计决策

### 为什么不用 AI 猜颜色？
因为"猜"是概率判断，不是事实。
颜色判定必须来自：
1. 多模态模型观察（Visual Observation）
2. 官方来源验证（Official Colorway）
3. 两者一致才 PASS

### 为什么写后台需要事务？
因为"写错"比"不写"更危险。
事务保证：
- 写前有 PLAN（diff）
- 写后有 VERIFY（读回比对）
- 不一致则 ROLLBACK

### 为什么要把职责拆开？
因为"一个 Agent 同时做观察、推断、命名、SEO、写后台、发布"必然出错。
每层只做一件事，出错时容易定位。

## 下一步

1. 接入 ChatGPT Vision API（Layer 2）
2. 接入 ChatGPT Entity Resolver（Layer 3）
3. 实现 MCP Server（工具暴露）
4. 建立 KPI Dashboard
"""

import json
import os

if __name__ == "__main__":
    print(__doc__)
