---
id: knowledge.brands.prada.live-inventory-2026-09-15
kind: evidence-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - shipping-audit/raw_products.json
  - shipping-audit/raw_categories.json
  - shipping-audit/product_audit.csv
  - shipping-audit/category_audit.csv
  - shipping-audit/summary.json
  - audit/2026-09-02T14-30-31+08-00-prada-78/evidence/public-prada-seo-pdp-audit.json
data_as_of: 2026-09-15
compiled: 2026-09-19
---

# Prada 线上现状（2026-09-15 抓取快照）

## 0. 这份文件为什么存在

知识层原有的 Prada 素材全部来自 **未执行的 run**（`PROGRESS.md`：Task 1–4 全 PENDING，`operations.jsonl` 仅 8 行前置动作，实际 0/78）。
本文件补的是**线上真实存在的 12 个 Prada 商品与 4 个分类**——这是"盘点层"与"事实层"的差异，二者不可互相替代。

```text
未执行 run  →  告诉我们"打算做什么、命名与 SKU 规则是什么"
本文件       →  告诉我们"线上现在到底是什么"
```

---

## 1. 数据来源与可信度

| 来源 | 时点 | 覆盖 | 可信度 |
|---|---|---|---|
| `shipping-audit/` 全站抓取 | 2026-09-15 | sitemap 1101 商品 / 213 分类 | 一手抓取产物，`summary.json` 记为 `gate_pass: false`（即该批次自身未通过其闸门） |
| `public-prada-seo-pdp-audit.json` | 2026-09-02 | 9 个 Prada PDP 的线上 SEO 字段 | 一手抓取产物，含 HTTP 状态 |
| `identity-audit.json` / `manifest.json` | 2026-09-02 | 78 个**待上架**源商品 | 计划产物，非线上事实 |

```text
RULE-ID: PRD-INV-01
IF 引用 Prada 商品数量
THEN 必须标注日期与出处；禁止把 manifest 的 "published": true 当作线上状态
OUTPUT PASS
```

---

## 2. 线上 Prada 商品（12 个，2026-09-15）

| # | Product ID | 对外名称 | Type | Primary Category | URL slug 形态 |
|---|---|---|---|---|---|
| 1 | `536027250485011` | Prada America's Cup Patent Leather and Technical Fabric Sneakers Black | FOOTWEAR | Prada | Upper-initial |
| 2 | `536027381298718` | Prada America's Cup Patent Leather and Technical Fabric Sneakers Black Silver | FOOTWEAR | Prada | Upper-initial |
| 3 | `536027435686173` | Prada Collapse Re-Nylon and Suede Elasticized Sneakers Black | FOOTWEAR | Prada | Upper-initial |
| 4 | `536027435734296` | Prada Collapse Re-Nylon and Suede Sneakers Burgundy | FOOTWEAR | Prada | Upper-initial |
| 5 | `536027435766045` | Prada Collapse Re-Nylon and Suede Elasticized Sneakers Ivory | FOOTWEAR | Prada | **全小写** |
| 6 | `536027435815964` | Prada Collapse Re-Nylon and Suede Elasticized Sneakers Palisander | FOOTWEAR | Prada | Upper-initial |
| 7 | `536027435849494` | Prada Collapse Re-Nylon and Suede Sneakers Blue | FOOTWEAR | Prada | Upper-initial |
| 8 | `536027435896094` | Prada Collapse Re-Nylon and Suede Sneakers Blue | FOOTWEAR | Prada | Upper-initial（slug 写 **Topaz**） |
| 9 | `536027438481428` | Prada America's Cup Soft Rubber and Bike Fabric Sneakers Black | FOOTWEAR | Prada | Upper-initial |
| 10 | `536027476120336` | Prada America's Cup Patent Leather Sneakers Grey White | FOOTWEAR | Prada | Upper-initial（无货号） |
| 11 | `536027553279506` | Prada Cotton T-Shirt White | CLOTHING | **T-Shirt Reps & Streetwear Tees** | Upper-initial |
| 12 | `536027558902041` | Prada America's Cup White Grey | FOOTWEAR | Prada | Upper-initial（无货号） |

```text
Product Type 分布 : FOOTWEAR 11 / CLOTHING 1
Status 分布       : OK 12 / 12
品牌噪声筛查      : 无 PKGod / Top Quality / DC 后缀 / 性别尺码词（0 命中）
                    → 线上这 12 款的命名是干净的；供应商噪声问题存在于待上架的 64 款
```

### 2.1 分类归属原始值

```text
6 × ['NEW CLOTHING', 'Prada', 'Prada Collapse']
3 × ['NEW CLOTHING', 'Prada', "Prada America's Cup Sneakers"]
2 × []                                        ← 536027250485011 / 536027381298718
1 × ['NEW CLOTHING', 'Prada', 'Prada T-shirts', 'Sneakers Under $100', 'T-Shirt Reps & Streetwear Tees']
```

