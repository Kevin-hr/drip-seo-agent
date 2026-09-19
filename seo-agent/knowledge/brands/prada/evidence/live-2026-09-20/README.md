---
id: knowledge.brands.prada.evidence-2026-09-20
kind: evidence-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
data_as_of: 2026-09-20
collected: 2026-09-20 (live HTTP, 22 PDP + 4 category pages, all HTTP 200)
evidence_basis:
  - evidence/live-2026-09-20/pdp-live-audit.json
  - evidence/live-2026-09-20/category-seo-audit.json
  - evidence/live-2026-09-20/category-link-enumeration.json
tier1_sources:
  - https://www.prada.com/us/en/p/collapse-re-nylon-and-suede-elasticized-sneakers/2EG479_D7C_F0007_F_G001
  - https://prada.com/ae/en/p/collapse-re-nylon-and-suede-elasticized-sneakers/2EG479_D7C_F0388_F_G001
  - http://prada.com/cn/zh/p/collapse-re-nylon-and-suede-elasticized-sneakers/2EG479_D7C_F0002_F_G001
---

# Prada 线上实时审计证据（2026-09-20）

## 0. 采集方法与可信度

```text
采集方式   : 直接 HTTP GET，带浏览器 UA，接受 gzip
采集对象   : 4 个 Prada 分类页 + 分类页上枚举出的全部 Prada 商品 PDP
采集结果   : 分类页 4/4 HTTP 200；PDP 22/22 HTTP 200
canonical  : 22/22 与自身 URL 一致（0 mismatch）
留存       : 原始 HTML 存于本地 prada-live-2026-09-20/pdp/ 与分类页同名 .html；
             本目录仅保存结构化提取结果（JSON）
```

```text
RULE-ID: PRD-EVD-01
IF 引用本文件的任何数字
THEN 必须标注 data_as_of = 2026-09-20；本文件优先于 2026-09-15 sitemap 口径
OUTPUT PASS
```

---

## 1. 重大更正：线上 Prada 商品是 22 个，不是 12 个

```text
2026-09-15 sitemap 抓取口径 : /Prada 12，Cup 5，Collapse 6，T-shirts 1  → 去重 12
2026-09-20 分类页实时枚举   : /Prada 22，Cup 7，Collapse 6，T-shirts 9  → 去重 22
```

**分类页实际链接的商品多于 sitemap。** 新增 10 个（相对 2026-09-15）：

| 新增 slug | 类型 | 特征 |
|---|---|---|
| `Prada-Americas-Cup-Sneakers-Black-Red-4E3400-ASZ-F0002` | 鞋 | 货号用**连字符**书写 |
| `Prada-Americas-Cup-Sneakers-Cobalt-Blue-Silver-4E3400-ASZ-F0J3X` | 鞋 | 货号用**连字符**书写 |
| `prada-milano-embroidered-logo-tshirt-black` | T恤 | 全小写 URL |
| `prada-milano-embroidered-logo-tshirt-white` | T恤 | 全小写 URL |
| `prada-renylon-and-jersey-zippocket-tshirt-black` | T恤 | 全小写 URL |
| `prada-renylon-and-jersey-zippocket-tshirt-white` | T恤 | 全小写 URL |
| `prada-renylon-panel-jersey-tshirt-black` | T恤 | 全小写 URL |
| `prada-renylon-panel-jersey-tshirt-white` | T恤 | 全小写 URL |
| `prada-logotab-patchpocket-cotton-tshirt-black` | T恤 | 全小写 URL |
| `prada-logotab-patchpocket-cotton-tshirt-white` | T恤 | 全小写 URL |

```text
RULE-ID: PRD-EVD-10
IF 需要 Prada 商品清单
THEN 以分类页实时枚举为准，不得以 sitemap 计数为准（两者已相差 10 个）
OUTPUT PASS

RULE-ID: PRD-EVD-11
IF 只抓 sitemap 就断言某分类的商品数
THEN 该数字不可信（实测 /Prada-T-shirts sitemap=1，分类页=9）
OUTPUT HOLD
```

---

## 2. 分类页 SEO 实测（4/4 HTTP 200）

| 分类 | Title | Len | Meta Len | 关键词数 | H1 |
|---|---|---|---|---|---|
| Prada | `Best Prada Drip Sneakers \| Dripsneakers.org` | 43 | 130 | 3 | `Prada` |
| Prada America's Cup Sneakers | `Prada America's Cup Sneakers Reps \| Drip Sneakers` | 49 | 125 | 5 | `Prada America's Cup Sneakers` |
| Prada Collapse | `Best Prada Collapse Drip Sneakers \| Dripsneakers.org` | 52 | 157 | 3 | `Prada Collapse` |
| Prada T-shirts | `Best Prada T-shirts Drip Sneakers \| Dripsneakers.org` | 52 | 157 | 3 | `Prada T-shirts` |

