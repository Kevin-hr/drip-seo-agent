---
id: knowledge.brands.dior.brand-rules
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:dior, category:sneakers]
evidence_status: PARTIAL
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - deliverables/Dior-Sneakers-PDP-V3.2-Report.md
  - deliverables/dior-pdp-v32-results.json
  - deliverables/dior-sneakers-products.json
  - deliverables/dior-B2*/dior-B3*-pdp-v32.md（33 个 md 文件名）
  - git log: "PDP V3.2: Dior Sneakers batch generation - 42 products"
  - .codex/dior-b30-*.mjs（b30 build/inspect/final-verify 脚本）
---

# Dior 品牌规则（knowledge/brands/dior/brand-rules.md）

## 0. 证据状态声明（必读）

```text
evidence_status : PARTIAL
```

Dior 的资料**全部来自已被淘汰的 v3.2 时期产物**（2026-09-01，branch `SEO-PDP-3.2-STANDARD`）。

- 我**没有**读取过任何一个 Dior 商品的实际 PDP 内容并逐条验证
- 我**没有**任何 Dior 线上页面的抓取或后台回读证据
- 下面所有数字来自 `deliverables/Dior-Sneakers-PDP-V3.2-Report.md` 的自述

```text
RULE-ID: DIO-EVID-01
IF 需要把 Dior 知识用于生产
THEN 必须先按 core/evidence-policy.md 重新取证；不得直接沿用本文件的数字
OUTPUT VERIFY
```

**本文件的价值不在于"可复用的规则"，而在于"可复用的失败形态与迁移清单"。**

---

## 1. 真实批量结果（2026-09-01，v3.2）

```text
来源        : https://www.dripsneakers.org/Dior-Sneakers/
商品总数    : 42
PASS        : 28   （已有 PDP HTML + 已验证 SKU）
FIX         : 2    （有 SKU，但缺 PDP HTML）
HOLD        : 12   （全部是 Denim Tears 商品，SKU 未验证）
输出文件    : dior-pdp-v32-results.json
              dior-pdp-scraper-raw.json
              dior-sneakers-products.json
              dior-*.pdp-v32.md（33 个）
```

系列分布：

```text
B22  : 13 款（PASS）
B30  : 15 款（PASS）
B33  : 14 款（2 FIX + 12 HOLD）
```

---

## 2. 关键发现：Dior 的"unknown"失败形态被显式留档

交付目录里存在三个占位文件：

```text
deliverables/dior-B22-unknown-pdp-v32.md
deliverables/dior-B30-unknown-pdp-v32.md
deliverables/dior-B33-unknown-pdp-v32.md
```

```text
RULE-ID: DIO-UNK-01
IF 生成产物中出现 "unknown" 占位文件
THEN 它是身份核验失败的记录，不得视为已完成产物，也不得静默删除
OUTPUT HOLD
```

> 这是 Dior 回馈给整个知识层最重要的一条：**失败被命名并留档，而不是被抹掉**。这与 T-Shirts 的 `BLOCKED.md`、AJ1 的 `BLOCKED.md` 是同一种纪律。

---

## 3. 值得复用的命名观察

```text
B22 真实配色名（逐字取自报告）:
  Black / Black / Silver、Triple Grey、Black、Blue Black、White Silver、White Blue、
  Pale Pink Grey、Lavender Cream、Silver Black、White Black、Olive Blue、
  Cream Beige White、Black Laser

B30 真实配色名（逐字取自报告）:
  Countdown Sneaker Black White、Countdown Sneaker Dior Gray、Countdown Sneaker White、
  Countdown Sneaker Cream、Sneaker Olive、Reflective Sneaker Triple Black、
  Sneaker Black Silver、Sneaker Pink Mesh、Sneaker Anthracite Grey、
  Sneaker Silver Dark Grey、Reflective CD30 Sneaker Cream Green、
  Sneaker New Blue Neon Sole、Sneaker Black Blue Grey、
  Sneaker Light Gray Gray、Sneaker Blue Grey White
```

观察（描述性归纳，**未经验证，不得当规则使用**）：

```text
B30 的名称里 "Countdown Sneaker" / "Reflective Sneaker" / "Sneaker" 三种前缀混用
→ 疑似来源标题不一致，需按 core/identity-verification.md 逐款核验
```

