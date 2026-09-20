---
id: core.sku-validation
kind: rule-set
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/src/DripOps/Rules/V44/V44SkuGate.cs
  - dripops/src/DripOps/Rules/V44/V44Models.cs (V44Verdict)
  - mcp-plugin/src/validation.ts (validateSkuResolution / skuRejectionReason)
  - mcp-plugin/src/contracts.ts (SkuResolutionSchema)
---

# SKU 核验（core/sku-validation.md）

## 1. 只有三种裁决，多一个都不合法

```text
VERIFIED_SKU   SKU 被 Tier 1–4 来源附着到同一 exact entity → 写入并只在 SEO Title 出现一次
SKU_OMIT       Exact Entity PASS，但无独立可验证 SKU → 完全省略，不写占位符
HOLD           身份关键证据冲突 → 不创建 plan、不写任何东西
```

代码枚举（不可扩展）：`SkuResolutionSchema.verdict = z.enum(["VERIFIED_SKU","SKU_OMIT","HOLD"])`，C# 侧对应 `V44Verdict`。

---

## 2. Accepted（可作为 SKU）

```text
Official Brand Product Code          品牌官方货号
Authorized Retailer Style Code       授权零售商货号
StockX Exact Product Code            Tier 2 来源附着到同一实体
GOAT Exact Product Code              Tier 3 来源附着到同一实体
```

短纯数字是**合法的**（例如 Nike base style code `528895`、`528895-153`）。禁止因为"看起来像数字"就拒绝。

---

## 3. Rejected（禁止作为 SKU）

标准 §5 明令禁止：

```text
Drip product ID（MrShopPlus Product ID）
Supplier number
URL suffix
Image filename
Listing ID
Size
Generated code
Internal ID
占位符：Not verified / Unknown / Pending / N/A
```

代码层的占位符拒绝正则（`skuRejectionReason` / `V44SkuGate.ForbiddenPlaceholders`）：

```text
^unknown$   ^n/?a$   ^pending$   ^not\s+verified$   ^unverified$
^none$      ^null$   ^undefined$ ^tbd$   ^todo$   ^-+$
```

代码层的结构拒绝正则（`ForbiddenStructures`）与对应原因：

```text
^536\d{12}$                        → "MrShopPlus internal Product ID"
^\d{12,}$                          → "bare long numeric identifier (supplier / listing ID shape)"
^https?://                         → "URL"
[/?#&=:%]                          → "URL suffix or path fragment"
\.(?:jpe?g|png|webp|gif|avif)$     → "image filename"
^(?:gen|code|id|ref)[-_]?\d+$      → "generated code"
```

真实反例（禁止重犯）：

```text
536027371237407      ← MrShopPlus Product ID，命中 ^536\d{12}$
DS-PRA-010           ← 内部目录码（internal_catalog），属 Internal ID
Prada Logo T-Shirt-DC2 的 "DC2"   ← Supplier noise，不是 SKU
Hellstar Sport Hoodie-2223 的 "2223" ← Supplier noise
```

---

## 4. 规则块

```text
RULE-ID: SKU-01
IF verdict = VERIFIED_SKU
THEN sku 必须非空，且 ≥1 条 evidence 满足 tier <= 4 AND exact_entity_match = true AND evidence.sku == sku 逐字相等
OUTPUT PASS

RULE-ID: SKU-02
IF verdict = VERIFIED_SKU 但 sku 为空
THEN 结构非法（错误信息 "VERIFIED_SKU requires a non-empty sku."）
OUTPUT HOLD

RULE-ID: SKU-03
IF verdict = SKU_OMIT
THEN sku 必须为 null（错误信息 "SKU_OMIT requires sku=null."）
OUTPUT SKU_OMIT

RULE-ID: SKU-04
IF verdict = HOLD 但 conflicts 为空
THEN 结构非法（错误信息 "HOLD requires at least one identity-critical conflict/reason."）
OUTPUT HOLD

RULE-ID: SKU-05
IF verdict != HOLD 但 conflicts 非空
THEN 结构非法（错误信息 "A non-HOLD resolution cannot carry unresolved identity-critical conflicts."）
OUTPUT HOLD

RULE-ID: SKU-06
IF evidence 数组为空 或 decision_note 为空
THEN 结构非法（EVID-01 / EVID-02）
OUTPUT HOLD

RULE-ID: SKU-07
IF 找不到可验证 SKU 且实体 PASS
THEN 省略 SKU：SEO Title 用无 SKU 模板、Meta 用无 SKU 模板、Product Details 第 5 行换为一条已核实的产品专属事实、Schema 完全省略 sku
OUTPUT SKU_OMIT
```

---

## 5. 二次校验（草稿层，防止 SKU 泄漏与漏写）

`V44Validator` 在草稿生成后再次拦截：

```text
SKU-01  verdict = VERIFIED_SKU 但草稿里没有 SKU         → ERROR 阻断
SKU-02  SEO Title 未包含已验证 SKU                       → ERROR 阻断
SKU-03  verdict = SKU_OMIT 但草稿里出现标识符形态值       → ERROR 阻断
        检测函数 FindSupplierIdentifierLeak()
        检测正则 \b536\d{12}\b 或 \b\d{12,}\b
```

```text
RULE-ID: SKU-08
IF SEO Title 中出现 SKU 且出现次数 != 1
THEN 阻断（SEO-02：SKU 必须在 Title 中出现且仅一次，整词计数）
OUTPUT HOLD
```

---

## 6. Evidence 对象在 SKU 裁决中的最小形状

```json
{
  "verdict": "VERIFIED_SKU | SKU_OMIT | HOLD",
  "exact_entity": {
    "brand": "",
    "model": "",
    "product_type": "",
    "colorway": "",
    "collaboration_or_collection": null
  },
  "sku": "",
  "evidence": [
    {
      "tier": 1,
      "source_name": "",
      "url": "",
      "product_name": "",
      "colorway": "",
      "sku": "",
      "exact_entity_match": true,
      "notes": ""
    }
  ],
  "conflicts": [],
  "decision_note": ""
}
```

字段约束（`mcp-plugin/src/contracts.ts` → `EvidenceSchema`）：

```text
tier                : int, 1..8（超出即非法）
source_name         : string, minLength 1
url                 : string, uri
product_name        : optional
colorway            : optional；但作为 Tier 1–4 配色资格证据时必填
sku                 : string | null | optional
exact_entity_match  : boolean
notes               : optional
```

---

## 7. 门禁位置（Agent 需知道拦截发生在哪一层）

```text
Layer 1  MCP prepare_product_v44 处理器
         先调用 validateEntityResolution(...)（= validateSkuResolution + validateColorwayEvidence + validateVisualColorSeparation）
         失败 → failure(...) 且不创建 plan_id

Layer 2  MCP 层显式 HOLD 阻断
         verdict === "HOLD" → 返回失败
         原文："Exact entity/SKU verdict is HOLD. V4.4 forbids preparing a publish-ready PDP."
         只回传 conflicts

Layer 3  DripOps V44SkuGate.Validate()（C# 侧同规则复算）

Layer 4  DripOps V44Validator 草稿层 SKU-01/02/03 与 SEO-02

Layer 5  execute_product_v44 的 8 道守卫（plan_id 格式 → plan 存在 → product 匹配 →
         未执行过 → validation_status=PASS → standard_hash 未变 → 声明 hash 匹配 → snapshot_hash 未过期）
```

任何一层返回失败即终止，不得绕行到下一层。
