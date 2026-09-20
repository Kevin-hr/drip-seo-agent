---
id: reports.prada.legacy-risk-inventory
kind: governance-report
phase: 3
version: 1.0.0
status: ACTIVE
pack: prada
generated: 2026-09-20
method: seo-core/engine.mjs URL policy + public-prada-seo-pdp-audit.json full scan
---

# Phase 3 — Legacy Risk Inventory

> 本阶段**不修改任何 URL、不改任何 PDP、不改任何图片**。只做清点与分类。
> URL 分类由 `packs/prada/tools/classify-urls.mjs` 调用 Core 引擎产生，不是人工判断。

---

## 0. 汇总

```text
存量商品（manifest existing）      14
  已发布                          9
  未发布                          5

URL 分类（引擎判定）
  KEEP                            9
  MIGRATE                         5

PDP 分类
  REBUILD_REQUIRED                9  （全部已发布的存量页，无一可继承）
  已迁移确认                      1  （见 §2.3 的证据时效说明）
```

```text
RULE-ID: LR-00
IF 存量页的 PDP 版本不是 4.4
THEN 标记 REBUILD_REQUIRED，不得继承其任何 SEO 字段
OUTPUT HOLD
```

---

## 1. URL 风险

分类命令（只读，可复现）：

```bash
node packs/prada/tools/classify-urls.mjs
```

判定口径：结构性破损 → MIGRATE；既有 slug 大小写不合约定 → 仅 WARN；
已有正确 URL → KEEP（Core 05 §7 / GEN-07 / GEN-08 / GEN-22）。

### 1.1 KEEP（9 项，均带 WARN）

| product_id | current_status | 当前 URL |
|---|---|---|
| 536027381298718 | published | `.../Prada-Americas-Cup-Patent-Leather-and-Technical-Fabric-Sneakers-Black-Silver-4E3400_ASZ_F0I89_F_G000` |
| 536027250485011 | published | `.../Prada-Americas-Cup-Patent-Leather-and-Technical-Fabric-Sneakers-Black-4E3400_ASZ_F0002_F_G000` |
| 536027438481428 | published | `.../Prada-Americas-Cup-Soft-Rubber-and-Bike-Fabric-Sneakers-Black-4E6500_3LLJ_F0002_F_025` |
| 536027558902041 | published | `.../Prada-Americas-Cup-White-Grey` |
| 536027435686173 | published | `.../Prada-Collapse-Re-Nylon-and-Suede-Elasticized-Sneakers-Black-2EG479_D7C_F0002_F_G001` |
| 536027435815964 | published | `.../Prada-Collapse-Re-Nylon-and-Suede-Elasticized-Sneakers-Palisander-2EG479_D7C_F0BW5_F_G001` |
| 536027435849494 | published | `.../Prada-Collapse-Re-Nylon-and-Suede-Sneakers-Blue-2EG479FG001D7CF0008` |
| 536027435766045 | published | `.../prada-collapse-re-nylon-and-suede-elasticized-sneakers-ivory-2eg479-d7c-f0304-f-g001` （无 WARN） |
| 536027435734296 | published | `.../Prada-Collapse-Re-Nylon-and-Suede-Sneakers-Burgundy-1E959N_D7C_F0007_F_005` |

```text
KEEP 的含义：URL 结构正确，不得为了"统一风格"而重写。
WARN 的含义：既有 slug 大小写不符合新 slug 约定 —— 只记警告，不迁移（GEN-22）。
```

```text
RULE-ID: LR-01
IF URL 判定为 KEEP
THEN 即使后续 REBUILD PDP，也必须保留该 URL
OUTPUT PASS
```

### 1.2 MIGRATE（5 项）

| product_id | current_status | 当前 URL | 触发原因 |
|---|---|---|---|
| 536027385478934 | unpublished | `.../-Prada-Sneakers-Black-Red` | LEADING-OR-TRAILING-HYPHEN |
| 536027476120336 | unpublished | `.../-Prada-Off-White-Gray` | LEADING-OR-TRAILING-HYPHEN |
| 536027441409051 | unpublished | `.../-Prada-Sneakers-Blue` | LEADING-OR-TRAILING-HYPHEN |
| 536027417154580 | unpublished | `.../-Prada-Sneakers-Black` | LEADING-OR-TRAILING-HYPHEN |
| 536027428790800 | unpublished | `.../-Prada-Cloudbust-Thunder-Silver-Black` | LEADING-OR-TRAILING-HYPHEN |

