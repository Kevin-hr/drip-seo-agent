---
id: seo-core.01-product-identity
capability: product-identity
stage: 1
order: 1
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
answers: "supplier 给我的到底是什么？"
input_contract:
  supplier_title: string
  supplier_images: string[]
  supplier_sku: string
  declared_fields: object
output_contract:
  identity_status: PASS | HOLD | VERIFY
  identity:
    brand: string
    model: string
    product_type: string
    colorway: string
    collection: string|null
    official_product_name: string
    official_sku: string|null
  candidate_sources: array
  conflicts: string[]
  confidence: high | medium | low
  decision_note: string
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - docs/case-studies/PRADA_78_PREFLIGHT_CASE.md (branch codex/drip-seo-agent-work-2026-09-19)
  - docs/case-studies/PRADA_BATCH_LEARNINGS.md (branch codex/drip-seo-agent-work-2026-09-19)
  - docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md (this branch)
  - standards/agent/AGENT_CONTRACT_V2.0.md
  - 工作区 BLOCKED.md（Air Jordan 1 / 106 款，未入 git）
test_cases: [TC-001, TC-003, TC-004, TC-008, TC-010]
---

# 01 · Product Identity

## 0. 这个能力存在的唯一理由

供应商给的东西**不是商品**，是**候选**。

```text
供应商标题  Prada Logo T-Shirt-DC2
供应商标题  Crewneck T-Shirt
供应商标题  Hellstar Sport Hoodie-2223
供应商标题  Air Jordan 1 Low tenis
```

这四行没有一行是商品身份。它们分别是"带批次后缀的名字""没有品牌的名字""带数字后缀的名字""供应商口语"。

Prada 案例的原话（`PRADA_78_PREFLIGHT_CASE.md` §What worked 2）：

> Images were used to compare products and describe visible construction. They were not sufficient to promote a folder name, supplier number or visual colour guess into an official product identity or verified SKU.

```text
RULE-ID: ID-00
IF 输入只有供应商字段（标题 / 图片 / 供应商 SKU）
THEN 只能生成候选，不得生成身份
OUTPUT HOLD
```

---

## 1. 输入契约

```text
supplier_title    : string    供应商给的名字（不可信）
supplier_images   : string[]  当前后台图片集（顺序即事实）
supplier_sku      : string    供应商码（不可信，永不作为 SKU）
declared_fields   : object    后台当前的其他字段（价格/分类/规格等，不改）
```

```text
RULE-ID: ID-01
IF 任何身份结论只由 supplier_* 字段支撑
THEN 该结论非法
OUTPUT HOLD
```

---

## 2. 输出契约

```text
identity_status : PASS | HOLD | VERIFY
identity        : { brand, model, product_type, colorway, collection,
                    official_product_name, official_sku }
candidate_sources : [{ tier, source_name, url, product_name, colorway, sku,
                       exact_entity_match, accessed_at }]
conflicts       : string[]    身份关键字段的冲突项
confidence      : high | medium | low
decision_note   : string      必填，禁止为空
```

`identity_status` 三值的分工：

```text
PASS   : 所有身份关键维度都有 Tier 1–4 证据且互不冲突
VERIFY : 证据已足够指向一个实体，但还缺最后一个可判定字段（下一步补证）
HOLD   : 存在冲突，或存在多个可能实体，或关键维度无 Tier 1–4 证据
```

---

## 3. 判定规则

```text
RULE-ID: ID-02
IF brand / model / product_type / colorway 任一为空
THEN 身份不完整，不得进入第 2 阶段
OUTPUT HOLD

RULE-ID: ID-03
IF official_product_name 无法与任一 Tier 1–4 来源逐字对齐
THEN 停止
OUTPUT HOLD

RULE-ID: ID-04
IF 候选集中存在 ≥2 个可能实体且证据无法排除
THEN 不选"最像的"，停止
OUTPUT HOLD

RULE-ID: ID-05
IF colorway 只有视觉色，没有 Tier 1–4 证据
THEN 不得把视觉色提升为官方配色
OUTPUT HOLD

RULE-ID: ID-06
IF 联名方 / Collection 无法核实
THEN Collection 维度判为不可确认
OUTPUT HOLD

RULE-ID: ID-07
IF conflicts 非空
THEN 停止
OUTPUT HOLD

RULE-ID: ID-08
IF 图片名称或文件路径被当作型号 / SKU 来源
THEN 该证据无效（图片名不是身份）
OUTPUT HOLD
```

