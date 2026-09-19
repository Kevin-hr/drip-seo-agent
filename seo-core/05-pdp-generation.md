---
id: seo-core.05-pdp-generation
capability: pdp-generation
stage: 5
order: 5
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
answers: "只有在 PASS 之后，才生成什么、按什么顺序生成"
load_gate: final_status = PASS
input_contract:
  identity: object
  sku_resolution: object
  evidence_record: object
output_contract:
  outputs:
    product_name: string
    h1: string
    seo_title: string
    seo_keywords: string[]
    meta_description: string
    url_slug: string
    canonical_url: string
    key_description_html: string
    description_html: string
    image_alt: string[]
    schema: object
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/src/DripOps/Rules/V44/V44Composer.cs（模板逐字来源）
  - dripops/src/DripOps/Rules/V44/V44Validator.cs（校验码）
  - docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md
    （branch codex/hellstar-hoodies-seo-pdp-3.2，438 行）
test_cases: [TC-001, TC-009]
---

# 05 · PDP Generator

## 0. 载入门禁

```text
RULE-ID: GEN-00
IF final_status != PASS
THEN 禁止载入本能力
OUTPUT SEO_GENERATION_FORBIDDEN
```

这是整个 Core 的最后一个闸门。前面四个能力做的所有事，都是为了让它**不是默认被执行**。

---

## 1. 输出顺序（固定 10 项，不得调整）

```text
1  Product Name
2  H1
3  SEO Title
4  SEO Keywords
5  Meta Description
6  URL Slug
7  Canonical URL
8  Key Description
9  Description + Image ALT
10 Product Schema
```

---

## 2. Product Name

```text
构成 = Brand
     + [Collaboration / Collection]（身份关键时才加）
     + Model / Product Name
     + [Product Type]（需要时）
     + Variant / Colorway
```

禁止包含：

```text
供应商措辞（PKGod / DC2 / DM Batch / 纯数字批次后缀）
营销填充词（Top Quality / Best Quality / 1:1 / Authentic Quality）
Fake / Replica
内部编码
未验证标识符
gender / sizing 词
```

```text
RULE-ID: GEN-01
IF Product Name 含 SKU
THEN 违规（V4.4 §6 的名称构成不含 SKU）
OUTPUT HOLD
```

真实清洗对照（AJ1 run）：`Air Jordan 1 Shadow 2.0 Black Light Smoke Grey (DM Batch)` → `Air Jordan 1 Shadow 2.0 Black Light Smoke Grey`。

---

## 3. H1

```text
H1 = Product Name（严格相等）
默认不在 H1 中重复 SKU
```

```text
RULE-ID: GEN-02
IF H1 != Product Name
THEN 阻断（H1-01）
OUTPUT HOLD
```

---

## 4. SEO Title

```text
VERIFIED_SKU → {Product Name} {SKU} Reps | Drip Sneakers
SKU_OMIT     → {Product Name} Reps | Drip Sneakers
```

```text
RULE-ID: GEN-03
IF 有已验证 SKU 但 Title 中 SKU 整词出现次数 != 1
THEN 阻断（SEO-02）
OUTPUT HOLD
```

长度阈值：**V4.4 未定义字符数阈值**。禁止为凑字符数牺牲实体准确性。

---

## 5. SEO Keywords

```text
恰好 5 个，逗号分隔
组合：Exact Product Name / name variation / Colorway + Product Type /
      Verified SKU / high-intent synonym
SKU_OMIT 时：第 4 个换成另一条已核实的产品特征词
```

```text
RULE-ID: GEN-04
IF 关键词数量 != 5 或有重复
THEN 阻断（KW-01 / KW-02）
OUTPUT HOLD
```

---

## 6. Meta Description（固定模板）

```text
VERIFIED_SKU:
  Shop {productName} reps ({sku}) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.

SKU_OMIT:
  Shop {productName} reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

禁用短语（`metaForbiddenPhrases`）：

```text
real QC photos
guaranteed QC photos
guaranteed delivery
7–20 day delivery
7-20 day delivery
authentic quality
1:1 guaranteed
best quality
```

```text
RULE-ID: GEN-05
IF Meta 含任一禁用短语
THEN 阻断（META-02）
OUTPUT HOLD

RULE-ID: GEN-06
IF Meta 缺 QC photos / 30-day returns / 7–20 day shipping 任一措辞
THEN 阻断（META-03）
OUTPUT HOLD
```

> 迁移警告：Dior v3.2 时代的 Meta 文案含 `real QC photos` 与 `7–20 day delivery`，两者在 V4.4 下**都会直接触发 META-02**。

---

## 7. URL Slug 与 Canonical

```text
slugPattern       = ^[a-z0-9]+(?:-[a-z0-9]+)*$
新建（有 SKU）     = /product-name-colorway-sku
新建（无 SKU）     = /product-name-colorway
canonicalTemplate = {origin}/{slug}
storeOrigin       = https://www.dripsneakers.org
```

```text
RULE-ID: GEN-07
IF 现有 live URL 已正确
THEN 必须保留（不改动）
OUTPUT PASS

RULE-ID: GEN-08
IF 触发迁移条件（身份错误 / 供应商噪音 / 歧义 / slug 残留 / 拼写错误）
THEN old → 单跳 301 → final，final = 200，无 redirect chain，
     且 canonical / Schema / sitemap / 内链同步
