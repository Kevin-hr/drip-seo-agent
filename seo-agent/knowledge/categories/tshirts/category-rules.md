---
id: knowledge.categories.tshirts.category-rules
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [category:tshirts]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/handoff/t-shirts-30/{GOAL.md,PROGRESS.md,BLOCKED.md}
  - .sandbox/state/runs/t-shirts-first-30-2026-09-01/{run.json,events.jsonl,products/,facts/,evidence/}
  - .sandbox/state/runs/t-shirts-candidate-pool-2026-09-02/{run.json,category-snapshot.json,events.jsonl}
  - dripops/dist/data/runs/t-shirts-200-2026-09-07/run.json
  - dripops/schemas/product-facts.schema.json
  - dripops/standards/SEO-PDP-3.1.1.json / SEO-PDP-3.2.json
---

# T-Shirts 类目规则（knowledge/categories/tshirts/category-rules.md）

## 0. 这个类目为什么重要

T-Shirts 是**唯一一个把失败写清楚了的类目**。它的 `BLOCKED.md`、`PROGRESS.md`、真实后台标题集合，构成了 v1.0 里最有价值的"反面教材库"。

读者注意：本文件的数字口径必须以 `cases/tshirts-v4.4-case.md` 为准，禁止使用"30/30 完成"之类的说法。

---

## 1. 历史真实完成度（唯一正确口径）

```text
Historical success : 11 products
  PDP 3.1.1        :  9
  PDP 3.2          :  2
  V4.4 validation  :  0
  Target 30        :  Not completed
```

来源与独立核对：

```text
dripops/handoff/t-shirts-30/PROGRESS.md
  "2026-09-07 verified baseline: 11 distinct products."
  "PDP 3.1.1 verified: 9"
  "PDP 3.2 verified: 2 — 536027547297304/HZ3831 and 536027547266582/HZ3830"

独立复算（我于 2026-09-19 核对）
  runs/t-shirts-first-30-2026-09-01/products/      → 4 个商品
  runs/t-shirts-candidate-pool-2026-09-02/products/ → 7 个商品
  4 + 7 = 11，ID 无重叠  ✓
  其中 data-version="3.1.1" 的 9 个、data-version="3.2" 的 2 个  ✓
```

### 1.1 上游权威版本（2026-09-19 发现，位于 b2505b2）

本知识层的这段结论已有**仓库内的权威版本**，两者数字一致：

```text
文档   : docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md        (b2505b2, 7165 bytes)
基线   : reports/evidence/t-shirts-v3/verified-baseline.json   (b2505b2, 7757 bytes)
回归   : tests/tshirts-v3-lessons.mjs                          (b2505b2)
```

该文档还给出了 **11 个商品的真实名称与已验证 SKU**，以及计数推导：

```text
第一个 run（名为 "first 30"）: 30 个快照 → 4 个终态成功
候选池 run（200 个）         : +7 个终态成功
4 + 7 = 11  ✓
```

完整清单见本知识层 `FACTS-AS-OF-2026-09-19.md` §3.2。

```text
RULE-ID: TSC-COUNT-02
IF 需要 T-Shirts 的权威数字或商品清单
THEN 优先引用 b2505b2 上的上述三份文件（它们是仓库内权威版本）
     本文件与 cases/tshirts-v4.4-case.md 作为知识层摘要，不得与之冲突
OUTPUT PASS
```

```text
RULE-ID: TSC-COUNT-01
IF 需要报告 T-Shirts 进度
THEN 必须写 "11（9 × 3.1.1 + 2 × 3.2），V4.4 验证 0，30 目标未完成"
     禁止写 "30/30 完成"、"批量完成"、"已交付 30 款"
OUTPUT PASS
```

---

## 2. 供应商标题的 5 类噪声（本类目最核心的资产）

真实后台标题（逐字，全部来自 run 的 `categorySnapshot.products[].name`）：