已证实的问题：

```text
1  Title 模板不统一：3 个用 "Best {X} Drip Sneakers | Dripsneakers.org"（无 Reps），
   1 个用 "{X} Reps | Drip Sneakers"。同级分类两种模板。
2  /Prada/ 的 Meta Description 含 V4.4 禁词 "1:1 quality Replica"（130 字符）：
   "Shop the best Reps Prada drip sneakers at Dripsneakers.org. 1:1 quality Replica Prada,
    Free US shipping $99+. Shop Reps Prada now!"
3  3/4 分类的关键词只有 3 个，且原串含逗号后双空格：'Prada,  Prada drip sneakers, dripsneakers'
4  H1 均为分类名本身，无修饰（"Prada" / "Prada Collapse"），无内容型 H2
   （唯一 H2 是 "Footer Auxiliary Navigation and Information"）
5  可见正文 2004–3401 字符（薄内容）
6  4/4 分类页无 breadcrumb 结构化标记；无筛选控件（select 计数 = 0）
7  价格区间：/Prada/ $99–$1050；Cup $139–$925；Collapse $129–$1050；T-shirts $59–$99
```

---

## 3. PDP 实时实测（22/22 HTTP 200）

### 3.1 结构

| 指标 | 结果 | V4.4 要求 | 判定 |
|---|---|---|---|
| canonical 与 URL 一致 | 22/22 | 一致 | **PASS** |
| Product schema 存在 | 22/22 | 需要 | **PASS** |
| Offer schema 存在 | 22/22 | 需要 | **PASS** |
| `AggregateRating` / `Review` schema | **0/22** | — | **缺失**（影响富摘要与信任） |
| PDP 区块存在 | 22/22 | 需要 | **PASS** |
| **H1 数量 = 2** | **22/22** | 1（= Product Name） | **全量违规** |
| Product Details 行数 = 5 | 13/22 | 恰好 5 | **9 项违规** |
| SEO 关键词数 = 5 | 13/22 | 恰好 5 | **9 项违规** |

### 3.2 每个 PDP 都有两个 H1（第二个固定是 "How to Order"）

```text
例：Prada-Americas-Cup-White-Grey
  H1#1 = "Prada America's Cup White Grey"     ← 正确
  H1#2 = "How to Order"                        ← 教程区块误用 H1
```

```text
RULE-ID: PRD-EVD-20
IF 商品页出现第二个 H1（例如购买教程标题被写成 <h1>）
THEN 违规，该区块标题必须降级为 h2/h3
OUTPUT HOLD
```

### 3.3 已核实的最高优先级缺陷

| 商品 | 缺陷 | 实测值 |
|---|---|---|
| `Prada-Americas-Cup-White-Grey` | **SEO Title 退化为 `reps \| Drip Sneakers`**（20 字符，商品名缺失） | `title_len = 20` |
| `Prada-Americas-Cup-White-Grey` | Meta **217 字符**且含 `1:1 quality Replica` | `meta_len = 217` |
| `Prada-Americas-Cup-Patent-Leather-Sneakers-Grey-White` | Meta **289 字符**且含 `1:1 quality Replica` | `meta_len = 289` |
| 上述两款的 Product Details | 行数 4 与 8（非 5） | `li = 4 / 8` |
| 6 个 Collapse 商品 | Product Details 行数 **6**（非 5） | `li = 6` |
| `Prada-Cotton-T-Shirt-White-...` | Product Details 行数 **10**（非 5） | `li = 10` |

### 3.4 重复与身份冲突（实时确认）

```text
Prada-Collapse-Re-Nylon-and-Suede-Elasticized-Sneakers-Topaz-2EG479_D7C_F0388_F_G001
    H1  = "Prada Collapse Re-Nylon and Suede Sneakers Blue"      ← 名称说 Blue
    URL = ...-Elasticized-Sneakers-Topaz-2EG479_D7C_F0388_F_G001 ← slug 说 Topaz

Prada-Collapse-Re-Nylon-and-Suede-Sneakers-Blue-2EG479FG001D7CF0008
    H1  = "Prada Collapse Re-Nylon and Suede Sneakers Blue"      ← 与上一条 H1 完全相同
```

**两个不同 URL 的 H1/Title 完全相同**，且其一的名称配色与 slug 配色互相矛盾。

### 3.5 需要人工确认的信号（不得直接当结论）

