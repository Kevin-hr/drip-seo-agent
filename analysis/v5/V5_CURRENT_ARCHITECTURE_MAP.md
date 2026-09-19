# V5 Current Architecture Map

> 生成日期：2026-09-18
> 目的：为 V5.1 LLM Evidence Layer 规划提供结构参考
> 约束：**禁止修改** 此文档中标记为 [核心] 的模块

---

## 一、文件总览

```
analysis/v5/
├── [核心] v5_config.py            — 状态常量 + 配置（EntityState, FORBIDDEN_ACTIONS）
├── [核心] v5_entity_state.py      — Layer 3: Entity State Machine
├── [核心] v5_pdp_generator.py     — Layer 4: PDP Generator
├── [核心] v5_writer.py            — Layer 5: Transactional Writer
├── [核心] v5_snapshot.py          — Layer 1: Collector
├── [可替换] v5_vision.py          — Layer 2: Vision Observer（Placeholder）
├── [可替换] v5_orchestrator.py    — 主调度器（调用各层）
├── test_v5.py                     — 单元测试（29/29 PASS）
├── migrate_v4_to_v5.py            — V4→V5 迁移脚本
├── outputs/                       — 输出目录
└── evidence/                      — 【新增】V5.1 LLM Evidence Layer
```

---

## 二、各模块详解

### Layer 1: v5_snapshot.py（Collector）

| 属性 | 说明 |
|------|------|
| **输入** | `product_id: str` |
| **输出** | `dict` — 完整商品事实快照 |
| **关键函数** | `get_product_snapshot(pid) -> dict` |
| **数据结构** | 见下方 `SnapshotSchema` |
| **守卫规则** | REQUIRED_FIELDS 缺任意一项 → `ValueError("SNAPSHOT_INCOMPLETE")` |
| **阻塞风险** | 无（只读，不涉及写入） |

**SnapshotSchema**（当前字段）：
```json
{
  "product_id": "536027468294169",
  "collected_at": "2026-09-18T...",
  "name": "Louis Vuitton Embroidery T-Shirt Black",
  "key_description": "...",
  "description_raw": ["<p>...</p>"],
  "images": [{"url": "...", "alt": "...", "position": 1}],
  "variants": [],
  "seo_tags": [],
  "seo_title": "...",
  "seo_keywords": "...",
  "seo_meta": "...",
  "slug": "...",
  "price": "99",
  "mkt_price": "...",
  "inventory": "100",
  "status": "上架"
}
```

**可插拔位置**：Layer 1 输出是 Layer 2/3 的输入源，接口已固化，不可改 schema。

---

### Layer 2: v5_vision.py（Vision Observer）

| 属性 | 说明 |
|------|------|
| **输入** | `image_urls: List[str]` |
| **输出** | `dict` — Visual Fingerprint |
| **关键函数** | `observe_images(urls) -> dict` |
| **数据结构** | 见下方 `VisionFingerprintSchema` |
| **阻塞风险** | ⚠️ **当前为 Placeholder**，`observations` 为空列表 |

**VisionFingerprintSchema**（当前字段）：
```json
{
  "image_count": 12,
  "urls": ["https://..."],
  "observations": [],           // ← 当前为空
  "uncertain_features": [],
  "vision_model": null,         // ← 当前为 null
  "raw_vision_output": null     // ← 当前为 null
}
```

**可插拔位置**：
- ✅ **整层可替换**：`v5_vision.py` 是 V5.1 主要改造目标
- ✅ 接口合约：`observe_images(urls) -> dict` 必须保持
- ✅ 下游消费：orchestrator 第 91-99 行消费此输出

---

### Layer 3: v5_entity_state.py（Entity State Machine）

| 属性 | 说明 |
|------|------|
| **输入** | `product_id: str`, `snapshot: dict` |
| **输出** | `dict` — Entity State |
| **关键函数** | `create_entity_state(pid, snap)`, `update_entity_status(state, new_status)` |
| **状态机** | OBSERVED → CANDIDATE → VERIFY → PASS / HOLD / CONFLICT |
| **守卫规则** | `entity.status != PASS` → 禁止所有写操作 |
| **阻塞风险** | 🔴 **禁止修改** |

**EntityStateSchema**（核心字段）：
```json
{
  "product_id": "...",
  "entity": {
    "status": "PASS",
    "brand": "Louis Vuitton",
    "product_name": "...",
    "product_type": "T-Shirt",
    "colorway": "Black",
    "sku": null,
    "notes": []
  },
  "visual_observation": {
    "status": "OBSERVED",
    "base_color_visual": null,
    "garment_type": null,
    "logo_type": null,
    "logo_position": null,
    "sources": []
  },
  "duplicate_check": { ... },
  "seo_payload": { ... },
  "decision_log": []
}
```

**可插拔位置**：
- ❌ **禁止修改**：状态机逻辑、FORBIDDEN_ACTIONS、can_perform_action()
- ⚠️ **可扩展**：visual_observation 字段内容（由 Layer 2 填充）

---

### Layer 4: v5_pdp_generator.py（PDP Generator）

| 属性 | 说明 |
|------|------|
| **输入** | `entity_state: dict`（要求 status=PASS） |
| **输出** | `dict` — SEO Payload |
| **关键函数** | `generate_seo_payload(state) -> dict` |
| **守卫规则** | status != PASS → `PermissionError` |
| **阻塞风险** | 🔴 **禁止修改** |

**SEO Payload Schema**：
```json
{
  "product_id": "...",
  "product_name": "Louis Vuitton Embroidery T-Shirt Black",
  "slug": "louis-vuitton-embroidery-t-shirt-black",
  "seo_title": "...",
  "meta_description": "...",
  "keywords": [...],
  "key_description": "...",
  "schema": {...},
  "model_type": "V5-PDP-Generator",
  "entity_status_at_generation": "PASS"
}
```

