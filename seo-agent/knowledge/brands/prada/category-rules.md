---
id: knowledge.brands.prada.category-rules
kind: knowledge-pack
version: 1.1.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada, category:sneakers, category:tshirts]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
data_as_of: 2026-09-20
evidence_basis:
  - evidence/live-2026-09-20/README.md（实时审计证据记录，含 Tier 1 验证）
  - evidence/live-2026-09-20/pdp-live-audit.json（22 PDP 实测）
  - evidence/live-2026-09-20/category-seo-audit.json（4 分类页实测）
  - evidence/live-2026-09-20/category-link-enumeration.json（分类页商品枚举）
  - live-inventory-2026-09-15.md（上一口径，sitemap）
  - audit/2026-09-02T14-30-31+08-00-prada-78/evidence/public-prada-seo-pdp-audit.json
---

# Prada 类目规则（knowledge/brands/prada/category-rules.md）

## 0. 一句话摘要

Prada 线上是 **4 个分类 + 22 个商品**（2026-09-20 实时枚举）。
分类计数自洽、命名无供应商噪声、canonical 全对、Product/Offer schema 齐全。
问题集中在三处：**分类归属语义**、**每页两个 H1（22/22）**、
**存量 PDP 结构与元数据不达 V4.4**（9/22 的 Product Details 与关键词数都不等于 5）。

---

## 1. 分类结构（实测）

| 分类 | URL | sitemap 计数<br>(2026-09-15) | 分类页枚举<br>(2026-09-20) | 类型 | 纯/混 | 抓取器判定 |
|---|---|---|---|---|---|---|
| Prada | `/Prada/` | 12 | **22** | MIXED | Mixed | `BLOCKED` — "Contains multiple target shipping groups: Clothing, Luxury Shoes"｜Action: **"Do not bind; split to pure lower-level categories"** |
| Prada America's Cup Sneakers | `/Prada-Americas-Cup-Sneakers/` | 5 | **7** | OTHER_SHOES | Pure | 可作为 `Luxury Shoes` |
| Prada Collapse | `/Prada-Collapse/` | 6 | **6** | OTHER_SHOES | Pure | 可作为 `Luxury Shoes` |
| Prada T-shirts | `/Prada-T-shirts/` | 1 | **9** | CLOTHING | Pure | 可作为 `Clothing` |

```text
4/4 分类 HTTP 200；4/4 分类 canonical 自洽；4/4 分类均在 sitemap（不在 37 条隐藏分类中）
价格区间：/Prada/ $99–$1050｜Cup $139–$925｜Collapse $129–$1050｜T-shirts $59–$99
```

```text
RULE-ID: PRD-CAT-01
IF 需要 Prada 分类的商品数
THEN 必须以分类页实时枚举为准
     （实测 sitemap 与分类页已相差 10 个：/Prada-T-shirts sitemap=1、分类页=9）
OUTPUT PASS
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
IF 一个 Prada 商品只挂在品牌根分类 /Prada
THEN 视为类目归属不完整，必须补挂到最低层纯类目
     （Prada America's Cup Sneakers / Prada Collapse / Prada T-shirts）
OUTPUT HOLD

RULE-ID: PRD-CAT-12
IF 鞋类商品把 `NEW CLOTHING` 当作服饰语义分类
THEN 违规。`NEW CLOTHING` 是全局杂类（714 商品），不是产品分类
OUTPUT HOLD

RULE-ID: PRD-CAT-13
IF 非鞋类商品出现在 `Sneakers Under $100`
THEN 违规（语义错配 + 价格定位与奢侈品牌调性冲突）
OUTPUT HOLD

RULE-ID: PRD-CAT-14
IF 同一品牌的商品面包屑父级不统一
THEN 视为品牌内导航断裂，必须统一父级
OUTPUT HOLD
```

### 2.2 URL 与标识符形态

```text
RULE-ID: PRD-CAT-20
IF 同一品牌下 URL 大小写规范不统一
THEN 新增/迁移一律采用该品牌已占多数的规范；
     既有正确 URL 按 V4.4 §10 保留，不因统一而批量重写
OUTPUT VERIFY

RULE-ID: PRD-CAT-21
IF 同一官方货号在 URL / SEO Title / H2 / Schema 中出现多种书写形态
THEN 必须先归一为**官方形态**（下划线式，如 2EG479_D7C_F0002_F_G001）再写入任何字段
     实测三种形态并存：
       2EG479_D7C_F0002_F_G001   官方下划线式
       2EG479FG001D7CF0008       无分隔符连写、段序错位
       4E3400-ASZ-F0002          连字符式
OUTPUT HOLD

RULE-ID: PRD-CAT-22
IF 货号出现在对外字段（Title / H2 / URL / Schema）
THEN 该货号必须由 Tier 1–4 来源附着到同一 exact entity，否则走 SKU_OMIT
OUTPUT SKU_OMIT

RULE-ID: PRD-CAT-23
IF 商品名中的配色与 Tier 1 官方页面给出的配色不一致
THEN 以官方为准，商品名必须改正；改正前禁止生成任何 SEO 输出
实测判例：2EG479_D7C_F0388_F_G001 官方配色 = **Topaz**
          线上该商品名/H1 写 "Sneakers Blue" → 属错误命名
OUTPUT HOLD

RULE-ID: PRD-CAT-24
IF 线上 URL 携带的货号型号段与 Tier 1 官方货号不符
THEN 视为货号错配，需确认是否属另一型号；确认前不得作为 SKU 写入
实测判例：线上 Burgundy 商品 URL 用 `1E959N_D7C_F0007_F_005`，
          官方 Burgundy 为 `2EG479_D7C_F0007_F_G001`（配色段 F0007 一致、型号段不一致）
OUTPUT HOLD
```

