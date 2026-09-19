---
id: core.pdp-template-v4.4
kind: template
version: 4.4
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
load_gate: entity_status = PASS
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/src/DripOps/Rules/V44/V44Composer.cs (BuildKeyDescription / BuildDescriptionHtml / BuildSchema / BuildImageAlts)
  - dripops/standards/SEO-PDP-V4.4.json
---

# PDP 模板 V4.4（core/pdp-template-v4.4.md）

## 0. 载入门禁

```text
RULE-ID: TPL-GATE-01
IF entity_status != PASS
THEN 禁止载入本模板，禁止生成任何字段
OUTPUT SEO_GENERATION_FORBIDDEN
```

---

## 1. 强制输出顺序（10 项）

```text
1. Product Name
2. H1
3. SEO Title
4. SEO Keywords
5. Meta Description
6. URL Slug
7. Canonical URL
8. Key Description
9. Description Rule / Image ALT
10. Product Schema
```

---

## 2. Product Name（§6）

构成：

```text
Brand
+ Collaboration / Collection（身份关键时才加）
+ Model / Product Name
+ Product Type（需要时）
+ Variant / Colorway
```

禁止包含：

```text
供应商措辞（PKGod / Pkgod / batch names，例如 "DC2"、"DM Batch"、纯数字后缀）
营销填充词（Top Quality / Best Quality / 1:1 / Authentic Quality）
Fake / Replica
内部编码
未验证标识符
对外字段中的 gender / sizing 词
```

```text
RULE-ID: TPL-NAME-01
IF Product Name 命中供应商词 / 营销词 / gender-sizing 词 / 禁用域名
THEN 阻断（NAME-S1 / NAME-G1 / NAME-D1）
OUTPUT HOLD
```

真实清洗实例（可作对照，来自 AJ1 run 的"原名称 → 最终名称"）：

| 原名称 | 最终名称 |
|---|---|
| `Air Jordan 1 Shadow 2.0 Black Light Smoke Grey (DM Batch)` | `Air Jordan 1 Shadow 2.0 Black Light Smoke Grey` |
| `Air Jordan 1 Low Light Arctic Orange Pink` | `Air Jordan 1 Low Light Arctic Orange` |
| `Air Jordan 1 NRG OG High "NOT FOR RESALE" Varsity Red` | `Air Jordan 1 High OG NRG NOT FOR RESALE Varsity Red` |
| `Air Jordan 1 Retro High Electro Orange` | `Air Jordan 1 Retro High OG Electro Orange` |

---

## 3. H1（§6）

```text
H1 = Product Name
```

默认不在 H1 中重复 SKU。

```text
RULE-ID: TPL-H1-01
IF H1 != Product Name（严格相等）
THEN 阻断（H1-01）
OUTPUT HOLD
```

---

## 4. SEO Title（§7）

```text
有 SKU : {Product Name} {Verified SKU} Reps | Drip Sneakers
无 SKU : {Product Name} Reps | Drip Sneakers
```

JSON 模板：

```text
"{productName} {sku} {intent} | {site}"
"{productName} {intent} | {site}"
titleIntentTerm = "Reps"
siteName        = "Drip Sneakers"
```

```text
RULE-ID: TPL-TITLE-01
IF SEO Title 不符模板
THEN 阻断（SEO-01）
OUTPUT HOLD

RULE-ID: TPL-TITLE-02
IF 有已验证 SKU 但 Title 中 SKU 出现次数 != 1
THEN 阻断（SEO-02，整词计数）
OUTPUT HOLD
```

长度阈值：**V4.4 未定义字符数阈值**。禁止为凑字数牺牲实体准确性（§9 hard rule: "Do not sacrifice entity accuracy merely to force a character count."）。
> 事实提醒：`Meta 120–160` 属已淘汰的 3.2 标准，不是 V4.4 要求。

---

## 5. SEO Keywords（§8）

```text
keywordCount = 5，逗号分隔
组合：Exact Product Name / variation / Colorway + Product Type / Verified SKU / high-intent synonym
```

