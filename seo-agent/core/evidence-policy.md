---
id: core.evidence-policy
kind: rule-set
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - mcp-plugin/src/contracts.ts (EvidenceSchema)
  - dripops/src/DripOps/Rules/V44/V44Models.cs (V44Evidence)
  - dripops/schemas/product-facts.schema.json
  - analysis/v5/EVIDENCE_SCHEMA_SPEC.md (状态: V5.1-DRAFT, 未生效)
  - reports/evidence/**, audit/*/operations.jsonl
---

# 证据体系（core/evidence-policy.md）

## 1. 强制证据块（每个完成 PDP 都必须能贴出）

```text
Evidence:
  Official Name:   <与 Tier 1-4 来源逐字一致的商品名>
  SKU:            <已验证货号 | omitted（SKU_OMIT 时）>
  Color:          <官方配色名；无 Tier 1-4 证据时写 UNVERIFIED>
  Source:         <tier + source_name + url>
  Confidence:     <high | medium | low>
  Status:         <PASS | HOLD | SKU_OMIT>
```

字段名不可改名、不可省略行。`Status` 为 `HOLD` 时不得有任何 SEO 产物。

---

## 2. 运行态 Evidence 对象（唯一被 MCP / C# 实际消费的形态）

```json
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
```

约束：

```text
tier                : int 1..8
source_name         : 非空
url                 : 合法 URI
sku                 : string | null
exact_entity_match  : boolean
colorway            : 作为 Tier 1-4 官方配色资格证据时必填
```

`V44SkuResolution` 外层字段：

```text
verdict / exact_entity / sku / evidence[] / conflicts[] / decision_note
```

---

## 3. Tier 分级（生效口径，取自标准 §3）

```text
Tier 1 — Brand Official / Authorized Retailer          可单独资格化身份与配色
Tier 2 — StockX                                        可单独资格化身份与配色
Tier 3 — GOAT                                          可单独资格化身份与配色
Tier 4 — Established Retailer with structured product data  可单独资格化身份与配色
Tier 5 — Vertical Independent Retailer / Competitor    只产生候选
Tier 6 — Marketplace Seller Listing                    只产生候选
Tier 7 — Supplier Page / Supplier Catalog              只产生候选
Tier 8 — Image Recognition Only                        只产生候选
```

```text
RULE-ID: EVD-TIER-01
IF tier >= 5
THEN 该证据不得资格化 official colorway，也不得资格化身份关键字段
OUTPUT HOLD

RULE-ID: EVD-TIER-02
IF 低阶来源与高阶来源冲突
THEN 以高阶为准；若冲突涉及身份关键字段
OUTPUT HOLD
```

> 注意：Agent Contract V2.0 §6 使用 7 级定义（Tier 1 Brand Official Website / Tier 2 Authorized Retailer / Tier 3 StockX / Tier 4 GOAT / Tier 5 Established Retailer / Tier 6 Marketplace / Tier 7 Supplier）。标准 §3 使用 8 级定义。**运行时代码以 8 级为准**（`tier <= 4` 即"可资格化"）。写规则时统一使用 8 级，引用契约时注明来源。

---

## 4. 事实级证据（facts 层，落盘文件）

`dripops/schemas/product-facts.schema.json`（`additionalProperties: false`）

required：

```text
brand / modelName / primaryColorway / sku / productType / categoryPath /
productIntro / imageMatchVerified(bool) / skuVerified(bool) / evidence(array, minItems 1)
```

optional：

```text
collection / style / material / designDetails / silhouette / upperDesign /
signatureDetails / midsole / brandCategoryPath
```

`evidence[]` 每条 required：

```text
field / value / sourceUrl(uri) / sourceTier / verifiedAt(date-time)
```

`evidence[]` optional：`notes`

实际出现过的 `sourceTier` 取值（历史真实值，非规范枚举）：

```text
T1_OFFICIAL_BRAND
FIRST_PARTY_BACKEND_VISUAL_AUDIT
mature-market
current-product-image
```

```text
RULE-ID: EVD-FACT-01
IF schema 把 sku 定义为 required 且 minLength 1
AND V4.4 的 SKU_OMIT 要求 sku = null
THEN 二者不相容，Agent 必须显式选择：走 SKU_OMIT 时不得强行塞占位符
OUTPUT SKU_OMIT
```