```text
信号：22/22 PDP 的购买区块原始文本中同时出现
      "Quantity /Pair Out Of Stock Buy Now Sold Out QC Photos Before Shipping ..."
原文来源：pdp/*.html 去除标签后的可见文本
两种解释 ：
  (a) 全部 22 款确实售罄 → P0 转化阻断
  (b) 模板同时渲染两种状态标签、由 JS 切换 → 非真实售罄
判定  ：无法用静态 HTML 区分 → 标 REQUIRES_CONFIRMATION
解除条件：用真实浏览器渲染 + 后台库存字段交叉核对
```

```text
信号：8 个 PDP 的价格串中出现 "$0.00"
（Cobalt Blue Silver / Soft Rubber / Topaz / Palisander / Burgundy / Black 等）
判定  ：可能是变体占位价或模板残留，静态 HTML 无法区分 → REQUIRES_CONFIRMATION
```

---

## 4. Tier 1 来源验证结果（prada.com 官方页面）

### 4.1 已验证的官方货号 → 官方配色

| 官方货号 | 官方配色 | 来源（Tier 1，prada.com） |
|---|---|---|
| `2EG479_D7C_F0002_F_G001` | **Black** | prada.com/cn/zh/p/collapse-re-nylon-and-suede-elasticized-sneakers/2EG479_D7C_F0002_F_G001 |
| `2EG479_D7C_F0007_F_G001` | **Burgundy**（US 价 $1,050） | prada.com/us/en/p/collapse-re-nylon-and-suede-elasticized-sneakers/2EG479_D7C_F0007_F_G001 |
| `2EG479_D7C_F0388_F_G001` | **Topaz** | prada.com/ae/en/p/collapse-re-nylon-and-suede-elasticized-sneakers/2EG479_D7C_F0388_F_G001 |

官方命名形态（逐字）：`Collapse Re-Nylon and Suede Elasticized Sneakers`（含 **Elasticized**）；官方页面以 `Color <Name>` 单列配色，货号以 `Product code:` 单列。

### 4.2 由此得出的判定

```text
判定 1（P0-6 可结案）
  `2EG479_D7C_F0388_F_G001` 的官方配色是 Topaz，不是 Blue。
  线上商品名/H1 写 "Sneakers Blue" 属**错误命名**，与 slug/SKU 不一致。
  正确名称应为：
      Prada Collapse Re-Nylon and Suede Elasticized Sneakers Topaz
  OUTPUT PASS（建议修正；修正前该商品 SEO 输出禁止）

判定 2（新增 P0）
  线上 Burgundy 商品的 URL 携带货号 `1E959N_D7C_F0007_F_005`。
  官方 `2EG479_D7C_F0007_F_G001` 才是 Burgundy（配色段 F0007 与线上一致，
  但型号段 2EG479 vs 1E959N 不一致）。
  → 线上 URL 的型号段与官方不符，属需核实的货号错配。
  OUTPUT HOLD（需确认 1E959N 是否为另一型号；确认前不得作为 SKU 写入）

判定 3（命名骨架）
  官方骨架 = Prada + {Model} + Re-Nylon and Suede [+ Elasticized] + Sneakers + {Colorway}
  线上存在省略 "Elasticized" 与保留 "Elasticized" 两种写法 → 不统一
  OUTPUT VERIFY

判定 4（Identifier 归一仍待办）
  线上同一型号族出现三种货号书写形态：
      2EG479_D7C_F0002_F_G001        （下划线 + _F_G001 后缀）
      2EG479FG001D7CF0008            （无分隔符连写、段序错位）
      4E3400-ASZ-F0002               （连字符）
  官方形态为下划线式 → 其余形态应归一
  OUTPUT HOLD
```

### 4.3 未完成的部分（诚实声明）

```text
[ ] America's Cup "Grey White" vs "White Grey" 的词序判定：未取得该 exact entity 的
    Tier 1 页面。仅有 Tier 4 零售商（eraldo.com）显示官方配色写法为 "WHITE/GREY"，
    证据强度不足以裁决 → 维持 HOLD
[ ] StockX / GOAT（Tier 2/3）：HTTP 403（反爬），未取得数据
[ ] 22 个商品的逐个 Tier 1–4 附着验证：仅完成 3 个官方货号
[ ] 线上库存真实状态：需后台字段或浏览器渲染，见 §3.5
```

```text
RULE-ID: PRD-EVD-30
IF 只有 Tier 5–8 证据支撑某个官方配色名
THEN 不得写入对外字段
OUTPUT HOLD

RULE-ID: PRD-EVD-31
IF Tier 1 官方页面给出了货号与配色
THEN 以官方页面为准；线上不一致处按 core/sku-validation.md 与
     core/identity-verification.md 判 HOLD 并留档
OUTPUT PASS
```