OUTPUT PASS

RULE-ID: GEN-09
IF Canonical != origin + slug
THEN 阻断（URL-03）
OUTPUT HOLD
```

---

## 8. Key Description（唯一允许的 HTML 结构）

结构 = **1 句已核实决策句** + `<h2>Product Details</h2>` + `<ul>` **恰好 5 个 `<li>`**

第 5 行二选一：

```text
VERIFIED_SKU → <li><strong>SKU:</strong> {sku}</li>
SKU_OMIT     → <li><strong>{Label}:</strong> {一条已核实的产品专属事实}</li>
```

模板（逐字取自 `V44Composer.BuildKeyDescription`）：

```html
<section class="ds-pdp-key-description" data-standard="4.4"><p>[decisionSentence]</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="[BrandInternalUrl]"><strong>[Brand]</strong></a></li><li><strong>Product Type:</strong> [ProductType]</li><li><strong>Model:</strong> [Model]</li><li><strong>Colorway:</strong> [Colorway]</li><li><strong>[fifth.Label]:</strong> [fifth.Value]</li></ul></section>
```

```text
RULE-ID: GEN-10
IF Key Description 为空 / 缺 <h2>Product Details</h2> / <li> 数 != 5
THEN 阻断（KD-01 / KD-02 / KD-03）
OUTPUT HOLD

RULE-ID: GEN-11
IF Brand 行不是带 <strong> 锚文本的真实可爬取内链
THEN 阻断（KD-04 / KD-05 / KD-06）
OUTPUT HOLD

RULE-ID: GEN-12
IF 把完整 Product Name 机械重复为另一个标题
THEN 阻断（KD-07，§13 No Redundant Product-Name Repetition）
OUTPUT HOLD

RULE-ID: GEN-13
IF 无法确证内链目标存在
THEN 不得发明 URL
OUTPUT VERIFY
```

内链优先级：`Verified brand hub → exact model/collection category → broader product category → 不得发明`。

---

## 9. Description 与 Image ALT

```text
Description 字段只承载商品图片，不得混入文字（禁止 <h1|h2|h3|ul|ol>）
```

模板（逐字取自 `V44Composer.BuildDescriptionHtml`）：

```html
<section class="ds-pdp-description" data-standard="4.4"><p><img src="[imageUrl]" alt="[alt]" loading="lazy" /></p>...</section>
```

ALT 规则（`BuildImageAlts`）：

```text
imageCount == 1 → "{productName} Product Image"
imageCount  > 1 → "{productName} Product Image {index}"
```

```text
RULE-ID: GEN-14
IF Description 含 <h1|h2|h3|ul|ol>
THEN 阻断（DESC-01）
OUTPUT HOLD

RULE-ID: GEN-15
IF 有图但缺 alt
THEN 阻断（FE-08）
OUTPUT HOLD
```

---

## 10. Product Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "<Product Name>",
  "brand": { "@type": "Brand", "name": "<Brand>" },
  "category": "<ProductType>",
  "color": "<Colorway>"
}
```

```text
RULE-ID: GEN-16
IF sku 未验证但 Schema 含 sku
THEN 阻断（SCH-03）
OUTPUT HOLD

RULE-ID: GEN-17
IF sku 已验证但 Schema 省略 sku
THEN 阻断（SCH-04）
OUTPUT HOLD

RULE-ID: GEN-18
IF sku = null（SKU_OMIT）
THEN 完全省略 sku 键（不是写 null、不是写空串）
OUTPUT SKU_OMIT
```

---

## 11. 版本标记

```text
正确 : data-standard="4.4"
作废 : data-version="3.1.1" / data-version="3.2"
```

```text
RULE-ID: GEN-19
IF 产物中出现 data-version
THEN 该产物属旧标准，禁止提交
OUTPUT HOLD
```

---

## 12. 可爬取硬门禁

```text
Key Description 必须是可见内容、存在于 rendered HTML / DOM、
非图片内嵌、非仅脚本隐藏。
否则 V4.4 Backend Placement = NOT PASS。
```

---

## 13. 生成之后仍不算完成

```text
生成 ≠ 写入 ≠ 完成

完成 = 生成 PASS
     + 保存回读 PASS
     + 发布回读 PASS（若授权发布）
     + 前台 200 / canonical / Schema / DOM / 可爬取 PASS
```

```text
RULE-ID: GEN-20
IF 只有生成结果，没有三段回读
THEN 不得声称完成
OUTPUT HOLD

RULE-ID: GEN-21
IF 三段回读中任一段失败
THEN 回滚该商品并如实记录
OUTPUT ROLLBACK
```

参考实现：`tests/run-core-tests.mjs` 中 `stagePdpGeneration()` 与 `stageVerification()`。

---

## 14. 本能力不做的事（边界）

```text
不选择商品          ← 由业务输入决定
不判断身份          ← 01 决定
不裁决 SKU          ← 02 决定
不决定是否停止      ← 04 决定
不写后台            ← 由执行层在 Core PASS 之后进行
```

Generator 只做一件事：**把已经判定为真的东西，按标准规定的形式写出来。**