> 这是一个**已知的 schema 冲突**，已记录但未擅自修改冻结 schema。任何 Agent 不得为了让写入通过而伪造 SKU。

---

## 5. 证据落盘目录约定（运行时）

```text
runs/<run-id>/
├── run.json                        run 元数据与冻结的 productIds
├── events.jsonl                    事件流（RUN_CREATED / CATEGORY_SNAPSHOT_SAVED / PRODUCT_CHECKPOINT）
├── products/<ProductID>.json       逐商品状态机快照（唯一断点依据）
├── facts/<ProductID>.facts.json    事实级证据
└── evidence/
    ├── covers/<NN>-<ProductID>.<ext>      封面图
    ├── details/<NN>-<ProductID>-<MM>.<ext> 细节图
    ├── research/<brand>/<source>-<n>.<ext> 外部来源图
    └── selected/<ProductID>-<n>.<ext>     候选池选中图
```

`products/<ProductID>.json` 的关键路径：

```text
stage / inputAuditStatus / releaseStatus
snapshot{existingName, existingSubtitle, existingDescriptionHtml, existingSeoTitle,
         existingSeoKeywords[], existingMetaDescription, existingSlug, isPublished,
         imageUrls[], capturedAt}
facts{...}
draft{productName, seoTitle, keywords[], metaDescription, slug, currentUrl,
      canonicalUrl, urlChangeRequired, redirectFrom, pdpHtml, relatedProducts[]}
validation{isValid, issues[]}
failureCodes[]
```

```text
RULE-ID: EVD-RESUME-01
IF 断线或换 AI 后恢复执行
THEN 先读 PROGRESS.md → run.json → events.jsonl → products/*.json
     以 products/<ProductID>.json 的 stage 为唯一断点依据
     stage == PUBLISHED / VERIFIED 的商品禁止重做
     inputAuditStatus == PASS 的商品禁止重做
OUTPUT PASS
```

历史证据：AJ1 `PROGRESS.md`「断点续跑说明」；Prada 78 guide「按 source_key 续跑，禁止重做已回读成功项」。

---

## 6. 双层验证要求（保存成功不算完成）

```text
RULE-ID: EVD-VERIFY-01
IF 只有后台保存成功的 toast / HTTP 200
THEN 不视为完成
OUTPUT HOLD

RULE-ID: EVD-VERIFY-02
IF 缺少后台回读（重载后标题 / 图片数 / PDP 标记 / 分类一致）
THEN 不视为完成
OUTPUT HOLD

RULE-ID: EVD-VERIFY-03
IF 缺少前台核验（HTTP 200 + canonical + Schema + DOM + 可爬取）
THEN 不视为完成
OUTPUT HOLD
```

前台核验必须逐项记录：`HTTP 200 / Title / Canonical / Product Name & H1 & PDP H2 一致 / SKU 呈现 / 版本标记 / 图片存在 / 内部链接可达`。

历史证据：AJ1 `FINAL-REPORT.md` 对 101 个已上架商品随机抽 24 款逐条核验，24 PASS / 0 FAIL。

---

## 7. 反向验证（红→绿，强制保留输出）

```text
RULE-ID: EVD-NEG-01
IF 声称某校验器有效
THEN 必须先构造一个已知非法的输入，证明它非零退出/报错，再对合法输入证明通过
OUTPUT PASS
```

历史实践（可作为模板）：

```text
复制 manifest → evidence/_invalid-manifest.json
仅改首项 seo.keywords 为 1 个
运行校验器 → 必须退出码非 0 且指出该项错误
删除临时副本 → 对原 manifest 重跑 → 必须退出码 0
红→绿输出写入 PROGRESS.md
```

出处：`deliverables/PRADA-78-END-TO-END-AI-EXECUTION-GUIDE.md`「反向验证」。

---

## 8. 证据禁忌（违反即失败）

```text
禁止 删除证据
禁止 伪造截图
禁止 把失败写成功
禁止 mock 后台
禁止 用 || true 吞掉失败
禁止 把"已发布"当成"已完成"
禁止 手改 JSON 状态
禁止 把密码 / Cookie / Token / storage state 写入任何文件
禁止 静默失败
```