```text
RULE-ID: TPL-KW-01
IF keyword 数量 != 5
THEN 阻断（KW-01）
OUTPUT HOLD

RULE-ID: TPL-KW-02
IF keyword 重复
THEN 阻断（KW-02）
OUTPUT HOLD
```

---

## 6. Meta Description（§9，固定组合）

```text
有 SKU : Shop {productName} reps ({sku}) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
无 SKU : Shop {productName} reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

```text
metaApprovedAssurances  = ["QC photos", "30-day returns", "7–20 day shipping"]
metaForbiddenPhrases    = ["real QC photos", "guaranteed QC photos", "guaranteed delivery",
                          "7–20 day delivery", "7-20 day delivery",
                          "authentic quality", "1:1 guaranteed", "best quality"]
```

信息优先级：

```text
Exact Product Name → Reps intent → Verified SKU → Drip Sneakers → QC photos →
30-day returns → 7–20 day shipping → identity-critical feature
```

```text
RULE-ID: TPL-META-01
IF Meta 不符 §9 模板
THEN 阻断（META-01）
OUTPUT HOLD

RULE-ID: TPL-META-02
IF Meta 含 metaForbiddenPhrases 任一项
THEN 阻断（META-02）
OUTPUT HOLD

RULE-ID: TPL-META-03
IF Meta 缺少 QC photos / 30-day returns / 7–20 day shipping 任一措辞
THEN 阻断（META-03）
OUTPUT HOLD
```

---

## 7. URL Slug 与 Canonical（§10）

```text
slugPattern       = ^[a-z0-9]+(?:-[a-z0-9]+)*$
新建（有 SKU）    = /product-name-colorway-sku
新建（无 SKU）    = /product-name-colorway
canonicalTemplate = {origin}/{slug}
storeOrigin       = https://www.dripsneakers.org
```

URL 稳定性规则：

```text
RULE-ID: TPL-URL-01
IF 现有 live URL 已正确
THEN 必须保留，不得迁移
OUTPUT PASS

RULE-ID: TPL-URL-02
IF 触发迁移条件（身份错误/未核实、供应商噪音、歧义、slug 残留）
THEN old URL → direct 301 → final URL（单跳，无 redirect chain），final URL = 200，且 canonical / Schema / sitemap / 内链同步
OUTPUT PASS

RULE-ID: TPL-URL-03
IF slug 违反小写 ASCII 模式 且 该 slug 为未改动的既有 slug
THEN 降级为 WARN 而非阻断（URL-01）
OUTPUT VERIFY

RULE-ID: TPL-URL-04
IF 需迁移但缺少 redirectFrom
THEN 阻断（URL-02）
OUTPUT HOLD

