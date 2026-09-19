---
id: knowledge.brands.prada.category-rules
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada, category:sneakers, category:tshirts]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - shipping-audit/raw_categories.json（2026-09-15 全站抓取，213 分类）
  - shipping-audit/category_audit.csv（分类级判定表）
  - shipping-audit/raw_products.json（2026-09-15 抓取，1101 商品）
  - shipping-audit/product_audit.csv（商品级判定表）
  - shipping-audit/summary.json（gate_pass=false）
  - audit/2026-09-02T14-30-31+08-00-prada-78/evidence/public-prada-seo-pdp-audit.json
  - knowledge/brands/prada/live-inventory-2026-09-15.md（同批事实）
discovered: 2026-09-19
data_as_of: 2026-09-15
---

# Prada 类目规则（knowledge/brands/prada/category-rules.md）

> 本文件只写**已被 2026-09-15 全站抓取证实**的类目事实与由此派生的规则。
> 任何未在该次抓取中出现的分类页 SEO 字段（Title / Meta / H1 / Canonical）、
> 价格、库存、评价、筛选器状态，一律不在本文件断言，统一标 `HOLD`。

## 0. 一句话摘要

Prada 在线上是 **4 个分类 + 12 个商品**的结构，计数一致、分类均可见。
问题不在"数量"，而在**类目层级与归属语义**：品牌根分类是 Mixed（鞋 + 服饰），
一个鞋类商品身上挂着 `NEW CLOTHING`，一个服饰商品挂在 `Sneakers Under $100`，
以及一个商品的**面包屑父级不是 Prada**。

---

## 1. 已证实的分类结构（2026-09-15）

| 分类 | URL | reported | actual | 类型 | 纯/混 | 抓取器判定 |
|---|---|---|---|---|---|---|
| Prada | `/Prada` | 12 | 12 | MIXED | Mixed | `BLOCKED` — "Contains multiple target shipping groups: Clothing, Luxury Shoes" / Action: **"Do not bind; split to pure lower-level categories"** |
| Prada America's Cup Sneakers | `/Prada-Americas-Cup-Sneakers` | 5 | 5 | OTHER_SHOES | Pure | `Luxury Shoes` 可用 |
| Prada Collapse | `/Prada-Collapse` | 6 | 6 | OTHER_SHOES | Pure | `Luxury Shoes` 可用 |
| Prada T-shirts | `/Prada-T-shirts` | 1 | 1 | CLOTHING | Pure | `Clothing` 可用 |

```text
4 个分类全部 source = SITEMAP（可见，未落入 hidden-categories.txt）
4 个分类 count_mismatch 全部 = false（reported == actual，无计数漂移）
5 + 6 + 1 = 12 = /Prada 的商品数（父子计数自洽）
```

---

## 2. 规则（IF / THEN / OUTPUT）

### 2.1 分类层级

```text
RULE-ID: PRD-CAT-10
IF 品牌根分类同时包含服饰与鞋类（Prada 即为 Mixed）
THEN 不得把该根分类当作纯 `Luxury Shoes` 或纯 `Clothing` 绑定
     商品必须同时归属到最低层的纯类目
OUTPUT HOLD

RULE-ID: PRD-CAT-11
IF 一个 Prada 商品只挂在品牌根分类 `/Prada`
THEN 视为类目归属不完整（根分类是聚合，不是归属终点）
     必须补挂到 `Prada America's Cup Sneakers` / `Prada Collapse` / `Prada T-shirts`
     或新建纯类目；不得用根分类代替
OUTPUT HOLD

RULE-ID: PRD-CAT-12
IF 鞋类商品把 `NEW CLOTHING` 当作服饰语义分类
THEN 违规。`NEW CLOTHING` 是全局杂类（714 个商品），不是产品分类
OUTPUT HOLD

RULE-ID: PRD-CAT-13
IF 非鞋类商品出现在 `Sneakers Under $100`
THEN 违规（语义错配 + 价格定位与奢侈品牌调性冲突）
OUTPUT HOLD

