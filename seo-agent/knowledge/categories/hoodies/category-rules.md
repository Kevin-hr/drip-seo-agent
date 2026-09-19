---
id: knowledge.categories.hoodies.category-rules
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [category:hoodies]
evidence_status: PARTIAL
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/dist/data/runs/hellstar-hoodies-2026-09-02/{run.json,events.jsonl,products/}
  - docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md（438 行）
  - docs/architecture/DECISION_LOG.md（#001 / #008）
  - README.md（v0.5.0 迁移说明）
  - dripops/standards/SEO-PDP-3.2.json
---

# 连帽衫类目规则（knowledge/categories/hoodies/category-rules.md）

## 0. 证据状态

```text
evidence_status : PARTIAL
```

```text
有：1 个真实的 Hellstar 3.2 run（9 款）+ 1 份 438 行的 V4.4 端到端 playbook
无：任何 V4.4 的实际执行记录（V4.4 验证数 = 0）
无：任何已发布 / 已回读 / 已前台验证的 hoodie
```

```text
RULE-ID: HOD-EVID-01
IF 引用本类目经验
THEN 只能说"Hellstar 完成了 3.2 的 Validated/Ready"，不得说"hoodies 已跑通 V4.4"
OUTPUT HOLD
```

---

## 1. 真实执行记录（Hellstar Hoodies，2026-09-02，3.2 标准）

```text
Run ID        : hellstar-hoodies-2026-09-02
标准          : 3.2
分类公开页    : https://www.dripsneakers.org/Hellstar-Hoodies/
分类快照      : published = 0  /  unpublished = 9
商品数        : 9
到达 Ready    : 8
停在 Blocked  : 1
```

Ready 的商品（8 个 ProductID）：

```text
536027371237407   536027374483989   536027374517277   536027374647062
536027374725661   536027405581596   536027452609305   536027558969104
```

Blocked 的商品（1 个）：

```text
536027374677018   Hellstar Flame Face Logo Hoodie Light Blue
```

状态机分布（`events.jsonl`）：

```text
stage        : Discovered 9 / SnapshotCaptured 9 / Validated 16
releaseStatus: Blocked 26 / Ready 8
终态事件     : 无 Published / 无 ReadBackVerified / 无 FrontendVerified
所有商品      : isPublished = false
```

```text
RULE-ID: HOD-EXEC-01
IF 声称 Hellstar 已发布
THEN 该声称与记录不符（分类快照 published = 0，无任何上架事件）
OUTPUT HOLD
```

---

## 2. 单个合格产物的实例（可用于对照 V4.4 差异）

```text
ProductID : 536027371237407
validation: isValid = true
issues    : 1 条 warning — URL-03 LEGACY_SLUG_PRESERVED
slug      : Top-Quality-Hellstar-Sport-Hoodie-Black
```

```text
RULE-ID: HOD-SLUG-01
IF 既有 slug 含供应商前缀（Top-Quality-）且被按 URL 稳定规则保留
THEN 在 3.2 下是 WARN（URL-01 降级）
     在 V4.4 下属于 §10 迁移触发条件（供应商噪音 / slug 残留）
     → 应触发 old → 单跳 301 → final
OUTPUT PASS
```

> 这条差异很关键：**同一个 slug，在 3.2 下被容忍，在 V4.4 下应当迁移。**

---

## 3. 供应商标题形态（Hellstar 的真实噪声）

```text
Hellstar Sport Hoodie-2223
Hellstar Sport Hoodie 8807
Hellstar Sport Hoodie 9903
```

```text
RULE-ID: HOD-NOISE-01
IF 标题以纯数字后缀结尾（-2223 / 8807 / 9903）
THEN 该数字是供应商批次/款号残留，必须剥离，且不得作为 SKU
OUTPUT HOLD
```

对照 T-Shirts 的 `-DC2/-DC3/-DC4`：同一类噪声的不同表现形态。
→ 统一处理规则见 `knowledge/categories/tshirts/category-rules.md` §2。

