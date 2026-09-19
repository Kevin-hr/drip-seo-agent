---
id: seo-core.02-sku-verification
capability: sku-verification
stage: 2
order: 2
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
answers: "这个货号是官方的，还是我们自己编的？"
input_contract:
  identity: object          # 来自 01 的 PASS 结果
  sku_candidates: array     # [{ value, sku_type, evidence:[{tier,source_name,url,exact_entity_match,sku}] }]
  sku_policy: v44_standard | strict_require_verified
output_contract:
  sku_verdict: VERIFIED_SKU | SKU_OMIT | HOLD
  sku: string|null
  reason_code: string
  conflicts: string[]
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/src/DripOps/Rules/V44/V44SkuGate.cs
  - mcp-plugin/src/validation.ts
  - docs/case-studies/PRADA_78_PREFLIGHT_CASE.md（Prada 最大价值所在）
  - docs/architecture/DECISION_LOG.md #001 / #008
test_cases: [TC-001, TC-002, TC-005, TC-006, TC-007]
---

# 02 · SKU Verification

## 0. 为什么这是 Prada 的最大价值

Prada 78 preflight 暴露了一件事（`PRADA_78_PREFLIGHT_CASE.md` §What worked 2）：

> most proposed SKU values in the legacy manifest were internal catalogue codes. Under the active V4.4 standard, those values must not be published as official SKU values.

即：**66 个 `DS-PRA-001 … DS-PRA-078` 看起来是 SKU，实际是我们自己编的内部目录码。**

这不是 Prada 的问题，这是所有人的问题。所以本能力的核心动作是**先问这串字符是谁的**，再决定能不能用。

```text
RULE-ID: SKU-00
IF 无法回答"这串字符来自哪一级来源"
THEN 不得把它当作 SKU
OUTPUT HOLD
```

---

## 1. 输入契约

```text
identity        : 来自 01 的 PASS 结果（必须已 PASS，否则本阶段不得运行）
sku_candidates  : [{
                    value              : string          待裁决的字符串
                    sku_type           : string          来源类型（见 §2）
                    evidence           : [{
                                           tier                : 1..8
                                           source_name         : string
                                           url                 : string
                                           exact_entity_match  : boolean
                                           sku                 : string|null
                                         }]
                  }]
sku_policy      : v44_standard | strict_require_verified   见 §5
```

---

## 2. 来源类型：唯一决定"能不能当 SKU"的字段

```text
可接受（accepted）:
  official_brand_code          品牌官方货号
  authorized_retailer_code     授权零售商货号
  stockx_code                  Tier 2 附着到同一实体
  goat_code                    Tier 3 附着到同一实体

不可接受（rejected）:
  internal_catalog             我们自己的内部目录码（Prada DS-PRA-xxx）
  internal_platform_id         平台商品 ID（MrShopPlus 536xxxxxxxxxxxx）
  supplier_number              供应商编号
  supplier_batch_suffix        供应商批次后缀（DC2 / DC3 / DC4 / 2223 / 8807）
  listing_id                   挂单号
  url_suffix                   URL 残留
  image_filename               图片文件名
  generated_code               生成码
  size                         尺寸
```

```text
RULE-ID: SKU-01
IF sku_type 不在 accepted 清单内
THEN 该候选直接淘汰，不得进入证据裁决
OUTPUT HOLD
```

---

## 3. 结构防线（第二道，防止 sku_type 被填错）

即使 `sku_type` 声称是官方码，字符串形态仍要过一遍：

```text
禁止占位符:
  ^unknown$  ^n/?a$  ^pending$  ^not\s+verified$  ^unverified$
  ^none$  ^null$  ^undefined$  ^tbd$  ^todo$  ^-+$

禁止结构:
  ^536\d{12}$                     → 平台商品 ID
  ^\d{12,}$                       → 供应商 / 挂单号形态
  ^https?://                      → URL
  [/?#&=:%]                       → URL 片段
  \.(?:jpe?g|png|webp|gif|avif)$  → 图片文件名
  ^(?:gen|code|id|ref)[-_]?\d+$   → 生成码
```

```text
RULE-ID: SKU-02
IF 候选命中任一禁止占位符或禁止结构
THEN 淘汰该候选（即使 sku_type 声称合法）
OUTPUT HOLD
```

> 这道防线是**刻意的冗余**。Prada 的真实案例说明：`sku_type` 可能被填错或被默认值污染，所以必须有两种独立的拒绝路径。示例：`536027476120336` 即使被标成 `official_brand_code`，也会被 `^536\d{12}$` 拦下。

短纯数字是**合法**的（Nike base style code `528895`、`528895-153`）。禁止因为"看起来像编号"就误拒。