RULE-ID: TPL-URL-05
IF Canonical != origin + slug
THEN 阻断（URL-03）
OUTPUT HOLD
```

真实实践：AJ1 run 对已正确 slug 采用保留策略（ordinal 62 保留 `air-jordan-1-retro-low-chicago`，未强行改成 low-chicago）。

---

## 8. Key Description（§11 / §12 / §13 / §15）— 唯一允许的 HTML 结构

结构 = **1 句已核实决策句** + `<h2>Product Details</h2>` + `<ul>` **恰好 5 个 `<li>`**。

第 5 行二选一（`V44Composer.ResolveFifthField`）：

```text
有已验证 SKU → Label = "SKU", Value = sku          （V4.4 §14）
无 SKU        → 换为一条已核实的产品专属事实（V4.4 §12）
```

模板（取自 `V44Composer.BuildKeyDescription`，逐字）：

```html
<section class="ds-pdp-key-description" data-standard="4.4"><p>[decisionSentence]</p><h2>Product Details</h2><ul><li><strong>Brand:</strong> <a href="[facts.BrandInternalUrl]"><strong>[entity.Brand]</strong></a></li><li><strong>Product Type:</strong> [entity.ProductType]</li><li><strong>Model:</strong> [entity.Model]</li><li><strong>Colorway:</strong> [entity.Colorway]</li><li><strong>[fifth.Label]:</strong> [fifth.Value]</li></ul></section>
```

规则：

```text
RULE-ID: TPL-KD-01
IF Key Description 为空                           THEN 阻断（KD-01）
IF 缺少 <h2>Product Details</h2>                  THEN 阻断（KD-02）
IF <li> 数量 != 5                                 THEN 阻断（KD-03）
IF Brand 行不是带 <strong> 锚文本的真实内链        THEN 阻断（KD-04）
IF Brand 链接不指向 Drip 站点（以 StoreOrigin 前缀判定） THEN 阻断（KD-05）
IF 锚文本不含真实品牌名                            THEN 阻断（KD-06）
IF 把完整 Product Name 机械重复为另一个标题         THEN 阻断（KD-07，§13 No Redundant Product-Name Repetition）
IF 缺少长度 >= 20 字符的 <p> 决策句                THEN 阻断（KD-08）
OUTPUT HOLD
```

内链优先级（§15）：

```text
Verified brand hub → exact model/collection category → broader product category → No guessed link; VERIFY
```

```text
RULE-ID: TPL-KD-02
IF 无法确证内链目标存在
THEN 不得发明 URL
OUTPUT VERIFY
```

---

## 9. Description 与 Image ALT（§16）

```text
Description 字段只承载商品图片，不得混入文字（禁止 <h1|h2|h3|ul|ol>）
```

模板（取自 `V44Composer.BuildDescriptionHtml`，逐字）：

```html
<section class="ds-pdp-description" data-standard="4.4"><p><img src="[imageUrl]" alt="[alt]" loading="lazy" /></p>...</section>
```

ALT 生成规则（`BuildImageAlts`）：

```text
imageCount == 1 → "{productName} Product Image"
imageCount  > 1 → "{productName} Product Image {index}"
```

```text
RULE-ID: TPL-DESC-01
IF Description 含 <h1|h2|h3|ul|ol>
THEN 阻断（DESC-01）
OUTPUT HOLD

RULE-ID: TPL-ALT-01
IF 有图但缺 alt
THEN 阻断（FE-08）
OUTPUT HOLD
```

> 版本标记事实披露：V4.4 组件输出的属性是 **`data-standard="4.4"`**。V4.4 **不存在** `data-version` 输出；`data-version="3.1.1"` / `data-version="3.2"` 均属已淘汰标准。

---

## 10. Product Schema（§20）

最小必需字段：

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
RULE-ID: TPL-SCH-01
IF sku 未验证但 Schema 含 sku
THEN 阻断（SCH-03）
OUTPUT HOLD

RULE-ID: TPL-SCH-02
IF sku 已验证但 Schema 省略 sku
THEN 阻断（SCH-04）
OUTPUT HOLD

RULE-ID: TPL-SCH-03
IF Schema 非法 JSON 或缺少 name / brand / category / color 任一
THEN 阻断（SCH-01 / SCH-02）
OUTPUT HOLD

RULE-ID: TPL-SCH-04
IF sku = null（SKU_OMIT）
THEN Schema 完全省略 sku 键（不是写 null、不是写空串）
OUTPUT SKU_OMIT
```

---

## 11. 可爬取硬门禁（§17）

```text
Key Description 必须是可见内容、存在于 rendered HTML / DOM、非图片内嵌、非仅脚本隐藏。
否则 V4.4 Backend Placement = NOT PASS。
```

---

## 12. 参考实现（Agent 可直接对齐的代码位置）

| 组件 | 文件 | 职责 |
|---|---|---|
| V4.4 Composer | `dripops/src/DripOps/Rules/V44/V44Composer.cs` | 确定性生成上述 HTML / Schema |
| V4.4 Validator | `dripops/src/DripOps/Rules/V44/V44Validator.cs` | 上述全部校验码 |
| V4.4 Frontend Auditor | `dripops/src/DripOps/Rules/V44/V44FrontendAuditor.cs` | FE-01..FE-10 |
| 标准 JSON | `dripops/standards/SEO-PDP-V4.4.json` | 模板字符串与阈值 |
| MCP 契约 | `mcp-plugin/src/contracts.ts` | 输入输出 schema |

Agent **不得**自行发明模板字符串；模板只允许来自上述来源。
