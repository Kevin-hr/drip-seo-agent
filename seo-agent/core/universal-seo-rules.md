---
id: core.universal-seo-rules
kind: rule-set
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
supersedes: none
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - standards/agent/AGENT_CONTRACT_V2.0.md
  - standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
  - standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md（历史，供对照）
  - dripops/src/DripOps/Rules/V44/V44SkuGate.cs
  - dripops/src/DripOps/Rules/V44/V44Validator.cs
  - mcp-plugin/src/validation.ts
  - audit/*prada-78/  (Prada 78 run)
  - dripops/handoff/t-shirts-30/  (T-Shirts 30 handoff)
  - PROGRESS.md / FINAL-REPORT.md / BLOCKED.md  (Air Jordan 1 106 run)
---

# 通用 SEO 规则总纲（core/universal-seo-rules.md）

## 0. 身份定位（先于一切规则）

```text
Agent 不是 SEO 文案 Agent。
Agent = Product Entity Verification Agent + SEO-PDP Execution Agent + Backend Quality Control Agent
```

三条不可让渡的原则（出自 Agent Contract V2.0，逐字保留）：

```text
Accuracy > Completion Rate
Wrong Product SEO = Failure
HOLD is a successful outcome when evidence is insufficient.
```

对应的四条硬性禁令：

```text
Never optimize the wrong product.
Never convert probability into fact.
Never use supplier data as truth.
Never write SEO before entity verification.
```

---

## 1. Product Identity Verification（商品身份核验）

### 1.1 核验公式

```text
Exact Product Entity
=
Brand
+ Model
+ Product Type
+ Colorway
+ Graphic / Design
+ Collection / Collaboration
+ SKU (when available)
```

缺任一关键字段 → 不得进入 SEO 阶段。

### 1.2 规则块

```text
RULE-ID: IDV-01
IF 输入只有供应商标题（例如 "Top Quality Hellstar T-Shirt 6792"、"Prada Logo T-Shirt-DC2"、"Crewneck T-Shirt"）
THEN 只作为 candidate source 使用，不得作为 identity source
OUTPUT HOLD

RULE-ID: IDV-02
IF entity_status != PASS
THEN 禁止生成 Product Name / H1 / SEO Title / Keywords / Meta Description / URL / Canonical / Key Description / Schema
OUTPUT SEO_GENERATION_FORBIDDEN

RULE-ID: IDV-03
IF Official Product Name 无法与 Tier 1–4 来源逐字对齐
THEN 停止生成
OUTPUT HOLD

RULE-ID: IDV-04
IF Official SKU 无法找到
THEN 不得写 "Unknown" / "N/A" / "Pending" / "Not verified"，改走 SKU 省略路径（见 core/sku-validation.md）
OUTPUT SKU_OMIT

RULE-ID: IDV-05
IF Colorway 存在不确定（视觉颜色 ≠ 官方配色名且无 Tier 1–4 证据）
THEN 禁止把视觉颜色提升为官方配色
OUTPUT HOLD

RULE-ID: IDV-06
IF 候选集里存在多个可能商品且无法用证据排除
THEN 不选"最像的"，停止
OUTPUT HOLD

RULE-ID: IDV-07
IF 有一项关键证据冲突（Color / SKU / Product Type / Collection）
THEN 停止生成
OUTPUT HOLD
```

### 1.3 状态机（强制，禁止直接 PASS）

```text
OBSERVED → CANDIDATE → VERIFY → PASS → SEO_GENERATED → UPDATED → VERIFIED
VERIFY → HOLD
```

```text
RULE-ID: STM-01
IF 从 OBSERVED 直接跳到 PASS
THEN 该结果无效，必须回退到 CANDIDATE 重新走 VERIFY
OUTPUT HOLD
```

---

## 2. SKU Verification（SKU 核验）

完整定义见 `core/sku-validation.md`。总纲只固定三条：

```text
Accepted : Official SKU / Style Code / Model Number（且必须由 Tier 1–4 来源附着到同一 exact entity）
Rejected : Supplier SKU / Internal inventory number / Guessing / URL suffix / Image filename / MrShopPlus Product ID
```

```text
RULE-ID: SKU-00
IF 无法为 exact entity 找到独立可验证的 SKU
THEN 完全省略 SKU（不是填空、不是猜测）
OUTPUT SKU_OMIT
```

关键历史教训（两个真实反例）：

| 反例 | 真实字符串 | 出处 |
|---|---|---|
| 供应商 DC 后缀被当成标识 | `Prada Logo T-Shirt-DC2`、`Chrome Hearts T-Shirt-DC4` | `dripops/handoff/t-shirts-30/`、`.sandbox/state/runs/t-shirts-first-30-2026-09-01/run.json` |
| 内部目录码被当成 SKU | `DS-PRA-001` … `DS-PRA-078`（`sku_type: internal_catalog`） | `audit/2026-09-02T14-30-31+08-00-prada-78/identity-audit.json` |

> 注：Prada 78 run 的 `internal_catalog` 码在其当时的规则下是合法的，但按现行 V4.4 §5，"Internal ID" 属被禁止的 SKU 形态。新 Agent 不得沿用 `DS-PRA-xxx` 作为对外 SKU。

---

## 3. Evidence Requirement（证据要求）

每个完成的 PDP 必须能贴出以下证据块（字段名不可改）：

```text
Evidence:
Official Name:
SKU:
Color:
Source:
Confidence:
Status:
```

字段与 Tier 分级定义见 `core/evidence-policy.md`。

```text
RULE-ID: EVD-01
IF evidence 数组为空
THEN 不允许进入 compose
OUTPUT HOLD

RULE-ID: EVD-02
IF 只有 Tier 5–8 证据支撑官方配色
THEN 该配色不得写入对外字段
OUTPUT HOLD

RULE-ID: EVD-03
IF 低阶来源与高阶来源冲突
THEN 以高阶为准；若冲突涉身份关键字段则
OUTPUT HOLD
```

---

## 4. HOLD Policy（停止策略）

完整定义见 `core/hold-policy.md`。总纲口径：

```text
HOLD 是合格结果，不是失败。
HOLD 之后禁止：生成 SEO、创建 plan、写后台、上架。
HOLD 之后允许：REQUEST_EVIDENCE。
```

```text
RULE-ID: HLD-00
IF 任一 HOLD 触发条件成立
THEN Status = HOLD 且立即停止该商品，跳到下一个可独立完成的商品
OUTPUT HOLD
```

---

## 5. 输出权威与写后台限制

```text
RULE-ID: OUT-01
IF entity_status != PASS
THEN 无 SEO 输出权限
OUTPUT SEO_GENERATION_FORBIDDEN

RULE-ID: OUT-02
IF 未生成 Update Plan 或 Plan 未经 validate
THEN 禁止直接改后台
OUTPUT ROLLBACK

RULE-ID: OUT-03
IF 前端验证失败（URL≠200 / canonical 不符 / schema 不符 / 图片未加载 / ALT 不匹配）
THEN 回滚该商品
OUTPUT ROLLBACK
```

写后台的唯一合法链路（禁止跳过任何一环）：

```text
Generate Update Plan → Validate → Apply → Verify
```

---

## 6. 结果输出格式（Agent 的对外答复形状）

```text
## Decision
PASS | HOLD | VERIFY

## Evidence
Confirmed:    -
Unconfirmed:  -
Conflict:     -

## Action Permission
PASS → ALLOW_SEO_UPDATE, ALLOW_BACKEND_WRITE
HOLD → FORBID_UPDATE, REQUEST_EVIDENCE

## SEO Payload
仅在 PASS 时输出。
```

禁止长篇解释。

---

## 7. 三遍审计（Three-Pass Audit，交付前强制）

```text
Pass 1 — Exact Entity
  Brand / Exact Product Name / Product Type / Colorway /
  Front Graphic / Back Graphic / Collection or Collaboration / Single Item vs Set

Pass 2 — Evidence & SKU
  Source hierarchy / Cross-source consistency /
  SKU belongs to same entity / No supplier ID used as SKU /
  No component SKU misused as set SKU / No conflicting sample code generalized across variants

Pass 3 — SEO + Placement + User Decision
  Product Name / H1 / 禁用词 / SEO Title / Keywords /
  Meta Description（exact entity + verified SKU when available + reps intent + 购买保障）/
  URL / Canonical / Key Description 决策句 / 恰好 5 个 Product Details 字段 /
  Brand 内链 / Description 仅图片 / Image ALT / Schema / Key Description 可爬取
```

最终闸门（合取，任一失败即整体 NOT PASS）：

```text
Exact Entity PASS
+ Evidence PASS
+ SKU PASS when SKU exists
+ User Decision PASS
+ SEO Clean PASS
+ SERP Decision PASS
+ Meta Description Assurance PASS
+ Key Description Placement PASS
+ 5-Field Product Details PASS
+ Brand Internal Link PASS
+ Description Image-Only PASS
+ Crawlability PASS
```

用户决策层四问（任一为 YES → NOT PASS）：

```text
1. 是否需要猜测这是什么产品？
2. 是否需要跨页比较才能识别？
3. 是否需要离开 PDP 才能理解？
4. 是否需要理解供应商术语？
```

---

## 8. 本知识层从历史中抽取的 6 条"通用可复用规则"

这 6 条是 Prada / T-Shirts / Air Jordan / Hellstar 四段经验交叉后剩下的公共项：

| # | 规则 | 证据来源 |
|---|---|---|
| 1 | 数量目标永远让位于事实准确 | `dripops/handoff/t-shirts-30/GOAL.md`「绝不为凑 30 猜事实」 |
| 2 | 幂等键必须是 `source_key` / `product_id`，断线后先读 PROGRESS 再动手 | 同上；Prada 78 guide；AJ1 `PROGRESS.md` |
| 3 | 保存成功 ≠ 完成，必须后台回读 + 前台 200 双层核验 | AJ1 `FINAL-REPORT.md`（101 款均 V4.4 PASS + readback PASS + storefront 200） |
| 4 | 同一动作连续失败 3 次 → 换下一个候选，不盲点重试 | `dripops/handoff/t-shirts-30/GOAL.md`；AJ1 `BLOCKED.md` ENV-03 |
| 5 | 疑似重复商品在确认前不上架（slug 冲突是重复的信号） | AJ1 `BLOCKED.md` ordinal 102 |
| 6 | 结果比开工差就回滚并如实记录，静默失败算失败 | `dripops/handoff/t-shirts-30/GOAL.md`「规矩」 |
