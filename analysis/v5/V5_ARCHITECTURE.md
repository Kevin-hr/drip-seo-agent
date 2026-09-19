# V5 Architecture — SEO-PDP Pipeline v5 架构文档

> 版本：V5.0
> 日期：2026-09-18
> 状态：架构迁移完成，测试通过（29/29）

---

## 一、核心设计原则

**没有足够证据确认 Exact Product Entity，就没有资格修改商品。**

这一条规则写死在代码里，不是 prompt 建议，不是最佳实践——是硬约束。

```python
if entity.status != "PASS":
    raise PermissionError("ENTITY_NOT_VERIFIED — no write operations allowed")
```

---

## 二、五层架构

```
┌─────────────────────────────────────────────────────┐
│                 Layer 5: Transactional Writer        │
│   PLAN → VALIDATE → APPLY → VERIFY → COMMIT/ROLLBACK │
├─────────────────────────────────────────────────────┤
│                 Layer 4: PDP Generator               │
│   仅在 PASS 状态下生成 SEO Payload                   │
├─────────────────────────────────────────────────────┤
│              Layer 3: Entity State Machine           │
│   OBSERVED → CANDIDATE → VERIFY → PASS/HOLD/CONFLICT │
├─────────────────────────────────────────────────────┤
│                Layer 2: Vision Observer              │
│   只负责"看"图片，不决策颜色名/品牌/型号             │
├─────────────────────────────────────────────────────┤
│                Layer 1: Collector                    │
│   get_product_snapshot() — 一次性获取完整事实快照    │
└─────────────────────────────────────────────────────┘
```

### Layer 1: Collector（`v5_snapshot.py`）

**职责**：从 mrshopplus 后台一次性抓取商品完整快照。

**输入**：`product_id`（字符串）

**输出**：`product_snapshot.json`，包含：
- `product_id`, `name`, `images`, `description`, `key_description`
- `seo_title`, `seo_keywords`, `seo_meta`, `slug`
- `price`, `inventory`, `status`
- `variants`, `timestamp`, `source`

**硬规则**：
- 缺失任何必填字段 → 抛出 `ValueError("SNAPSHOT_INCOMPLETE")` → STOP
- 不调用 ChatGPT，不调用 Vision，不推断任何内容

### Layer 2: Vision Observer（`v5_vision.py`）

**职责**：对图片进行视觉观察，输出 Visual Fingerprint。

**输入**：图片 URL 列表

**输出**：
```json
{
  "image_count": 12,
  "urls": ["...", "..."],
  "observations": [],
  "uncertain_features": [],
  "vision_model": "openai-gpt4o"
}
```

**硬规则**：
- 禁止输出 `official_colorway`、`sku`、`brand`、`model`
- 只输出视觉观察结果（如 `base_color_visual: "light blue"`）
- 所有不确定项放入 `uncertain_features`

### Layer 3: Entity State Machine（`v5_entity_state.py`）

**职责**：维护商品实体状态，驱动决策流。

**状态机**：

```
OBSERVED ──→ CANDIDATE ──→ VERIFY ──→ PASS
                                      │
                          ┌───────────┼───────────┐
                          ↓           ↓           ↓
                        HOLD      CONFLICT    (继续)
```

**状态含义**：
| 状态 | 含义 | 允许操作 |
|------|------|----------|
| OBSERVED | 已收集数据，未做推断 | 无 |
| CANDIDATE | 有候选实体，需交叉验证 | 无 |
| VERIFY | 需要外部证据确认 | 无 |
| **PASS** | 所有字段已验证 | 全部 |
| HOLD | 暂停，等待人工裁决 | 无 |
| CONFLICT | 发现矛盾证据 | 无 |

**硬规则**：
```python
FORBIDDEN_ACTIONS = {
    HOLD: ["rename_product", "change_url", "write_sku", "publish_seo", "any_action"],
    CONFLICT: ["rename_product", "change_url", "write_sku", "publish_seo", "any_action"],
    VERIFY: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description"],
    CANDIDATE: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description"],
    OBSERVED: ["rename_product", "change_url", "write_sku", "publish_seo", "update_description"],
}
```