### 2.2 面包屑

```text
11 × Home > Prada > {商品名}
 1 × Home > T-Shirt Reps & Streetwear Tees > Prada Cotton T-Shirt White
```

---

## 3. 已证实的冲突（可直接作为 HOLD 判例）

### 3.1 同名不同 ID + 配色冲突

```text
536027435849494  name = Prada Collapse Re-Nylon and Suede Sneakers Blue
                 url  = .../Prada-Collapse-Re-Nylon-and-Suede-Sneakers-Blue-2EG479FG001D7CF0008

536027435896094  name = Prada Collapse Re-Nylon and Suede Sneakers Blue   ← 同名
                 url  = .../Prada-Collapse-Re-Nylon-and-Suede-Elasticized-Sneakers-Topaz-2EG479_D7C_F0388_F_G001
                                                                          ← slug 写 Topaz
```

```text
RULE-ID: PRD-INV-10
IF 两个 Product ID 对外名称相同，且其中一个的 slug 配色与名称不一致
THEN 疑似重复 + 配色冲突，双重触发
OUTPUT HOLD
```

### 3.2 配色词序相反

```text
536027476120336  Prada America's Cup Patent Leather Sneakers Grey White
536027558902041  Prada America's Cup White Grey
```

```text
RULE-ID: PRD-INV-11
IF 同一系列出现 Grey White 与 White Grey 两种词序
THEN 必须以官方来源确认官方写法，不得自行择一
OUTPUT HOLD
```

### 3.3 同一货号三种书写形态

```text
2EG479_D7C_F0304_F_G001    ← PDP SEO Title / H2 使用（public-prada-seo-pdp-audit.json）
2eg479-d7c-f0304-f-g001    ← 该商品 URL 使用（商品 #5）
2EG479FG001D7CF0008        ← 另一商品 URL 使用（商品 #7，无分隔符连写）
```

---

## 4. 线上 PDP SEO 实况（2026-09-02，9 个页面）

| source_key | HTTP | Title 长度 | Meta 长度 | 关键词数 | PDP 版本 | PDP 结构 |
|---|---|---|---|---|---|---|
| Prada Americas Cup Soft Rubber White | 200 | **20** | **205** | **4** | **—（无 PDP）** | false |
| Prada Americas Cup Soft Rubber Carbon Black | 200 | 107 | 169 | 7 | 3.3 | false |
| Prada Americas Cup Black Grey | 200 | 122 | 139 | 6 | 3.3 | false |
| Prada Americas Cup Matte Black | 200 | 115 | 132 | 6 | 3.3 | false |
| Prada Sneakers Collapse Dark Blue | 200 | 88 | 150 | 6 | 3.3 | false |
| Prada Sneakers Collapse Brown | 200 | 110 | 172 | 7 | 3.3 | false |
| Prada Sneakers Collapse Off White | 200 | 105 | 167 | 6 | 3.3 | false |
| Prada Sneakers Collapse Rose Red | 200 | 95 | 157 | 6 | 3.3 | false |
| Prada Sneakers Collapse Black | 200 | 105 | 146 | 6 | 3.3 | false |

```text
passes_pdp_3_0_structure = false   →  9 / 9
pdp_version              = 3.3     →  8 ；缺失 → 1
detail_label_count       = 6       →  8 个（PDP 3.0 要求 8 个固定字段）
pdp_h2 含官方货号                    →  8 / 8
```

最严重的一条（商品 #12，`536027558902041`）：

```text
Title            : "reps | Drip Sneakers"          ← 商品名完全缺失，长度 20
H1               : "Prada America's Cup White Grey" ← H1 正常，Title 与 H1 脱节
Meta Description : 205 字符，含 "1:1 quality Replica"（V4.4 禁词）
Meta Keywords    : 4 个
PDP              : pdp_present = false（完全没有 PDP 区块）
```

---

## 5. 计数沿革（引用时必须标日期）

```text
2026-09-02  operations.jsonl : /Prada 公开数 10 ；/Prada-Americas-Cup-Sneakers 公开数 4
2026-09-15  raw_categories  : /Prada 12 ；Cup 5 ；Collapse 6 ；T-shirts 1
2026-09-02  identity-audit  : 现有来源商品 14（9 published + 5 unpublished），待建 64
```

```text
RULE-ID: PRD-INV-20
IF 引用 Prada 计数
THEN 必须同时给出日期 + 出处文件；三组数字未调和，禁止混用
OUTPUT PASS
```

---

## 6. 明确未采集的字段（不得推断）

```text
价格 / 库存 / 销量 / 评分 / 评价文本 / QC 图片 / Banner / 筛选器 / 排序控件 /
运输与退货文案 / 支付信任标识 / 分类页 Title / Meta / H1 / Canonical / Schema
```