这 5 条的共同特征：**路径以连字符开头**，且都不含品牌前缀语义与配色语义。

```text
迁移要求：old URL → 单跳 301 → final URL（无 redirect chain）
         final URL = 200，且 canonical / Schema / sitemap / 内链同步
```

### 1.3 证据时效说明（必须与 1.2 一起读）

manifest 冻结于 **2026-09-02**。`shipping-audit/raw_products.json` 抓取于 **2026-09-15**。

```text
536027476120336：
  manifest（2026-09-02）    current_public_url = https://www.dripsneakers.org/-Prada-Off-White-Gray
  公开站观测（2026-09-15）   https://www.dripsneakers.org/Prada-Americas-Cup-Patent-Leather-Sneakers-Grey-White
```

即：**该商品的 URL 迁移在中途已经完成过一次**，manifest 里的 URL 已被更新的事实取代。

```text
因此 MIGRATE 的"待处理"应为：
  4 项确认为待迁移（其余 4 条 /-Prada-*）
  1 项需重新读数确认（536027476120336）—— 观测证据显示已完成，但本阶段未做实时读取
```

```text
RULE-ID: LR-02
IF 引用 manifest 中的 current_public_url
THEN 必须注明该值是 2026-09-02 的冻结值
     不得当作当前线上状态
OUTPUT VERIFY

RULE-ID: LR-03
IF 需要确认某个 URL 的当前状态
THEN 必须重新读取（后台或公开站），不得沿用冻结值或旧抓取值
OUTPUT VERIFY
```

这条不是形式主义：Prada 预检案例已经把"库存状态必须在执行前立即重读"
写成了控制项，这里就是它的具体形态。

---

## 2. PDP 风险

证据：`audit/.../evidence/public-prada-seo-pdp-audit.json`
（生成于 2026-09-02T15:09:22+08:00，覆盖 9 个页面，全部 HTTP 200）

### 2.1 版本与结构

```text
audited                        9
HTTP 200                       9
PDP 块存在                     8
PDP 块缺失                     1
PDP 版本 3.3                   8
通过 PDP 3.0 结构校验           0
```

```text
结论：0 / 9 通过。全部标记 REBUILD_REQUIRED。
```

### 2.2 结构性偏差（8 个 3.3 页面完全一致）

8 个页面的 Product Details 标签集合**只有一种**：

```text
Style | Colorway | Upper Design | Signature Details | Outsole | Reference Style Code
（6 个标签，无 Brand 行）
```

与 V4.4 的冲突：

| # | 现状（3.3） | V4.4 要求 | 冲突点 |
|---|---|---|---|
| 1 | 6 个 Product Details 标签 | 恰好 5 个 | 数量不符 |
| 2 | 无 Brand 行 | Brand 行必须承载唯一的真实可爬取内链 | 缺内链 |
| 3 | 有 `Reference Style Code` 行 | 第 5 行为 SKU 或一条已核实事实 | 命名与语义不符 |
| 4 | PDP H2 = 商品名 + 货号 | 恰好 1 个 `<h2>Product Details</h2>`，禁止重复商品名 | 标题结构冲突 |
| 5 | PDP 内的商品名含货号 | 商品名不得含 SKU（§6） | 命名冲突 |

补充：8 个页面的 `pdp_h2` **全部**形如
`{商品名} {货号}`（如 `Prada America's Cup Soft Rubber and Bike Fabric Sneakers Black 4E6500_3LLJ_F0002_F_025`）。

```text
RULE-ID: LR-04
IF 复用任何 3.3 页面的 HTML 片段
THEN 必须在 V4.4 下整体重建（结构、字段数、内链、版本标记全变）
OUTPUT HOLD
```

### 2.3 内容性偏差（这是本阶段新发现的一类风险）

`meta description` 命中 V4.4 禁用短语的情况：

| 禁用短语 | 命中页面数 |
|---|---|
| `7–20 day delivery` | 8 |
| `1:1` / `Replica` / `best Reps` | 1（同一页，三者同时出现） |

```text
9 / 9 页面的 meta description 至少含一条 V4.4 禁用短语。
```

`7–20 day delivery` 在 V4.4 的 `metaForbiddenPhrases` 中（正确写法是 `7–20 day shipping`）。
`1:1` / `Replica` 属 §6 禁用营销词。

### 2.4 单页级严重缺陷