```text
Prada Logo T-Shirt-DC2          Embroidery Logo T-Shirt-DC2
Loewe Embroidery Logo T-Shirt-DC2   Chrome Hearts Print T-Shirt-DC2
Givenchy Logo Print T-Shirt-DC2     Balenciaga Logo Print T-Shirt-DC2
Burberry Embroidery T-Shirt-DC2     Prada Pocket Black T-Shirt-DC2
Prada Pocket Appliqué T-Shirt-DC2   Prada Pocket T-Shirt-DC2
Crewneck T-Shirt-DC3            Crewneck T-Shirt-DC2
Chrome Hearts T-Shirt-DC4        Chrome Hearts T-Shirt-DC3
Chrome Hearts T-Shirt-DC2        Prada Logo T-Shirt
Prada T-Shirt                    Crewneck T-Shirt
Embroidery Logo T-Shirt          Loro PianaT-Shirt
```

### 噪声类型 1：DC 后缀当标识

```text
-DC2 / -DC3 / -DC4
```

```text
RULE-ID: TSC-NOISE-01
IF 标题以 -DC2 / -DC3 / -DC4 结尾
THEN 该后缀是供应商批次标记，必须剥离，且不得作为 SKU、不得作为型号、不得作为区分依据
OUTPUT HOLD
```

> 注意陷阱：剥离后缀后，`Prada Logo T-Shirt-DC2` 与 `Prada Logo T-Shirt` 会变成同名。
> **它们很可能就是同一个商品**（见噪声类型 4）。

### 噪声类型 2：与 DC 后缀成对出现的同款

真实成对样本：

```text
Prada Logo T-Shirt          ↔  Prada Logo T-Shirt-DC2
Chrome Hearts T-Shirt       ↔  Chrome Hearts T-Shirt-DC2
Burberry Embroidery T-Shirt ↔  Burberry Embroidery T-Shirt-DC2
Balenciaga Logo Print T-Shirt ↔ Balenciaga Logo Print T-Shirt-DC2
```

```text
RULE-ID: TSC-NOISE-02
IF 两件商品剥掉 DC 后缀后同名
THEN 按 core/identity-verification.md §7 判重复；在确认前两者都不得写 SEO
OUTPUT HOLD
```

### 噪声类型 3：无品牌通用名

```text
Crewneck T-Shirt
Embroidery Logo T-Shirt
```

```text
RULE-ID: TSC-NOISE-03
IF 标题不含品牌名
THEN Brand Match 失败，禁止进入 SEO 阶段
OUTPUT HOLD
```

### 噪声类型 4：无配色信息

```text
Prada T-Shirt          ← 有品牌，无配色、无型号
Loro PianaT-Shirt      ← 还缺一个空格
```

```text
RULE-ID: TSC-NOISE-04
IF 标题只有品牌 + Product Type，无配色/型号/印花描述
THEN Colorway 无法确定
OUTPUT HOLD
```

### 噪声类型 5：排版缺陷

```text
Loro PianaT-Shirt      ← 品牌与品类之间缺空格
```

```text
RULE-ID: TSC-NOISE-05
IF 标题存在排版缺陷（缺空格、全角半角混用）
THEN 不得直接采用为 Product Name，必须以官方名重建
OUTPUT HOLD
```

---

## 3. 类目特有的身份判断难点

T-Shirt 与鞋类的最大区别：**鞋类有货号可查，T-Shirt 常常没有。**

```text
鞋类（AJ1）  : 有稳定官方货号体系（IH0296-400），可交叉验证
T-Shirt      : 大量商品无官方货号 → 多数只能走 SKU_OMIT
```

```text
RULE-ID: TSC-SKU-01
IF T-Shirt 商品找不到 Tier 1-4 附着的官方货号
THEN 走 SKU_OMIT（省略 SKU），不得使用 DC 后缀或内部码
OUTPUT SKU_OMIT

RULE-ID: TSC-SKU-02
IF T-Shirt 商品有官方货号（如 536027547297304 对应的 HZ3831）
THEN 仍需 Tier 1-4 证据支持
OUTPUT VERIFY
```

历史实例的官方码：`HZ3830`、`HZ3831`（对应两个 3.2 商品）。

---

## 4. 类目的证据目录结构（可直接复用）

