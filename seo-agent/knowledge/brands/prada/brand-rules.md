---
id: knowledge.brands.prada.brand-rules
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - scripts/build-prada-78-manifest.cjs
  - scripts/validate-prada-seo-pdp-3.cjs
  - audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json
  - audit/2026-09-02T14-30-31+08-00-prada-78/identity-audit.json
  - audit/2026-09-02T14-30-31+08-00-prada-78/validation-checks.json
  - audit/2026-09-02T14-30-31+08-00-prada-78/operations.jsonl
  - shipping-audit/raw_products.json (2026-09-15 抓取)
  - deliverables/PRADA-78-END-TO-END-AI-EXECUTION-GUIDE.md
---

# Prada 品牌规则（knowledge/brands/prada/brand-rules.md）

## 0. 一句话摘要

Prada 的经验价值不在"PDP 做得好"，而在于：**它第一次把"命名规则 + SKU 格式 + 视觉去重 + 分类归属"四件事写成了可执行脚本**（`build-prada-78-manifest.cjs` + `validate-prada-seo-pdp-3.cjs`）。这是 v1.0 品牌包能复用的核心资产。

---

## 1. Product Naming Rules（商品命名规则）

### 1.1 America's Cup 系列（有公式，可自动生成）

```text
Prada America's Cup {descriptor} {colorway}

descriptor ∈ { Patent Leather Sneakers, Soft Rubber Sneakers, Leather Sneakers }
```

来源：`scripts/build-prada-78-manifest.cjs`。

真实成品样例：

```text
Prada America's Cup Patent Leather Sneakers Black/Silver
Prada America's Cup Patent Leather Sneakers Grey White
Prada America's Cup Soft Rubber Sneakers Carbon Black
```

### 1.2 非 Cup 系列（人工映射表，不可自动推导）

非 Cup 商品必须走人工映射表（源文件夹名 → 商品名 / Collection / Style / Colorway）。**规则上不可猜。**

真实成品样例（全部来自 manifest）：

```text
Prada Cloudbust Thunder Sneakers Black Grey White
Prada Collapse Re-Nylon and Suede Sneakers Palisander
Prada Triangle Logo Platform Sneakers White
Prada Trail Suede Sneakers Khaki
```

观察到的命名骨架（**描述性归纳，不是标准条款**）：

```text
Prada + {Model/Line} + {Material or Construction, 可选} + Sneakers + {Colorway}
```

```text
RULE-ID: PRD-NAME-01
IF 商品属于 America's Cup 系列
THEN 用公式生成，descriptor 只能取三种之一
OUTPUT PASS

RULE-ID: PRD-NAME-02
IF 商品不属于 America's Cup 系列
THEN 必须走人工映射表；映射缺失时不得推测命名
OUTPUT HOLD

RULE-ID: PRD-NAME-03
IF 生成的标题不以 "Prada " 开头
THEN 校验失败（校验器强制）
OUTPUT HOLD

RULE-ID: PRD-NAME-04
IF 标题 != product_title（不一致）
THEN 校验失败（校验器强制）
OUTPUT HOLD
```

### 1.3 配色清洗规则（可复用）

`normalizeColor` 处理：

```text
删除噪声码     : 4E3400 / 4E6500 / 3LLJ / ASZ / 6GW
连接词归一      : "and" → "/"
配色名归一      : "Pumpkin/Silver" → "Pumpkin Orange/Silver"
```

```text
RULE-ID: PRD-NAME-05
IF 配色串中出现上述噪声码
THEN 从对外配色名中剥离（噪声码不是配色）
OUTPUT PASS

RULE-ID: PRD-NAME-06
IF 剥离噪声码后配色信息仍不足以确定官方配色名
THEN 不得输出配色
OUTPUT HOLD
```

> 注意这里有一个**真实且未解决的张力**：`4E3400` / `4E6500` 等既是"要从标题剥离的噪声"，又是官方货号的组成段（见 `sku-pattern.md`）。剥离只作用于**对外配色名**，不作用于证据链中的货号。

---

## 2. Verification Workflow（核验流程，Prada 实际走的版本）

Prada run 实际使用的三重核验（`operations.jsonl` 记录）：

```text
STEP 1  源目录文件夹级 SHA-256 内容签名          判断是否存在完全重复文件夹
STEP 2  64-bit dHash 视觉近邻                    判断是否存在视觉近邻对
STEP 3  公开图下载 → 与本地图做 dHash / 颜色 MAE  判断后台现有图与本地源图是否同一张
```

真实结果：

```text
exact_duplicate_folder_count = 0
视觉近邻候选对               = 120 组（78 文件夹）
deletion_decision            = "none"（不做任何删除）
```

