---
id: knowledge.brands.moncler.sku-pattern
kind: knowledge-pack
version: 0.0.0
status: PLACEHOLDER
schema: agent-readable-v1
applies_to: [brand:moncler]
evidence_status: NO_EVIDENCE
evidence_basis: []
---

# Moncler SKU 模式（knowledge/brands/moncler/sku-pattern.md）

## 0. 证据状态：NO_EVIDENCE

```text
已知的 Moncler 官方货号形态：0 条
已知的 Moncler 内部码形态：0 条
```

```text
RULE-ID: MON-SKU-00
IF 需要为 Moncler 商品判定 SKU
THEN 本文件无法提供任何品牌专属知识，只能依赖 core/sku-validation.md 的通用规则
OUTPUT VERIFY
```

---

## 1. 在无品牌知识时，通用规则仍然可用

即使不知道 Moncler 的货号长什么样，以下判断依然可执行：

```text
IF 候选 SKU 命中 ^536\d{12}$                     THEN 拒绝（MrShopPlus Product ID）
IF 候选 SKU 命中 ^\d{12,}$                       THEN 拒绝（供应商/挂单号形态）
IF 候选 SKU 命中 [/?#&=:%]                       THEN 拒绝（URL 片段）
IF 候选 SKU 命中 \.(jpe?g|png|webp|gif|avif)$    THEN 拒绝（图片文件名）
IF 候选 SKU 命中 ^(gen|code|id|ref)[-_]?\d+$      THEN 拒绝（生成码）
IF 候选 SKU 命中 ^(unknown|n/?a|pending|not\s+verified|unverified|none|null|undefined|tbd|todo|-+)$
                                                  THEN 拒绝（占位符）
IF 候选 SKU 有 Tier 1-4 证据附着到 exact entity   THEN VERIFIED_SKU
IF 候选 SKU 无上述证据                            THEN SKU_OMIT
IF 存在身份关键冲突                               THEN HOLD
```

这 8 条不依赖品牌，可直接用于 Moncler。

---

## 2. 建立 Moncler SKU 模式的取证步骤

```text
STEP 1  取 ≥10 款已确认为同一 entity 的商品
STEP 2  对每款记录：后台 SKU 字段原文、官方来源货号原文、线上 URL 中的码
STEP 3  做三列比对，找出：
          哪些是官方货号（Tier 1-4 来源也出现同一串）
          哪些是内部码（只在我们系统里出现）
          哪些是 URL 残留
STEP 4  归纳官方货号的段位结构（长度 / 前缀 / 分隔符 / 配色码位置）
STEP 5  归纳内部码形态，并明确写进本文件的 Rejected 段
STEP 6  验证：随机取 3 款，用归纳出的结构去预测其货号格式，与事实比对
```

```text
RULE-ID: MON-SKU-01
IF STEP 6 的预测与事实不符
THEN 结构归纳失败，不得写入本文件作为规则
OUTPUT HOLD
```

---

## 3. 已确认为官方货号

```text
（空缺）
```

## 4. 已确认为内部码 / 禁止使用

```text
（空缺）

通用禁止项（不依赖品牌，见 core/sku-validation.md §3）：
  MrShopPlus Product ID、Supplier number、URL suffix、Image filename、
  Listing ID、Size、Generated code、Internal ID
```

## 5. 待确认

```text
[ ] Moncler 是否使用 "H" 类 + 数字的配色码（如 Dior 的 H000 体系）？  待确认
[ ] 是否常见 "批次码当 SKU" 的供应商形态？                            待确认
[ ] 是否存在官方码多段空格分隔的写法（如 Prada 的 2EG479 D7C F0008）？ 待确认
```