```text
runs/<run-id>/
├── run.json                 standardVersion / categoryAdminUrl / categoryPublicUrl
│                            categorySnapshot{total,published,unpublished,products[]}
├── events.jsonl             RUN_CREATED / CATEGORY_SNAPSHOT_SAVED / PRODUCT_CHECKPOINT
├── category-snapshot.json   后台分类页快照
├── products/<ProductID>.json   逐商品状态机
├── facts/<ProductID>.facts.json
└── evidence/
    ├── covers/<NN>-<ProductID>.<ext>          封面（序号对齐 run 内顺序）
    ├── details/<NN>-<ProductID>-<MM>.<ext>    细节图（每商品 2-4 张）
    ├── research/<brand>/<source>-<n>.<ext>    外部研究图（如 research/celine/grailed-3.jpg）
    └── selected/<ProductID>-<n>.<ext>         候选池选中图
```

```text
RULE-ID: TSC-EVD-01
IF 需要为 T-Shirt 建证据
THEN 按上述目录落盘，封面用 NN 序号对齐 run 内商品顺序
OUTPUT PASS
```

---

## 5. facts 层的字段与已知 schema 冲突

`dripops/schemas/product-facts.schema.json`：

```text
required : brand / modelName / primaryColorway / sku / productType / categoryPath /
           productIntro / imageMatchVerified(bool) / skuVerified(bool) / evidence(array, minItems 1)
optional : collection / style / material / designDetails / silhouette /
           upperDesign / signatureDetails / midsole / brandCategoryPath
evidence[] required : field / value / sourceUrl / sourceTier / verifiedAt
```

```text
RULE-ID: TSC-FACT-01
IF 走 SKU_OMIT 但 schema 要求 sku 非空（minLength 1）
THEN 必须在 run 层显式记录该冲突，不得用占位符骗过 schema
OUTPUT SKU_OMIT
```

真实观察到的 `sourceTier` 取值：

```text
T1_OFFICIAL_BRAND
FIRST_PARTY_BACKEND_VISUAL_AUDIT
```

---

## 6. 3.2 时代的验收口径（**已被 V4.4 取代，仅作历史参考**）

```text
历史口径（3.2）:
  HTTP 200 / Title / Meta 120–160 / Canonical /
  Product Name = H1 = PDP H2 / SKU / data-version="3.2" /
  PDP 内恰好 1 个 H2 和 1 个 Style 内链 / 图片存在
```

```text
RULE-ID: TSC-STD-01
IF 有人引用 "Meta 120–160" 或 data-version="3.2" 作为当前验收标准
THEN 该引用已过期
OUTPUT HOLD
```

V4.4 的口径见 `core/pdp-template-v4.4.md` 与 `core/quality-check.md`。

---

## 7. V4.4 修正清单（做 T-Shirts 时必须改的 6 处）

```text
1  版本标记     data-version="3.1.1"/"3.2"  →  data-standard="4.4"
2  H2 结构      允许"商品名做 H2"  →  只允许 1 个 <h2>Product Details</h2>，禁止重复商品名
3  Product Details 字段数   3.2 的 Style 内链风格  →  恰好 5 个 <li>，Brand 行承载唯一内链
4  内链          3.2 的 /T-Shirts/ 泛分类链接  →  Brand hub → 精确 model/分类 → 更大分类（优先级）
5  SKU          3.2 强制必须有 SKU  →  V4.4 允许 SKU_OMIT（无官方货号时省略）
6  Meta         不能沿用旧文案（含 real QC photos / 7–20 day delivery 类表达）
                →  固定模板：Shop {name} reps ({sku}) at Drip Sneakers with
                   QC photos, 30-day returns and 7–20 day shipping.
```

---

## 8. 重做 T-Shirts 的正确起点

```text
[ ] 第一个动作不是写 SEO，是重新建立 final run 并冻结名单
[ ] 冻结前先扫 T-Shirts 分类，确认当前真实总数（历史曾用 200 候选池）
[ ] 对 11 个已 verified 的商品：先判定其 3.1.1/3.2 产物能否原样迁移
    → 不能。必须按 V4.4 重建（H2 结构、5 字段、SKU 裁决都变了）
[ ] 对每个候选：先判 DC 后缀、先判成对重复、再进入身份核验
[ ] HOLD 的商品不占 30 的名额，但必须逐条留证
```

```text
RULE-ID: TSC-REDO-01
IF 声称 T-Shirts 30 已完成
THEN 必须存在 t-shirts-30-final-*/run.json 且含 30 个 FrontendVerified 商品
     以及 final-30-audit.json 的 30/30 通过记录
     这两份文件目前都不存在
OUTPUT HOLD
```