### Layer 4: PDP Generator（`v5_pdp_generator.py`）

**职责**：在 entity status == PASS 时生成 SEO Payload。

**输入**：Entity State（PASS 状态）

**输出**：
```json
{
  "product_id": "...",
  "product_name": "Louis Vuitton Embroidery T-Shirt Black",
  "slug": "louis-vuitton-embroidery-t-shirt-black",
  "seo_title": "...",
  "seo_meta": "...",
  "keywords": [...],
  "key_description": "...",
  "schema": {...},
  "standard_version": "V4.4",
  "entity_status_at_generation": "PASS"
}
```

**硬规则**：
- 非 PASS 状态 → 抛出 `PermissionError`
- 必须引用 `V4.4` 标准，不可使用过时标准

### Layer 5: Transactional Writer（`v5_writer.py`）

**职责**：以事务方式写入后台，保证原子性。

**流程**：
1. **PLAN** — 生成变更 diff（immutable plan_id）
2. **VALIDATE** — 检查 entity_status == PASS、hash 未变
3. **APPLY** — 调用 playwright 写入后台
4. **VERIFY** — 读回比对，确认写入正确
5. **COMMIT** / **ROLLBACK**

**硬规则**：
- 任意一步失败 → ROLLBACK
- 后台读取与预期不一致 → ROLLBACK
- 不允许直接调用 saveModify API

---

## 三、MCP 工具设计

| 工具名 | 权限 | 说明 |
|--------|------|------|
| `get_product_snapshot` | 只读 | Layer 1 入口 |
| `observe_images` | 只读 | Layer 2 入口 |
| `create_entity_state` | 只读 | Layer 3 入口 |
| `prepare_v44_plan` | 只读 | Layer 4 入口，仅生成计划 |
| `validate_plan` | 只读 | Layer 5 前置校验 |
| `execute_plan` | 写操作 | 唯一写入口，强制 PASS 检查 |
| `verify_frontend` | 只读 | 前台验证 |
| `rollback_pdp_update` | 写操作 | 回滚写入 |

---

## 四、KPI 指标体系

禁止以"完成数量"作为唯一指标。

```
Processed    — 进入流水线的商品总数
PASS         — 实体验证通过的商品数
HOLD         — 暂停待裁决的商品数
VERIFY       — 需人工验证的商品数
Published    — 成功写入并验证的商品数
Rollback     — 触发回滚的商品数
Entity_Error — 实体识别错误的商品数
```

**目标**：Published / Processed ≥ 95%，Rollback ≈ 0，Entity_Error ≈ 0

---

## 五、文件结构

```
analysis/v5/
├── v5_config.py            # 配置、常量、状态定义
├── v5_snapshot.py          # Layer 1: Collector
├── v5_vision.py            # Layer 2: Vision Observer
├── v5_entity_state.py      # Layer 3: Entity State Machine
├── v5_pdp_generator.py     # Layer 4: PDP Generator
├── v5_writer.py            # Layer 5: Transactional Writer
├── v5_orchestrator.py      # 主调度器
├── test_v5.py              # 单元测试（29 tests）
├── migrate_v4_to_v5.py     # V4→V5 迁移脚本
├── README.md               # 本文档
└── outputs/                # 运行时输出
    ├── entity_state_*.json
    ├── decision_*.json
    ├── snapshot_*.json
    └── kpi.json
```

---

## 六、下一步

1. **接入 ChatGPT Vision** — Layer 2 从 Placeholder 升级为真实多模态调用
2. **接入 ChatGPT Entity Resolver** — Layer 3 的 `_resolve_entity` 方法调用 LLM 做交叉验证
3. **建立 MCP Server** — 暴露 8 个工具，配置权限边界
4. **Thom Browne 模拟跑通** — 第一阶段验证后执行
5. **生产就绪报告** — 通过模拟后输出 PRODUCTION_READINESS_REPORT.md