```text
RULE-ID: DIO-NAME-01
IF 同名系列下出现多种前缀写法（如 B30 的 Countdown / Reflective / 裸 Sneaker）
THEN 视为来源标题噪声，不得直接采用；必须找到官方命名
OUTPUT HOLD
```

---

## 4. v3.2 模板与 V4.4 的**冲突清单**（迁移必读）

Dior 批量用的是 v3.2 模板。它与本仓库锁定的 V4.4 存在**至少 5 处硬冲突**：

| # | v3.2 实际写法（Dior 报告原文） | V4.4 要求 | 冲突性质 |
|---|---|---|---|
| 1 | 商品名 = `{Brand} {Model} {Colorway} {SKU}`（SKU 写进名称） | Product Name 不含 SKU | 硬冲突 |
| 2 | `<section ... data-version="3.2">` | `data-standard="4.4"`，无 `data-version` | 硬冲突 |
| 3 | `<h2>{Product Name}</h2>` + `<h3>Product Details</h3>` | 恰好 1 个 `<h2>Product Details</h2>`，禁止重复商品名为标题 | 硬冲突 |
| 4 | `<ul>` 有 **7** 个 `<li>` | 恰好 **5** 个 `<li>` | 硬冲突 |
| 5 | Meta 含 `real QC photos` 与 `7–20 day delivery` | 两者均在 `metaForbiddenPhrases` 中，明确禁止 | 硬冲突 |

```text
RULE-ID: DIO-MIG-01
IF 复用 Dior v3.2 的任何一个 HTML 片段
THEN 必须先按 core/pdp-template-v4.4.md 全量重建，不得局部改写
OUTPUT HOLD
```

第 5 条尤其危险：v3.2 时代合规的文案，在 V4.4 下**会直接触发 `META-02` 阻断**。

```text
v3.2 实际文案:
  Shop {Product Name} reps with real QC photos, 30-day returns and 7–20 day delivery from Drip Sneakers.

V4.4 必须改为:
  Shop {productName} reps ({sku}) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
  或（无 SKU）:
  Shop {productName} reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

---

## 5. HOLD 的战略含义（V4.4 可能解锁）

```text
12 个 HOLD 的原因只有一个：No SKU in URL/H1（Denim Tears B33 全系）
```

```text
RULE-ID: DIO-HOLD-01
IF HOLD 的唯一原因是"SKU 无法验证"，且 Exact Entity 可确认
THEN 在 V4.4 下存在合法路径：SKU_OMIT（完全省略 SKU）→ 可发布
     前提：必须先确认 exact entity PASS，且名称中不含 SKU
OUTPUT SKU_OMIT
```

> 这是一个**待验证的假设**，不是既成事实。它需要在真实 Dior 数据上重新取证后才能确认。
> 注意 v3.2 时代的商品名把 SKU 写进去了，所以去掉 SKU 后名称本身也会变（例如 `Dior B33 White 3SN272-ZIR1-6536` → `Dior B33 White`）。

---

## 6. 未解决项

```text
[ ] 没有任何线上 Dior 页面的抓取或后台回读证据
[ ] 28 个 PASS 是否真的发布过，无证据
[ ] 12 个 Denim Tears HOLD 未解除
[ ] 3 个 unknown 占位文件的成因未查
[ ] B30 前缀混用（Countdown / Reflective / 裸 Sneaker）未归一
[ ] 全部 33 个 md 产物仍是 v3.2 模板，未迁移到 V4.4
[ ] .codex/dior-b30-*.mjs 的 final-verify 结果未纳入证据链
```

---

## 7. 下一步取证清单（做 Dior Knowledge Pack 时按此执行）

```text
1  抓取 /Dior-Sneakers/ 当前线上状态（分类页 + 逐商品页）
2  逐款记录：HTTP / title / canonical / H1 / PDP 版本标记 / 图片数
3  对 B22 13 款 + B30 15 款 逐款做 Exact Entity 核验（Tier 1-4）
4  对 B33 全系 14 款重新取证，判断是否可走 SKU_OMIT
5  确认 Dior 官方款式码的正规格式（3SN... 的具体段位含义）
6  修正 3.2 → V4.4 模板的 5 处冲突
7  产出 V4.4 合法的新产物，并做反向验证（红→绿）
```