---

## 4. 裁决规则

```text
RULE-ID: SKU-03
IF 存在候选满足：sku_type ∈ accepted
              AND value 通过 §3 结构防线
              AND 有 ≥1 条 evidence 满足 tier <= 4 AND exact_entity_match = true AND evidence.sku == value
THEN 裁决为 VERIFIED_SKU
OUTPUT VERIFIED_SKU

RULE-ID: SKU-04
IF 无任何候选满足 SKU-03（实体已 PASS，但没有官方码）
THEN 按 §5 的 policy 决定：省略 或 HOLD
OUTPUT SKU_OMIT

RULE-ID: SKU-05
IF 同一 value 被附着到两个不同实体（同码两货）
THEN SKU 冲突，两者都不得写入该码
OUTPUT HOLD

RULE-ID: SKU-06
IF 候选命中占位符或结构拒绝，但被当作"缺失"处理
THEN 不得把"拒绝"记录成"没找到"
OUTPUT HOLD
```

SKU-03 里的四个条件必须**同时**成立，缺一不可：来源类型合法、形态合法、层级达标、附着到同一实体。

---

## 5. sku_policy：唯一一个尚未裁决的设计冲突（必须显式选择）

```text
v44_standard（默认，与仓库锁定标准一致）
  实体 PASS 但无官方码 → SKU_OMIT（完全省略，全链路无 SKU 痕迹）
  合法裁决集合：{ VERIFIED_SKU, SKU_OMIT }
  依据：docs/architecture/DECISION_LOG.md #001 ——
        "Rejected: SEO/PDP 3.2 / Reason: 3.2 requires verified SKU"

strict_require_verified
  实体 PASS 但无官方码 → HOLD
  合法裁决集合：{ VERIFIED_SKU }
  这是"必须先拿到官方码才允许继续"的严格模式
```

**两者的实际差异必须被看见**：

```text
Air Jordan 1 / 106 款 V4.4 run：
  106 款中只有 7 款使用了 Tier 4 确认的官方货号，
  其余 94 款按 V4.4 §5 完全省略 SKU 并成功上架。

  → 在 v44_standard 下：101 款上架
  → 在 strict_require_verified 下：同样的工作会产生 94 个 HOLD
```

```text
RULE-ID: SKU-07
IF 选择 strict_require_verified
THEN 必须在 run 台账中记录该选择及其后果预估
     （不得在批次中途切换 policy）
OUTPUT HOLD

RULE-ID: SKU-08
IF 同一 run 内出现两种 policy 的裁决结果混用
THEN 该 run 的结果不可比，禁止合并统计
OUTPUT HOLD
```

> 本能力**不替你选**。默认值取标准，因为标准是仓库锁定的、且有 Decision 记录背书；严格模式作为可选开关存在，供"必须先有官方码"的业务场景使用。切换需要你显式决定。

---

## 6. 输出契约

```text
VERIFIED_SKU
  sku          = 逐字取自证据的货号（不重排、不改分隔符、不改大小写）
  reason_code  = SKU-OK
  conflicts    = []

SKU_OMIT
  sku          = null
  reason_code  = SKU-ABSENT-<n>      n = 被拒绝/未命中的候选数
  conflicts    = []
  下游要求     : SEO Title / Meta / Product Details 第 5 行 / Schema / slug
                 六处必须同时为"无 SKU 形态"

HOLD
  sku          = null
  reason_code  = SKU-TYPE-REJECTED | SKU-STRUCT-REJECTED | SKU-CONFLICT | SKU-POLICY-STRICT
  conflicts    = [原因码，至少一条]
```

```text
RULE-ID: SKU-09
IF 裁决非 HOLD 但 conflicts 非空
THEN 结构非法（非 HOLD 不得携带未决冲突）
OUTPUT HOLD

RULE-ID: SKU-10
IF 裁决为 HOLD 但 conflicts 为空
THEN 结构非法
OUTPUT HOLD
```

---

## 7. 输出枚举之外一律禁止

```text
禁止写  SKU: Unknown
禁止写  SKU: N/A
禁止写  SKU: Pending
禁止写  SKU: Not verified
禁止写  SKU: 待确认
禁止用空串占位
禁止用 "—" / "-" / "/" 占位
```

不存在"暂时填个占位符以后改"这条路。

---

## 8. 与下一阶段的接口

```text
VERIFIED_SKU → 进入 03-evidence-engine
SKU_OMIT     → 进入 03-evidence-engine（SKU 字段标记为 omitted，但仍要有证据链）
HOLD         → 直接进入 04-hold-decision（禁止调用 05）
```

参考实现：`tests/run-core-tests.mjs` 中 `stageSkuVerification()`。