### 2.3 重复与配色

```text
RULE-ID: PRD-CAT-30
IF 两个不同 URL 的对外名称 / H1 完全相同
THEN 视为疑似重复，确认前不写 SEO、不上架
实测判例：Collapse "…Sneakers Blue" 出现在两个不同 URL 上（其一 slug 写 Topaz）
OUTPUT HOLD

RULE-ID: PRD-CAT-31
IF 商品名中的配色与 URL slug 中的配色不一致
THEN 身份关键证据冲突（V4.4 §4）
OUTPUT HOLD

RULE-ID: PRD-CAT-32
IF 同一配色的词序在不同商品上相反（Grey White vs White Grey）
THEN 不得自行择一，必须以官方来源确认
     （当前证据仅到 Tier 4 零售商，显示官方写法倾向 "White/Grey"，强度不足）
OUTPUT HOLD
```

### 2.4 页面结构（PDP）

```text
RULE-ID: PRD-CAT-40
IF 商品页出现第二个 H1
THEN 违规：H1 只能有一个且等于 Product Name
     实测：22/22 Prada PDP 的第二个 H1 固定为 "How to Order"（购买教程区块）
OUTPUT HOLD

RULE-ID: PRD-CAT-41
IF Product Details 行数 != 5
THEN 违规（V4.4 要求恰好 5 个已核实字段）
     实测：9/22 违规（4 / 6 / 8 / 10 行）
OUTPUT HOLD

RULE-ID: PRD-CAT-42
IF SEO 关键词数 != 5
THEN 违规（V4.4 §8）
     实测：9/22 违规（范围为 4–8）
OUTPUT HOLD

RULE-ID: PRD-CAT-43
IF 分类页 Title 模板在同一品牌的不同子分类间不一致
THEN 视为模板缺陷（实测 3 个用 "Best {X} Drip Sneakers | Dripsneakers.org"，
     1 个用 "{X} Reps | Drip Sneakers"）
OUTPUT VERIFY

RULE-ID: PRD-CAT-44
IF Meta Description 含 V4.4 禁词（如 "1:1"）
THEN 违规，必须替换为 V4.4 §9 模板
     实测：/Prada/ 分类页与 2 个 PDP 命中
OUTPUT HOLD
```

### 2.5 标准引用

```text
RULE-ID: PRD-CAT-50
IF 引用 V4.4 标准
THEN 必须确认当前分支的活动标准
     （本分支上活动标准 = standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md，
      sha256 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7；
      _CLEAN_CONSOLIDATED_2026-09-17.md 已移入 standards/_superseded/）
OUTPUT HOLD
```

---

## 3. 归纳出的通用可复用规则（跨品牌）

| # | 规则 | 证据 |
|---|---|---|
| 1 | 品牌根分类若为 Mixed，根分类只能聚合，归属必须在纯子类目 | `/Prada/` Mixed × 22 |
| 2 | 全局杂类（`NEW CLOTHING`）不得充当任何产品的语义分类 | 鞋类商品带 `NEW CLOTHING` |
| 3 | 跨品类杂类是高频错配源：先按 `Product Type` 反查分类归属 | T恤挂在 `Sneakers Under $100` |
| 4 | 面包屑是品牌目录的骨架，父级分裂必须当缺陷处理 | 1 个 T恤父级为 T-Shirt 类目 |
| 5 | 货号形态一致性与货号正确性是两个独立验收项 | 同一型号族三种书写形态 |
| 6 | **sitemap 计数不可作为分类商品数**：实测相差 10 个 | `/Prada-T-shirts` 1 vs 9 |
| 7 | 购买教程类区块不得使用 H1 | 22/22 PDP 第二个 H1 = "How to Order" |

---

## 4. 仍未解除的 HOLD

```text
HOLD  22/22 PDP 是否真实售罄（购买区块含 "Out Of Stock / Sold Out" 原文，
      但无法用静态 HTML 区分"模板渲染"与"真实售罄"）
      解除条件：真实浏览器渲染 + 后台库存字段

HOLD  8 个 PDP 价格串中的 "$0.00" 含义（变体占位价 or 模板残留）
      解除条件：后台价格字段核对

HOLD  America's Cup "Grey White" vs "White Grey" 官方词序
      解除条件：取得该 exact entity 的 Tier 1 页面

HOLD  19/22 商品的 Tier 1–4 逐个附着验证（仅完成 3 个官方货号）
      解除条件：逐个抓取 prada.com 对应商品页

HOLD  StockX / GOAT（Tier 2/3）数据：HTTP 403 反爬
      解除条件：更换采集方式或使用官方 API

HOLD  Prada 官方 / Farfetch 的信息架构对比
      解除条件：按同一采集口径抓取对比页（本次未做，禁止推断）
```
