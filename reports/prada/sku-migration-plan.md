---
id: reports.prada.sku-migration-plan
kind: governance-report
phase: 2
version: 1.0.0
status: ACTIVE
pack: prada
generated: 2026-09-20
source: audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json + identity-audit.json
source_tracked_by_git: NO  (see Phase 1 report)
---

# Phase 2 — SKU Migration Governance

> 本阶段**不修改任何 SKU**。只做判定与分派。
> 判定口径来自 `packs/prada/pack.json` 与 `seo-core/02-sku-verification.md`。

---

## 0. 汇总

```text
Total Products:        78

VERIFIED_SKU:           0
SKU_OMIT:              66
NEEDS_VERIFICATION:    12
```

```text
RULE-ID: SKU-MIG-00
IF 一个 code 没有任何 Tier 1-4 证据附着到该实体
THEN 不得记入 VERIFIED_SKU
OUTPUT VERIFY
```

`VERIFIED_SKU = 0` 不是悲观估计，是**当前证据状态的事实**：仓库内没有任何一份
Prada 官方 / 授权零售商来源的确认记录。66 个是内部码（必须省略），
12 个是"看起来像官方码但尚无 Tier 1-4 证据"（必须补证）。

---

## 1. 判定规则（Allowed / Forbidden）

### Allowed（可作为 SKU 的来源类型）

```text
official_brand_code
authorized_retailer_code
```

> 注：Core 允许四类（另含 `stockx_code` / `goat_code`），
> 但 Prada Pack 主动收窄为上述两类，理由见 `pack.json` 的 `narrowing_rationale` ——
> 本 Pack 的证据基础里没有任何 Tier 2 / Tier 3 确认。
> Pack 只能收窄，不能放宽；放宽需要 Core 层决策。

### Forbidden（禁止作为 SKU）

```text
internal_catalog
supplier_batch_suffix
internal_platform_id
url_suffix
image_filename
```

```text
RULE-ID: SKU-MIG-01
IF code 匹配 ^DS-PRA-\d{3}$
THEN 判定 SKU_OMIT
OUTPUT SKU_OMIT

RULE-ID: SKU-MIG-02
IF code 无法被 Tier 1-4 来源附着到同一实体
THEN 判定 NEEDS_VERIFICATION（不得直接判 SKU_OMIT，也不得判 VERIFIED_SKU）
OUTPUT VERIFY

RULE-ID: SKU-MIG-03
IF NEEDS_VERIFICATION 项在限定时间内无法补证
THEN 回落为 SKU_OMIT
OUTPUT SKU_OMIT
```

**不得猜。** 不猜货号、不猜系列、不猜配色。

---

## 2. SKU_OMIT：66 项

来源：`manifest.products[].identity.sku_type === "internal_catalog"`

```text
count            : 66
code pattern     : ^DS-PRA-\d{3}$      （全部匹配，已逐条校验）
numeric range    : DS-PRA-001 .. DS-PRA-078   （不连续：按索引生成，跳过已有官方码的 12 项）
identity.status  : PASS-VISUAL-INTERNAL-SKU × 66
```

按 run 时的状态分布：

| current_status | 数量 |
|---|---|
| `missing_create_required` | 61 |
| `unpublished_update_required` | 4 |
| `published_update_required` | 1 |

```text
处置：全部 SKU_OMIT
      → SEO Title 用无 SKU 模板
      → Meta 用无 SKU 模板
      → Product Details 第 5 行换成一条已核实的产品专属事实
      → Schema 完全省略 sku 键
      → slug 不追加货号
```

完整逐条清单可由下列路径复算（本报告不复制 66 行）：

```text
audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json
  .products[].identity.sku_type === "internal_catalog"
```

---

## 3. NEEDS_VERIFICATION：12 项

来源：`manifest.products[].identity.sku_type === "source_or_existing_product"`

| # | product_id | 当前状态 | code（逐字） | title |
|---|---|---|---|---|
| 1 | 536027381298718 | published | `4E3400 ASZ F0I89 F G000` | Prada America's Cup Patent Leather Sneakers Black Grey |
| 2 | 536027250485011 | published | `4E3400 ASZ F0002 F G000` | Prada America's Cup Leather Sneakers Matte Black |
| 3 | 536027438481428 | published | `4E6500 3LLJ F0002 F 025` | Prada America's Cup Soft Rubber Sneakers Carbon Black |
| 4 | 536027417154580 | unpublished | `1E819L 3KR F0002` | Prada Cloudbust Thunder Sneakers Black |
| 5 | 536027435686173 | published | `2EG479 D7C F0002 F G001` | Prada Collapse Re-Nylon and Suede Sneakers Black |
| 6 | 536027435815964 | published | `2EG479 D7C F0BW5 F G001` | Prada Collapse Re-Nylon and Suede Sneakers Palisander |
| 7 | 536027435849494 | published | `2EG479 D7C F0008 F G001` | Prada Collapse Re-Nylon and Suede Sneakers Dark Blue |
| 8 | 536027435766045 | published | `2EG479 D7C F0304 F G001` | Prada Collapse Re-Nylon and Suede Sneakers Ivory |
| 9 | 536027435734296 | published | `1E959N D7C F0007 F 005` | Prada Collapse Re-Nylon and Suede Sneakers Burgundy |
| 10 | （无，待创建） | missing | `1D246M 055 F0002` | Prada Chocolate Brushed Leather Loafers Black |
| 11 | （无，待创建） | missing | `1T255M 3LFR F0002` | Prada Lace-Up Pocket Boots Black |
| 12 | （无，待创建） | missing | `2DB205 055 F0002` | Prada Patent Leather Loafers Black |