---

## 4. 来源阶梯（判定身份证据是否达标）

```text
Tier 1  Brand Official / Authorized Retailer        ← 可独立资格化
Tier 2  StockX                                      ← 可独立资格化
Tier 3  GOAT                                        ← 可独立资格化
Tier 4  Established Retailer (structured product data) ← 可独立资格化
Tier 5  Vertical Independent Retailer / Competitor   ← 只产生候选
Tier 6  Marketplace Seller Listing                   ← 只产生候选
Tier 7  Supplier Page / Supplier Catalog             ← 只产生候选
Tier 8  Image Recognition Only                       ← 只产生候选
```

```text
RULE-ID: ID-09
IF 某身份关键字段只有 tier >= 5 的证据
THEN 该字段视为未验证
OUTPUT HOLD
```

---

## 5. 真实失败形态库（症状 → 判定）

这些不是假想案例，全部来自已归档执行记录。

| 症状 | 真实字符串 | 命中规则 | 判定 |
|---|---|---|---|
| 批次后缀当标识 | `Prada Logo T-Shirt-DC2` `Chrome Hearts T-Shirt-DC4` | ID-03 | HOLD |
| 无品牌通用名 | `Crewneck T-Shirt` `Embroidery Logo T-Shirt` | ID-02 | HOLD |
| 纯数字后缀当型号 | `Hellstar Sport Hoodie-2223` `Hellstar Sport Hoodie 8807` | ID-03 | HOLD |
| 供应商口语 | `Air Jordan 1 Low tenis`（西语"球鞋"） | ID-03 | HOLD |
| 联名方不可核实 | `liv X Air Jordan 1 High Grey`（"liv X" 不存在） | ID-06 | HOLD |
| 图片与配色名不符 | 名 `Bleached Coral`，主图无该特征 | ID-05 | HOLD |
| 只有品牌+品类 | `Prada T-Shirt` | ID-02 | HOLD |
| 排版缺陷 | `Loro PianaT-Shirt` | ID-03 | HOLD |

出处：`.sandbox/state/runs/t-shirts-first-30-2026-09-01/run.json`、`dripops/dist/data/runs/hellstar-hoodies-2026-09-02/run.json`、工作区 `BLOCKED.md`。

---

## 6. 本能力的两条铁律

```text
铁律一：供应商标题不存在"基本可信"这个档位。
        它只有"完全不可信"和"已被更高层来源推翻"两种状态。

铁律二：包装成商品的供应商数据仍然不是商品。
        "Prada Logo T-Shirt-DC2" 看起来像商品名，但它和 "Crewneck T-Shirt"
        在证据层面是同一等级：都不构成身份。
```

Prada 案例给出的可复用结论：

> 库存状态必须在执行前立即重新读取，绝不能从较早的 manifest 推断。

```text
RULE-ID: ID-10
IF 身份结论来自缓存 / 旧清单 / 上一轮 run
THEN 必须重新取证
OUTPUT VERIFY
```

---

## 7. 与下一阶段的接口

```text
本能力 PASS  →  进入 02-sku-verification
本能力 HOLD  →  进入 04-hold-decision；输出不得进入 05
本能力 VERIFY →  补证后重跑本能力，不得跳过
```

一个刻意的实现选择（诊断优先）：

```text
即使本能力 HOLD，02 与 03 仍会被**评估**，目的是在同一次 HOLD 报告里
列出全部待补缺口（例如 TC-003 一次列出 7 个原因码），而不是让人反复试。
但 02 / 03 的输出**不得**被 05 使用 —— 只有全链路 PASS 才允许生成。
```

参考实现：`tests/run-core-tests.mjs` 中 `stageProductIdentity()`。