---

## 4. V4.4 端到端要求（来自 Hellstar playbook）

playbook 路径：`docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md`（438 行）
建立于提交 `c581909 docs: migrate Hellstar workflow to SEO PDP V4.4`。

```text
位置警告：该 playbook **不在本知识层所在的分支上**。
  它位于 codex/hellstar-hoodies-seo-pdp-3.2（tip = c581909），
  而本知识层分支的基线是 codex/upgrade-seo-pdp-v4.4-final（tip = b2505b2）。
  两者都是 main + N，互不包含。
  → 引用该 playbook 时必须指明分支，不能写成"仓库里的某文件"。
```

playbook 确立的要点：

```text
1  决策顺序：Exact Entity PASS 之前不产出任何 SEO
2  SKU 三值裁决：VERIFIED_SKU / SKU_OMIT / HOLD；
   SKU_OMIT 时 sku=null 且在所有公开字段中完全省略
   禁止写 Unknown / N/A / Pending / Not verified
3  Description 只能是商品细节图，不得混入文字
4  URL 稳定性：已正确的 live URL 必须保留；
   仅在有 V4.4 迁移触发器（身份错误 / 未核实 / 供应商噪音 / 歧义 / slug 残留）时迁移；
   迁移须 old → final 单跳 301 + canonical / Schema / sitemap / 内链同步
5  保存成功 ≠ 完成；必须 backend read-back + storefront 200 / canonical / Schema / DOM + 可爬取
6  Key Description：1 句已核实决策句 + 恰好 5 个 Product Details 字段
7  Meta Description 用固定模板（无 SKU 版本）
```

```text
RULE-ID: HOD-V44-01
IF 处理 hoodies
THEN 必须读该 playbook；它是本类目唯一的 V4.4 层文档
OUTPUT PASS
```

---

## 5. 决策记录（为什么类目层用 V4.4）

```text
DECISION_LOG.md #001
  Rejected: SEO/PDP 3.2
  Reason: 3.2 requires verified SKU

DECISION_LOG.md #008
  migrate its decision layer completely to the sole active V4.4 standard
```

```text
对 hoodies 的意义：
  3.2 下 9 款 Hellstar 只有 8 款过 Validated；
  若其中有因 SKU 缺失而 Blocked 的，V4.4 的 SKU_OMIT 可能解锁。
  → 这是待验证的假设，需在真实数据上确认，不得直接断言。
```

---

## 6. facts 层的实际取值（注意非规范值）

Hellstar 的 facts 里出现过非规范的 `sourceTier` 取值：

```text
mature-market
current-product-image
```

而 T-Shirts run 用的是：

```text
T1_OFFICIAL_BRAND
FIRST_PARTY_BACKEND_VISUAL_AUDIT
```

```text
RULE-ID: HOD-FACT-01
IF facts 中出现非 Tier 编号的 sourceTier 取值
THEN 该证据不满足 V4.4 的 tier 1..8 约束（EvidenceSchema: tier int 1..8）
     → 必须重新映射为合规 tier，否则该证据不可用于裁决
OUTPUT HOLD
```

> 这是把旧 run 迁到 V4.4 时容易被忽略的一处硬伤：**旧 facts 的 tier 字段不符合新 schema。**

---

## 7. 未解决项

```text
[ ] 0 款 hoodie 通过 V4.4 验证
[ ] 0 款 hoodie 已发布（分类快照 published = 0）
[ ] 1 款 Blocked（536027374677018）原因未记录
[ ] 8 款 Ready 从未进入 execute / verify
[ ] 旧 facts 的 sourceTier 取值不合规
[ ] events.jsonl 缺终态事件（与 T-Shirts 同一可观测性缺陷）
```

## 关联文件

```text
类目案例   : knowledge/categories/hoodies/successful-case.md
类目规则   : knowledge/categories/tshirts/category-rules.md（噪声类型通用）
模板       : core/pdp-template-v4.4.md
```
