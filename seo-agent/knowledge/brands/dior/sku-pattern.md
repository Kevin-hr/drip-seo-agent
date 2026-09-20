---
id: knowledge.brands.dior.sku-pattern
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:dior]
evidence_status: PARTIAL
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - deliverables/Dior-Sneakers-PDP-V3.2-Report.md（PASS 清单逐字）
  - deliverables/dior-B2*/dior-B3*-pdp-v32.md（33 个文件名）
  - deliverables/dior-sneakers-products.json
---

# Dior SKU 模式（knowledge/brands/dior/sku-pattern.md）

## 0. 证据状态

```text
evidence_status : PARTIAL
```

以下货号**全部来自 v3.2 时期报告的自述**，我未逐个在线验证。它们应被视为
"候选证据"，而不是"已核验 SKU"。

```text
RULE-ID: DIO-SKU-00
IF 要把下列任何货号写入对外字段
THEN 必须先按 core/sku-validation.md 拿到 Tier 1-4 附着证据
OUTPUT VERIFY
```

---

## 1. 真实出现过的款式码（逐字，按系列分组）

### B22 系列（13 款）

```text
3SN231ZNG-H969   Dior B22 Black / Black / Silver
3SN231YK-A804    Dior B22 Triple Grey
3SN231ZHM-H960   Dior B22 Black
3SN231YUL-H569   Dior B22 Blue Black
3SN231YJG-H000   Dior B22 White Silver
3SN231YXX-H865   Dior B22 White Blue
3SN231YKB-H069   Dior B22 Pale Pink Grey
3SN231YXX-H861   Dior B22 Lavender Cream
3SN231YIY-H169   Dior B22 Silver Black
3SN231YKB-H968   Dior B22 White Black
3SN231YKB-H669   Dior B22 Olive Blue
3SN231YXX-H160   Dior B22 Cream Beige White
3SN231ZHM-H962   Dior B22 Black Laser
```

### B30 系列（15 款）

```text
3SN279ZMB-H969   Dior B30 Countdown Sneaker Black White
3SN279ZRD-H868   Dior B30 Countdown Sneaker Dior Gray
3SN279ZND-H000   Dior B30 Countdown Sneaker White
3SN279ZMA-H161   Dior B30 Countdown Sneaker Cream
3SN279ZMA-16140  Dior B30 Sneaker Olive
3SN279ZRF-H900   Dior B30 Reflective Sneaker Triple Black
3SN279ZMA1-6141  Dior B30 Sneaker Black Silver
3SN279ZRD-H763   Dior B30 Sneaker Pink Mesh
3SN279ZRA-H868   Dior B30 Sneaker Anthracite Grey
3SN279ZYK-H882   Dior B30 Sneaker Silver Dark Grey
3SN279ZRD-H166   Dior B30 Reflective CD30 Sneaker Cream Green
3SN27ZIR-16536   Dior B30 Sneaker New Blue Neon Sole
3SN279ZRB-H865   Dior B30 Sneaker Black Blue Grey
3SN279ZEH-H968   Dior B30 Sneaker Light Gray Gray
3SN279ZRB-H560   Dior B30 Sneaker Blue Grey White
```

### B33 系列（14 款，其中 2 FIX + 12 HOLD）

```text
3SN272-ZIR1-6536  Dior B33 White   ← 与下一个使用同一码
3SN272-ZIR1-6536  Dior B33 Black   ← 与上一个使用同一码
（其余 12 款无 SKU，全部 HOLD）
```

---

## 2. 观察到的结构（描述性归纳，**非标准条款，需独立验证**）

```text
B22 : 3SN 231 + <3 位字母/数字后缀> + "-" + <配色码>
      后缀         : ZNG / YK / ZHM / YUL / YJG / YXX / YKB / YIY
      配色码       : H969 / A804 / H960 / H569 / H000 / H865 / H069 / H861
                     / H169 / H968 / H669 / H160 / H962

B30 : 3SN 279 + <3 位后缀> + "-" + <配色码>
      后缀         : ZMB / ZRD / ZND / ZMA / ZRF / ZRA / ZYK / ZEH / ZRB
      配色码       : H969 / H868 / H000 / H161 / H900 / H763 / H882 / H166
                     / H865 / H968 / H560

B33 : 3SN 272 + "-" + <ZIR1> + "-" + <配色码>
      这是唯一一个"款式码内部再带连字符"的形态
```