```text
RULE-ID: PRD-VER-01
IF 发现视觉近邻对
THEN 只记录候选对，禁止直接判定重复、禁止删除源图
OUTPUT VERIFY

RULE-ID: PRD-VER-02
IF 公开图与本地图的 dHash 距离 = 0 且 颜色 MAE = 0
THEN 可判定为同一张图，允许复用现图（不得重复上传）
OUTPUT PASS
```

真实对照证据：公开图 `536027476120336-prada-off-white-gray.jpg` ↔ 本地 `Prada Americas Cup Patent Grey White\01_main_cover.jpg`，`color_mae = 0`，`dhash_distance = 0`。

---

## 3. Category Rules（分类归属）

```text
America's Cup 商品（34 个） → 必须同时包含 Prada + Prada America's Cup Sneakers
其余 44 个商品              → 必须包含 Prada
平台已有的全局 NEW CLOTHING → 可保留，但禁止用它代替目标分类
两个分类页当时均已返回 200  → 不新建分类
```

```text
RULE-ID: PRD-CAT-01
IF 商品是 America's Cup
THEN 必须归属 Prada + Prada America's Cup Sneakers 两个分类
OUTPUT PASS

RULE-ID: PRD-CAT-02
IF 用 NEW CLOTHING 代替目标分类
THEN 违规
OUTPUT HOLD
```

---

## 4. identity.status 枚举（Prada run 的真实取值）

```text
PASS-VISUAL-INTERNAL-SKU     内部 SKU 路径（视觉确认 + 内部目录码）
PASS-SOURCE-EVIDENCE         来源证据路径（有来源/现有官方码）
```

```text
RULE-ID: PRD-ID-01
IF identity.status = PASS-VISUAL-INTERNAL-SKU
THEN 该商品在现行 V4.4 下**不构成 SKU 已核验**（内部码属 Internal ID，见 core/sku-validation.md）
     必须改走 SKU_OMIT 或补充 Tier 1-4 证据
OUTPUT SKU_OMIT
```

> 这是把 Prada 经验迁移到 V4.4 时**最容易犯的错**：`PASS-VISUAL-INTERNAL-SKU` 在 3.0 时代可用，在 V4.4 下不成立。

---

## 5. 失败与风险（必须随知识包一起传递）

| # | 事实 | 影响 |
|---|---|---|
| 1 | 78 目标 run 实际执行 **0/78**（`PROGRESS.md`：Task 1–4 全 PENDING，`operations.jsonl` 仅 8 行前置动作） | 不得声称 Prada 78 已完成 |
| 2 | 后台批量读取失败：`read_product_list = failed`，错误 `Chrome extension timed out while reading the large product table` | 大表格读取是单点故障 |
| 3 | 2026-09-02 对账给出 10 public / 9 matched / 69 missing；2026-09-07 给出 14 existing / 64 create；两组数字**未调和** | 引用计数时必须标明日期与出处 |
| 4 | 9 个现有公开 Prada PDP 的审计：`pdp_3_0_pass_count = 0`，`update_required_count = 9`，观测版本 `{3.3: 8, missing: 1}` | 线上存量 PDP 未通过 3.0 校验 |
| 5 | 5 个未发布现有品的 URL 形如 `https://www.dripsneakers.org/-Prada-Sneakers-Black-Red`（前导连字符、无品牌前缀） | 属 V4.4 §10 的迁移触发条件 |
| 6 | 源目录内同一文件夹存在重复图（如 `01_main_cover.jpg` 与 `02_detail.jpg` 的 sha256 相同） | 图片去重需要按内容哈希，不能按文件名 |
| 7 | `check-prada.js` 是 **0 字节空文件** | 不得作为任何校验依据 |
| 8 | manifest 中每条 `"published": true` 是**目标字段**（脚本硬编码），不是实际发布状态 | 禁止把 manifest 当成线上事实 |

---

## 6. 复用清单（做 Dior / Moncler 时可直接搬的部分）

```text
可直接复用 :
  - 文件夹级 SHA-256 + dHash 双重去重流程
  - "目标发布状态 ≠ 实际状态" 的记录纪律
  - 反向校验（红→绿）流程
  - 幂等键 source_key 的用法
  - 分类归属的"必须同时包含"写法

必须替换 :
  - 命名公式（Prada 专属）
  - 人工映射表（Prada 专属）
  - 配色噪声码清单（Prada 专属：4E3400 / 4E6500 / 3LLJ / ASZ / 6GW）

必须升级 :
  - SKU 裁决（内部码 → 改走 SKU_OMIT 或补 Tier 1-4）
  - PDP 版本（3.0 → V4.4）
```

跨品牌复用的落地模板见 `knowledge/brands/nike/`（结构相同，命名与 SKU 规则不同）。