```text
by current_status : published 8 / unpublished 1 / missing 3
code shape        : 5 段位 9 项；3 段位 3 项
```

### 3.1 为什么这 12 项不能判 VERIFIED_SKU

它们的 code **来源是我们自己**，不是品牌方。

```text
code 的出处（按可信度从高到低）：
  (a) 已在自建站 URL 中出现（8 项）—— 这是"我们曾经这样发布过"，不是品牌证据
  (b) 来自源文件夹名（3 项）—— 见 §3.2，其中 3 项对不上
  (c) 无任何出处交集（1 项）—— 536027417154580，未发布且 URL 无货号
```

```text
RULE-ID: SKU-MIG-04
IF code 的唯一出处是本项目自己的历史发布（URL / 清单 / 文件夹名）
THEN 不得判 VERIFIED_SKU
     必须回到 Tier 1-4 来源重新取证
OUTPUT VERIFY
```

这正是 Prada 案例要教的那件事：**内部一致不等于事实正确。**

### 3.2 三处真实不一致（最高优先补证对象）

对照 `source_key`（源文件夹名）与清单中的 code，发现 3 项**无法互相重建**：

| product_id | 清单 code | 源文件夹名中的写法 | 不一致类型 |
|---|---|---|---|
| 536027417154580 | `1E819L 3KR F0002` | `1E819LF0503KR2` | 段位粘连；版本段 `F0002` vs `F0503KR2` 无法对应 |
| （待创建） | `1T255M 3LFR F0002` | `1T255M3LFRF0` | 段位粘连；`F0002` vs `F0` |
| （待创建） | `1D246M 055 F0002` | `1D246M JHR FO002 F` | 配色段不同（`055` vs `JHR`）；且 `FO002` 存在字母 O / 数字 0 混淆 |

另有一处边界情况：

```text
2DB205 055 F0002          （清单）
2DB205 055 F0002 F        （源文件夹名，尾部悬空 F）
```

包内 `sku.always_rejected_values` 已把带尾部 F 的写法列为禁用值。
两者是否同一个码，需回源确认。

```text
RULE-ID: SKU-MIG-05
IF 清单 code 与源文件夹名无法互相重建
THEN 该 code 不得使用
     必须回到 Tier 1-4 来源逐字符重读（特别注意 O 与 0）
OUTPUT HOLD
```

### 3.3 三项没有任何出品方，且其中 1 项连 URL 都没有

```text
1D246M 055 F0002 / 1T255M 3LFR F0002 / 2DB205 055 F0002
  → 对应商品尚不存在（missing_create_required）
  → 没有任何已发布产物可交叉验证
  → 这三个是最难补证、也最必要补证的

536027417154580（Prada Cloudbust Thunder Sneakers Black）
  → 未发布，且其当前 URL 是 /-Prada-Sneakers-Black（无货号）
  → 是 12 项中唯一"孤立"的已存在商品
```

---

## 4. 补证作业单（12 项，逐项可勾选）

对每一项，只允许来自以下来源的确认：

```text
Tier 1  prada.com 官方商品页
Tier 2  StockX          ← 本 Pack 不收窄前不可用（Pack 只允许 brand / authorized retailer）
Tier 3  GOAT            ← 同上
Tier 4  结构化商品数据的授权零售商
```

```text
[ ]  1  536027381298718   4E3400 ASZ F0I89 F G000
[ ]  2  536027250485011   4E3400 ASZ F0002 F G000
[ ]  3  536027438481428   4E6500 3LLJ F0002 F 025
[ ]  4  536027417154580   1E819L 3KR F0002          ← 段位不一致，优先
[ ]  5  536027435686173   2EG479 D7C F0002 F G001
[ ]  6  536027435815964   2EG479 D7C F0BW5 F G001
[ ]  7  536027435849494   2EG479 D7C F0008 F G001   ← 线上 URL 为粘连写法
[ ]  8  536027435766045   2EG479 D7C F0304 F G001
[ ]  9  536027435734296   1E959N D7C F0007 F 005
[ ] 10  （待创建）        1D246M 055 F0002          ← 段位不一致 + O/0 混淆，优先
[ ] 11  （待创建）        1T255M 3LFR F0002         ← 段位不一致，优先
[ ] 12  （待创建）        2DB205 055 F0002          ← 尾部悬空 F 争议
```

补证通过 → `VERIFIED_SKU`；补证失败或超期 → `SKU_OMIT`。**没有第三条路。**

---

## 5. 迁移后的预期分布（两种情形）

```text
情形 A：12 项全部补证失败
  VERIFIED_SKU      0
  SKU_OMIT         78
  NEEDS_VERIFICATION 0

情形 B：12 项全部补证成功
  VERIFIED_SKU     12
  SKU_OMIT         66
  NEEDS_VERIFICATION 0
```

```text
RULE-ID: SKU-MIG-06
IF 报告 Prada 的 SKU 状态
THEN 必须同时给出 VERIFIED_SKU / SKU_OMIT / NEEDS_VERIFICATION 三个数字
     禁止只报其中一个
OUTPUT PASS
```

---

## 6. 本阶段未做的事（边界声明）

```text
未修改任何 SKU
未修改 manifest
未回写后台
未对 DS-PRA-### 做任何转换（只做了判定）
未对 12 项做出"是/否"结论（那是补证的产物，不是本阶段的产物）
```