```text
product_id : 536027558902041
source_key : Prada Americas Cup Soft Rubber White
url        : https://www.dripsneakers.org/Prada-Americas-Cup-White-Grey
http       : 200
title      : "reps | Drip Sneakers"          ← 商品名完全缺失（长度 20）
pdp        : 缺失（无 Product Details 区块）
meta       : 含 "1:1 quality Replica" 与 "best Reps"
```

这是 9 个页面里唯一一个 **HTTP 200 但实质破损** 的页面：
标题里没有商品名，PDP 区块不存在，meta 使用了禁用词。

```text
RULE-ID: LR-05
IF 页面 HTTP 200 但 title 中不含商品名
THEN 该页不可视为"已正确发布"，必须重建
OUTPUT HOLD
```

### 2.5 标题长度

```text
title 长度 > 100 字符 : 6 / 9
最长                  : 122 字符
```

V4.4 未定义 Title 字符数阈值，因此这**不是阻断项**，仅作为重建时的可读性提示记录在案。
（禁止为凑长度牺牲实体准确性，见 Core 05 GEN-03。）

---

## 3. 逐商品合并清单（14 项）

```text
[URL]  KEEP / MIGRATE   ← 引擎判定
[PDP]  REBUILD_REQUIRED ← 全部
```

| # | product_id | 状态 | URL | PDP | 最严重的问题 |
|---|---|---|---|---|---|
| 1 | 536027381298718 | published | KEEP | REBUILD | meta 含禁用短语 |
| 2 | 536027250485011 | published | KEEP | REBUILD | meta 含禁用短语 |
| 3 | 536027438481428 | published | KEEP | REBUILD | meta 含禁用短语 |
| 4 | 536027558902041 | published | KEEP | REBUILD | **标题缺商品名 + PDP 缺失 + meta 含 1:1/Replica** |
| 5 | 536027435686173 | published | KEEP | REBUILD | meta 含禁用短语 |
| 6 | 536027435815964 | published | KEEP | REBUILD | meta 含禁用短语 |
| 7 | 536027435849494 | published | KEEP | REBUILD | meta 含禁用短语 |
| 8 | 536027435766045 | published | KEEP | REBUILD | 无 WARN，但 PDP 仍需重建 |
| 9 | 536027435734296 | published | KEEP | REBUILD | meta 含禁用短语 |
| 10 | 536027385478934 | unpublished | MIGRATE | REBUILD | 破损 URL |
| 11 | 536027476120336 | unpublished | MIGRATE（疑似已迁移，待读数） | REBUILD | 见 §1.3 |
| 12 | 536027441409051 | unpublished | MIGRATE | REBUILD | 破损 URL |
| 13 | 536027417154580 | unpublished | MIGRATE | REBUILD | 破损 URL + 货号段位不一致 |
| 14 | 536027428790800 | unpublished | MIGRATE | REBUILD | 破损 URL |

```text
URL 待迁移（确认）      4
URL 待迁移（待确认）    1
URL 必须保留            9
PDP 必须重建            9   （已发布存量页；5 个未发布页按 V4.4 新建，不计入"重建"）
```

---

## 4. 重建时的顺序约束

```text
1  先确认身份（Core 01），再谈 URL 与 PDP
2  KEEP 的 URL 必须保留；MIGRATE 的走单跳 301
3  PDP 一律按 V4.4 重建：恰好 1 个 <h2>Product Details</h2>、恰好 5 个 <li>、
   Brand 行承载唯一内链、data-standard="4.4"
4  Meta 用 V4.4 固定模板（QC photos / 30-day returns / 7–20 day shipping），
   禁止 7–20 day delivery、1:1、Replica
5  每个页面重建后必须过三段回读（保存 / 发布 / 前台）
```

```text
RULE-ID: LR-06
IF 重建 KEEP 类页面
THEN 不得改 URL；不得只改 meta 就算完成（PDP 结构必须一并重建）
OUTPUT PASS
```

---

## 5. 本阶段未做的事（边界声明）

```text
未访问后台
未修改任何 URL
未修改任何 PDP 或 SEO 字段
未修改任何图片
未下架或上架任何商品
未合并任何分支
```

所有分类结果来自只读分析，可由以下命令复现：

```bash
node packs/prada/tools/classify-urls.mjs
node seo-core/tests/run-core-tests.mjs
node packs/prada/tests/run-prada-pack-tests.mjs
```
