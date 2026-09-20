---
id: knowledge.brands.prada.sku-pattern
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json
  - audit/2026-09-02T14-30-31+08-00-prada-78/identity-audit.json
  - shipping-audit/raw_products.json
---

# Prada SKU 模式（knowledge/brands/prada/sku-pattern.md）

## 0. 结论先行

Prada 的 SKU 在本地记录里是**两种混合形态**，必须区分对待：

```text
形态 A  internal_catalog        66 个    →  DS-PRA-001 … DS-PRA-078
形态 B  source_or_existing      12 个    →  官方/授权来源货号（多段空格分隔）
```

在现行 V4.4 下：

```text
形态 A  →  不得作为对外 SKU（属 Internal ID，命中 core/sku-validation.md 的 Rejected）
形态 B  →  可候选为 SKU，但仍必须由 Tier 1-4 来源附着到同一 exact entity 才算 VERIFIED_SKU
```

---

## 1. 形态 B：真实出现的官方货号串（逐字，不可改写）

```text
4E3400 ASZ F0I89 F G000
4E3400 ASZ F0002 F G000
4E6500 3LLJ F0002 F 025
1D246M 055 F0002
1E819L 3KR F0002
1T255M 3LFR F0002
2DB205 055 F0002
2EG479 D7C F0002 F G001
2EG479 D7C F0BW5 F G001
2EG479 D7C F0008 F G001
2EG479 D7C F0304 F G001
1E959N D7C F0007 F 005
```

### 1.1 观察到的结构（描述性归纳，非标准条款）

```text
<主型号 6 位> [<配色/材质段>] [<版本段>] [<扩展段>] [<工厂段>]

主型号     : 4E3400 / 4E6500 / 2EG479 / 1D246M / 1E819L / 1T255M / 2DB205 / 1E959N
配色/材质段: ASZ / 3LLJ / D7C / 055 / 3KR / 3LFR
版本段     : F0002 / F0I89 / F0BW5 / F0008 / F0304 / F0007
扩展段     : F
工厂段     : G000 / G001 / 025 / 005
```

```text
RULE-ID: PRD-SKU-01
IF 货号串只有前缀（如 "2EG2933"、"2EG4243"、"1E819LF0503KR2"）而未按段位分离
THEN 视为来源文件夹名残留，不得直接当 SKU 使用
OUTPUT HOLD

RULE-ID: PRD-SKU-02
IF 货号串可分离出完整段位（主型号 + 配色/材质段 + 版本段）
THEN 可作为候选货号，逐字保留空格格式，交由证据层裁决
OUTPUT VERIFY

RULE-ID: PRD-SKU-03
IF 判定为 VERIFIED_SKU
THEN 对外字段必须逐字使用证据中的货号串（不得重排、不得改分隔符、不得大小写变更）
OUTPUT PASS
```

### 1.2 已知的"半成品"货号串（真实反例，禁止直接使用）

```text
2EG2933          ← 只有主型号，无配色段
2EG4243          ← 只有主型号，无配色段
1E819LF0503KR2   ← 段位粘连，未分离
1D246M JHR FO002 F  ← 疑似 OCR/录入错误（FO002 vs F0002，字母 O 与数字 0 混淆）
2DB205 055 F0002 F  ← 尾部有悬空 F
```

```text
RULE-ID: PRD-SKU-04
IF 货号串存在字符混淆（O vs 0）或悬空分隔符
THEN 必须回到 Tier 1-4 来源逐字复核；复核不通过则
OUTPUT HOLD
```

---

## 2. 公开 URL 中的货号写法（关键差异）

线上 URL 使用**下划线连接**的货号：

```text
4E3400_ASZ_F0002_F_G000
4E6500_3LLJ_F0002_F_025
2EG479_D7C_F0304_F_G001
2EG479_D7C_F0008_F_G001
1E959N_D7C_F0007_F_005
2EG479FG001D7CF0008       ← 未加下划线的变体，存在
UJN861_240_F0009_S_232    ← 另一结构：主型号 + 240 + F0009 + S + 232
```

出处：`shipping-audit/raw_products.json`（2026-09-15 抓取）。

```text
RULE-ID: PRD-SKU-05
IF 已知商品存在线上 URL 中的货号写法
THEN 该写法可作为"该货号确实属于该商品"的交叉证据之一
OUTPUT VERIFY

RULE-ID: PRD-SKU-06
IF 同一货号出现下划线变体与无下划线变体
THEN 视为同一货号的两种呈现，不得据此判为两个 SKU
OUTPUT PASS
```

---

## 3. 混入的非 Prada 货号（边界提醒）

```text
UJN861 240 F0009 S 232
```

`UJN` 前缀在本地数据中出现在 Prada 相关目录下，但**未找到证明其为 Prada 官方货号的证据**。

```text
RULE-ID: PRD-SKU-07
IF 货号前缀未出现在本文件的已知主型号清单中
THEN 不得默认其为 Prada 货号，必须独立核验品牌归属
OUTPUT HOLD
```

---

## 4. 反面清单（Prada 语境下明确禁止的"SKU"）

```text
DS-PRA-001 … DS-PRA-078     内部目录码（internal_catalog）— 属 Internal ID
536027476120336             MrShopPlus Product ID
DC2 / DC3 / DC4 / PKGod     供应商批次/工厂代号
2EG2933 / 2EG4243           只有主型号的来源文件夹名残留
图片文件名中的数字串          例如 image_01.jpg
源文件夹名整体               例如 "Prada Americas Cup Black and Silver 4E3400 6GW"
```

注意边界：`4E3400`、`4E6500`、`6GW`、`ASZ` 属于**官方货号组成段**，不是供应商噪声；但在**对外配色名**里它们必须被剥离（见 `brand-rules.md` §1.3）。同一串字符在不同字段的处置不同，Agent 不得混用。

---

## 5. 给新品牌的迁移提示

Prada 的 SKU 模式说明：**同一品牌可能同时存在"内部码"和"官方多段货号"两套体系**。做 Dior / Moncler / Balenciaga 时必须先回答一个问题：

```text
我在用的这一串，是官方货号，还是我们自己编的内部码？
```

如果是内部码，按 V4.4 只能走 `SKU_OMIT`。Dior 的同类结构与失败形态见 `knowledge/brands/dior/sku-pattern.md`。
