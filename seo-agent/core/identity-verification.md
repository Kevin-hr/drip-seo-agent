---
id: core.identity-verification
kind: rule-set
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - standards/agent/AGENT_CONTRACT_V2.0.md#3 #4 #5 #6 #7
  - dripops/src/DripOps/Rules/V44/V44SnapshotCompleteness.cs
  - mcp-plugin/src/validation.ts (validateVisualObservation / validateVisualColorSeparation)
  - audit/*prada-78/identity-audit.json
  - BLOCKED.md (air-jordan-1-106-2026-09-18)
---

# 身份核验（core/identity-verification.md）

## 1. 输入与输出契约

```text
INPUT
  supplier_product        : 供应商标题 / 后台当前名称 / 图片集 / 现有字段
  visual_observation      : 视觉观察（只允许客观描述）
  candidate_sources[]     : 搜索得到的候选来源

OUTPUT
  entity_status           : PASS | HOLD | VERIFY
  exact_entity            : { brand, model, product_type, colorway, collaboration_or_collection }
  evidence[]              : 见 core/evidence-policy.md
  conflicts[]             : 身份关键字段的冲突列表
```

禁止的推理链（明确违规）：

```text
看到图片 → 猜品牌 → 猜款号 → 猜 SKU → 写 SEO
```

要求的推理链：

```text
Observe → Search → Compare → Verify → Decide → Execute
```

---

## 2. Stage 1 — Product Data Collection（快照采集）

必须读到以下字段才允许继续：

```text
Product ID / Current Product Name / Current URL / Current SKU / Supplier Code /
Category / Price / Inventory / Variants / Description / Key Description /
SEO Title / SEO Keywords / Meta Description / Images / Image URLs / Image ALT /
Existing Schema
```

```text
RULE-ID: IDV-SNAP-01
IF 以下四项任一缺失：Product Images | Existing Description | Current SEO Fields | Variants
THEN 停止执行
OUTPUT SNAPSHOT_INCOMPLETE
```

实现位置：`V44SnapshotCompleteness.Evaluate(ProductSnapshot)`，STOP 条件集合 `SnapshotCompleteness.StopConditions = [images, description, seo_fields, variants]`，`Complete = MissingStopConditions.Count == 0`。

运行时开关（事实披露）：`dripops/config/dripops.json` 中 `requireCompleteSnapshot` 默认 `false`（默认 bridge 报告模式，8812 端口强制）。Agent 不得因为开关是报告模式就跳过本规则。

---

## 3. Stage 2 — Visual Analysis（视觉分析）

视觉 Agent 只被允许陈述事实，禁止下身份结论。

关于"视觉颜色 ≠ 官方配色"：

```text
正确 :
  Visual: pale blue
  Official Colorway: UNVERIFIED

违规 :
  Visual: pale blue
  Official Colorway: pale blue
```

视觉输出格式（字段名固定）：

```json
{
  "visual_observation": {
    "brand_visible": "",
    "garment_type": "",
    "base_color_visual": "",
    "graphics": "",
    "construction": "",
    "special_features": ""
  },
  "uncertain_points": []
}
```

```text
RULE-ID: IDV-VIS-01
IF visual_observation 缺少 garment_type 或 base_color_visual
THEN 视觉证据无效
OUTPUT HOLD

RULE-ID: IDV-VIS-02
IF base_color_visual 命中 SKU / style code 形态（如 \b[A-Z]{1,3}\d{2,}[A-Z]?\d*\b 或 \b\d{5,}[- ]?\d{3,}\b）
THEN 视觉证据无效（视觉不得输出 SKU）
OUTPUT HOLD

RULE-ID: IDV-VIS-03
IF visual.base_color_visual 与 exact_entity.colorway 归一化后相同，且没有任何 Tier 1–4 证据支撑该 colorway
THEN 判定为 visual-leak，禁止继续
OUTPUT HOLD
```

实现位置：`mcp-plugin/src/validation.ts` → `validateVisualObservation()`、`validateVisualColorSeparation()`、`validateColorwayEvidence()`。

---

## 4. Stage 3 — Entity Search（来源优先级）

```text
Tier 1  Brand Official / Authorized Retailer
Tier 2  StockX
Tier 3  GOAT
Tier 4  Established Retailer with structured product data
Tier 5  Vertical Independent Retailer / Competitor
Tier 6  Marketplace Seller Listing
Tier 7  Supplier Page / Supplier Catalog
Tier 8  Image Recognition Only
```

```text
RULE-ID: IDV-SRC-01
IF 来源是 Tier 7 Supplier（含 yupoo / 供应商相册 / 1688 等）
THEN 只能作为 Candidate Source，永不作为 Identity Source
OUTPUT HOLD

RULE-ID: IDV-SRC-02
IF 只有 Tier 5–8 支撑某个身份关键字段
THEN 该字段视为 unverified
OUTPUT HOLD
```

历史证据：T-Shirts 30 run 的 30 个候选**全部**来自后台供应商标题，其中供应商标题形态不可用于身份判定（见第 6 节）。

---

## 5. Stage 4 — Exact Entity Comparison（逐维度比对）

每个维度必须独立给出结论：

```text
Brand Match
+ Product Name Match
+ Product Type Match
+ Colorway Match
+ Graphic Match
+ Collection Match
+ SKU Match
+ Single Item / Set Match
```

输出：

```json
{
  "entity_status": "PASS",
  "entity": {
    "brand": "",
    "product_name": "",
    "product_type": "",
    "colorway": "",
    "sku": ""
  }
}
```

```text
RULE-ID: IDV-CMP-01
IF 视觉匹配但存在 Color / SKU / Product Type / Collection 任一冲突
THEN 停止
OUTPUT HOLD

RULE-ID: IDV-CMP-02
IF exact_entity 的 brand / model / product_type / colorway 任一为空
THEN 裁决结构非法（代码层强制）
OUTPUT HOLD
```

实现位置：`V44SkuGate.Validate()` 要求 `exact_entity.{Brand,Model,ProductType,Colorway}` 非空。

---

## 6. 真实失败形态库（来自已归档执行记录，禁止重犯）

这 5 类形态全部出现在真实后台数据中，可作为 Agent 的"症状 → 判定"对照表。

| 症状 | 真实样例（后台原文） | 判定 | 出处 |
|---|---|---|---|
| DC 后缀当标识 | `Prada Logo T-Shirt-DC2`、`Chrome Hearts T-Shirt-DC3`、`Crewneck T-Shirt-DC2` | Supplier noise → 剥掉后缀后仍不构成身份 | `.sandbox/state/runs/t-shirts-first-30-2026-09-01/run.json` |
| 无品牌通用名 | `Crewneck T-Shirt`、`Embroidery Logo T-Shirt` | Product Name Match 失败 | 同上 |
| 同款成对重复（易致 slug 冲突） | `Prada Pocket Black T-Shirt` 与 `Prada Pocket Black T-Shirt-DC2` | 需先判定 EXACT_DUPLICATE / COLOR_VARIANT 再决定 | 同上 |
| 口语 / 外语噪声 | `Air Jordan 1 Low tenis`（tenis = 西语"球鞋"） | 无法锁定 exact entity | `BLOCKED.md` ordinal 68 |
| 联名方不可核实 | `liv X Air Jordan 1 High Grey`（"liv X" 非可核实联名方） | Collection Match 失败 | `BLOCKED.md` ordinal 67 |
| 图片与配色名不符 | 后台名 `Air Jordan 1 Retro High OG Bleached Coral`，主图无 Bleached Coral 特征 | Colorway conflict | `BLOCKED.md` ordinal 31 |
| 纯数字后缀当型号 | `Hellstar Sport Hoodie-2223`、`Hellstar Sport Hoodie 8807` | Supplier noise | `dripops/dist/data/runs/hellstar-hoodies-2026-09-02/run.json` |

---

## 7. 重复商品判定（Duplicate Rules）

```text
违规判定（禁止使用）:
  same price + same inventory + same description hash = duplicate

合法判定（必须同时满足）:
  Same physical product
  + Same design
  + Same colorway
  + Same construction
  + Same SKU/model evidence
```

输出枚举（固定四值）：

```json
{ "duplicate_status": "EXACT_DUPLICATE | COLOR_VARIANT | MODEL_VARIANT | VERIFY" }
```

```text
RULE-ID: IDV-DUP-01
IF 两个商品同名同配色且生成的 slug 完全相同
THEN 视为疑似重复，在确认前不写 SEO、不上架
OUTPUT HOLD
```

历史证据：AJ1 ordinal 102（`536027039236880`）与 ordinal 65（`536027079115024`）同名同配色，slug 均为 `air-jordan-1-high-og-nrg-not-for-resale-varsity-red`，后台保存被拒 → 判 HOLD，未上架。

---

## 8. 身份核验产出模板（Agent 必须按此格式回填）

```text
Identity Verification Record
  product_id        :
  source_key        :
  observed_name     :
  observed_images   : n
  candidates        : [ { tier, source_name, url, product_name, colorway, sku, exact_entity_match } ]
  exact_entity      : { brand, model, product_type, colorway, collaboration_or_collection }
  visual_observation: { garment_type, base_color_visual, graphics, construction }
  conflicts         : [ ]
  entity_status     : PASS | HOLD | VERIFY
  decision_note     : （必填，禁止为空）
```