**可插拔位置**：❌ 禁止修改。但可以从 entity_state 读取更多字段（如果 Layer 3 扩展）。

---

### Layer 5: v5_writer.py（Transactional Writer）

| 属性 | 说明 |
|------|------|
| **输入** | `product_id: str`, `seo_payload: dict`, `entity_state: dict` |
| **输出** | `dict` — 事务结果 |
| **关键类** | `WriteTransaction` |
| **流程** | PLAN → VALIDATE → APPLY → VERIFY → COMMIT / ROLLBACK |
| **守卫规则** | entity.status != PASS → validate() 返回 False |
| **阻塞风险** | 🔴 **禁止修改** |

**事务结果 Schema**：
```json
{
  "product_id": "...",
  "status": "COMMITTED",
  "log": ["[HH:MM:SS] ..."],
  "plan": {...}
}
```

**可插拔位置**：❌ 禁止修改。APPLY 阶段的浏览器操作是硬依赖。

---

### 调度层: v5_orchestrator.py

| 属性 | 说明 |
|------|------|
| **职责** | 串联 Layer 1→2→3→4→5，管理 KPI |
| **关键方法** | `run(product_id, vision_model) -> dict` |
| **阻塞点** | Layer 3 的 `_resolve_entity()` 是当前简化版，**是改造目标** |

**当前 _resolve_entity() 逻辑**（需替换）：
```python
# 当前：仅检查品牌名和图片数量
if not has_brand: → HOLD
if img_count < 3: → VERIFY
else: → CANDIDATE  # 永远停在这里
```

**可插拔位置**：✅ **整层可改造**，替换 `_resolve_entity()` 为 LLM 驱动版本。

---

## 三、数据流图

```
product_id
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Layer 1: Collector                                   │
│   get_product_snapshot(pid)                          │
│   → snapshot (JSON)                                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ Layer 2: Vision Observer  ⚠️ PLACEHOLDER             │
│   observe_images(snapshot.images)                    │
│   → visual_fingerprint (JSON, observations=[])       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ Layer 3: Entity State Machine  🔒 CORE               │
│   create_entity_state(pid, snapshot)                 │
│   ← [VISION] fill visual_observation fields          │
│   _resolve_entity() ← ⚠️ 当前简化版，待替换          │
│   → entity_state (JSON) with status                  │
└────────────────────┬────────────────────────────────┘
                     │
              ┌──────┴──────┐
              │             │
        status=PASS    status≠PASS
              │             │
              ▼             ▼
┌───────────────────┐  ┌──────────────────┐
│ Layer 4: PDP      │  │ Decision Output  │
│ Generator         │  │ (HOLD/VERIFY)    │
│ generate_seo_     │  │ decision.json    │
│ payload(state)    │  │ 不写后台          │
└────────┬──────────┘  └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Layer 5: Transactional Writer  🔒 CORE               │
│   WriteTransaction(pid, payload, state)              │
│   PLAN → VALIDATE → APPLY → VERIFY → COMMIT/ROLLBACK │
└─────────────────────────────────────────────────────┘
```

---

## 四、V5.1 改造范围

### 不可改动（锁定）

| 文件 | 原因 |
|------|------|
| `v5_entity_state.py` | 状态机硬编码，禁止修改 |
| `v5_pdp_generator.py` | 权限闸门核心，禁止修改 |
| `v5_writer.py` | 事务性写入核心，禁止修改 |
| `v5_snapshot.py` | Collector 合约，禁止改 schema |
| `v5_config.py` | EntityStatus 常量，禁止改 |

### 可改造（V5.1 目标）

| 文件 | 改造内容 |
|------|----------|
| `v5_vision.py` | 替换 Placeholder → LLM Vision API |
| `v5_orchestrator.py` | 替换 `_resolve_entity()` → LLM Entity Resolver |
| **新增 `evidence/` 目录** | 新建证据层模块 |

### 新增文件（不触碰现有代码）

```
analysis/v5/evidence/
├── __init__.py
├── evidence_schema.py      # Evidence Schema 定义
├── vision_provider.py      # 多模态模型调用层
├── entity_resolver.py      # LLM 实体解析器
├── source_validator.py     # 外部来源验证
└── tests/
    ├── __init__.py
    ├── test_evidence_schema.py
    ├── test_vision_provider.py
    └── test_entity_resolver.py
```

---

## 五、接口合约（必须保持）

### Layer 2 输出合约（供 Layer 3 消费）

```python
# v5_vision.py 的 observe_images() 必须保持此签名
def observe_images(image_urls: List[str]) -> Dict[str, Any]:
    # 返回 dict，包含以下字段：
    # {
    #   "image_count": int,
    #   "urls": List[str],
    #   "observations": [...],          # 视觉观察结果
    #   "uncertain_features": [...],
    #   "vision_model": Optional[str],  # 使用哪个模型
    #   "raw_vision_output": Optional[dict]  # 原始输出（调试用）
    # }
```

### Layer 3 状态合约（必须保持）

```python
# v5_entity_state.py 的状态机常量
EntityStatus.OBSERVED, EntityStatus.CANDIDATE, EntityStatus.VERIFY
EntityStatus.PASS, EntityStatus.HOLD, EntityStatus.CONFLICT

# 权限检查函数
can_perform_action(state: dict, action: str) -> bool

# 状态更新函数
update_entity_status(state: dict, new_status: str, reason: str) -> dict
```

### Layer 4 输入合约（必须保持）

```python
# v5_pdp_generator.py 的 generate_seo_payload() 必须保持
def generate_seo_payload(entity_state: dict) -> dict:
    # 要求 entity_state["entity"]["status"] == "PASS"
```