RULE-ID: PRD-CAT-14
IF 同一品牌的商品面包屑父级不统一（部分走品牌根，部分走其他类目）
THEN 视为品牌内导航断裂，必须统一父级
OUTPUT HOLD
```

### 2.2 URL 与标识符形态

```text
RULE-ID: PRD-CAT-20
IF 同一品牌下 URL 大小写规范不统一（部分 Upper-initial，部分全小写）
THEN 新增或迁移一律采用该品牌已占多数的规范；
     既有正确 URL 按 V4.4 §10 保留，不因统一而批量重写
OUTPUT VERIFY

RULE-ID: PRD-CAT-21
IF 同一官方货号在 URL / SEO Title / H2 / Schema 中出现多种书写形态
     （例如 2EG479_D7C_F0304_F_G001 / 2eg479-d7c-f0304-f-g001 / 2EG479FG001D7CF0008）
THEN 视为对外标识符不一致，必须先归一为官方形态再写入任何字段
OUTPUT HOLD

RULE-ID: PRD-CAT-22
IF 官方货号出现在对外字段（Title / H2 / URL / Schema）
THEN 该货号必须由 Tier 1–4 来源附着到同一 exact entity
     否则按 V4.4 §5 走 SKU_OMIT，不得保留货号
OUTPUT SKU_OMIT
```

### 2.3 重复与配色

```text
RULE-ID: PRD-CAT-30
IF 两个不同 Product ID 的对外名称完全相同
THEN 视为疑似重复，确认前不写 SEO、不上架
OUTPUT HOLD

RULE-ID: PRD-CAT-31
IF 商品名中的配色与 URL slug 中的配色不一致
THEN 视为身份关键证据冲突（V4.4 §4）
OUTPUT HOLD

RULE-ID: PRD-CAT-32
IF 同一配色的词序在不同商品上相反（例如 Grey White 与 White Grey）
THEN 不得自行选择其一，必须以官方来源确认官方配色写法
OUTPUT HOLD
```

### 2.4 标准引用

```text
RULE-ID: PRD-CAT-40
IF 引用 V4.4 标准
THEN 必须确认当前分支的活动标准文件与其 sha256
     （本分支 b2505b2 上活动标准为 standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md，
      sha256 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7；
      Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md 已移入 standards/_superseded/，
      不得再作为决策层）
OUTPUT HOLD
```

---

## 3. 由 Prada 类目经验归纳出的 5 条通用可复用规则

| # | 规则 | 证据 |
|---|---|---|
| 1 | 品牌根分类若为 Mixed，根分类只能聚合，归属必须在纯子类目 | `/Prada` MIXED × 12 |
| 2 | 全局杂类（`NEW CLOTHING`）不得充当任何产品的语义分类 | 10/12 Prada 商品带 `NEW CLOTHING`，其中 10 个是鞋 |
| 3 | 跨品类杂类是高频错配源：先按 `Product Type` 反查分类归属 | `Prada Cotton T-Shirt`（CLOTHING）挂在 `Sneakers Under $100` |
| 4 | 面包屑是品牌目录的骨架，父级分裂必须当缺陷处理 | 11 × `Home > Prada` vs 1 × `Home > T-Shirt Reps & Streetwear Tees` |
| 5 | 货号形态一致性与货号正确性是两个独立验收项 | 同一 Prada 货号三种书写形态 |

---

## 4. 本文件未断言的内容（HOLD）

```text
HOLD  分类页自身的 SEO 元数据（Title / Meta Description / H1 / Canonical / Schema）
      原因：2026-09-15 抓取器只采集 name / url / count / products，未采集元数据
      解除条件：在线可达时对 4 个分类页做一次元数据抓取

HOLD  价格 / 库存 / 评分 / 评价数 / QC 图片 / 运费与退货文案 / 支付信任标识
      原因：抓取产物中无这些字段
      解除条件：在线可达时对分类页与 PDP 做一次 DOM 采集

HOLD  官方货号的 Tier 1–4 附着验证
      原因：本次执行环境无出网能力
      解除条件：联网后按 V4.4 §3 来源优先级逐条验证

HOLD  Prada 官方 / Farfetch / StockX 的信息架构对比
      原因：同上，且禁止无证据推断
      解除条件：联网后按同一采集口径抓取对比页
```