配色码的两种形态：

```text
形态 1  H + 3 位数字      占绝大多数（H000 / H161 / H865 / H969 …）
形态 2  纯数字 5 位        16140 / 16536 / 6536（以及 6141）
```

```text
RULE-ID: DIO-SKU-01
IF 配色码为 5 位纯数字形态（非 H+3 位）
THEN 与规范形态不一致，必须回源核验是否为录入变体
OUTPUT HOLD
```

---

## 3. 已发现的 3 类真实异常（本文件的核心价值）

### 异常 1 — 同一 SKU 归属两个不同商品（最严重）

```text
3SN272-ZIR1-6536  →  Dior B33 White   （URL: /Dior-X-Denim-Tears-B33-Sneakers-Release-White-Blue-3SN272-ZIR1-6536）
3SN272-ZIR1-6536  →  Dior B33 Black   （URL: /Dior-B33-Denim-Tears-Sneakers-Release-Black-3SN272-ZIR1-6536）
```

```text
RULE-ID: DIO-SKU-02
IF 同一个货号被附着到两个不同的 exact entity
THEN SKU 冲突，两个商品都不得写入该货号
OUTPUT HOLD
```

> 这正是 Agent Contract V2.0 §8 所说的 "component SKU misused as set SKU" 的近亲形态：
> 一个货号被当成两个配色的通用码，违反了"SKU 必须附着到 exact entity"。

### 异常 2 — 同一款式码的两个变体写法

```text
3SN279ZMA-16140   Dior B30 Sneaker Olive
3SN279ZMA1-6141   Dior B30 Sneaker Black Silver
```

两者都以 `3SN279ZMA` 开头，但中段一个是 `-16140`，一个是 `1-6141`。

```text
RULE-ID: DIO-SKU-03
IF 同一前缀下出现"多一位字符 / 连字符位置漂移"的变体
THEN 判定为录入不一致，禁止按形态推断哪个正确
OUTPUT HOLD
```

### 异常 3 — 连字符位置漂移

```text
3SN27ZIR-16536    Dior B30 Sneaker New Blue Neon Sole
3SN272-ZIR1-6536  Dior B33 White / Black
```

```text
RULE-ID: DIO-SKU-04
IF 款式码的连字符位置在不同商品间不一致
THEN 不得任选一种作为全局格式；逐款核验
OUTPUT HOLD
```

---

## 4. 已发现的数据质量缺陷：线上 URL 里的拼写错误

真实存在的线上 URL（取自 v3.2 报告）：

```text
/Denim-Tears-B33-Sneakers-Release-Navy-Dlue-Stripes     ← "Dlue" 应为 "Blue"
/Denim-Tears-B33-Sneakers-Release-Deep-Dlue-Relief      ← "Dlue" 应为 "Blue"
```

```text
RULE-ID: DIO-URL-01
IF 现有 URL 含拼写错误（如 Dlue）
THEN 属 V4.4 §10 的合法迁移触发条件（slug 残留 / 歧义），应重写 + 单跳 301
OUTPUT PASS
```

```text
RULE-ID: DIO-URL-02
IF 现有 URL 缺少品牌前缀（以 /Denim-Tears-... 开头而非 /Dior-...）
THEN 同理触发迁移
OUTPUT PASS
```

---

## 5. 禁止作为 Dior SKU 的字符串

```text
536027xxxxxx                  MrShopPlus Product ID
"unknown"                     占位（deliverables/dior-B2*-unknown-pdp-v32.md 已留档此类失败）
供应商批次码                   如 DC2 / PKGod 等
URL 尾段整体                   /Dior-B22-Black-3SN231ZHM-H960 中的整段
```

---

## 6. 给 Knowledge Pack 的下一步

```text
[ ] 抓取当前线上 Dior-Sneakers 分类页，重建真实商品清单
[ ] 逐款核对 3SN 款式码是否真实存在于页面上
[ ] 解决 3SN272-ZIR1-6536 的归属冲突（必须是白款或黑款其中之一，或两者都不是）
[ ] 确认 Dior 官方款式码的段位含义（3SN + 数字 + 后缀 + "-" + 配色码）
[ ] 判断 B33 全系 12 款是否可走 SKU_OMIT
[ ] 全部完成后把 evidence_status 从 PARTIAL 升为 VERIFIED_CASE_AVAILABLE
```
