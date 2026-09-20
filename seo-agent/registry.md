---
id: seo-agent.registry
kind: registry
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
supersedes: none
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - seo-agent/core/**
  - seo-agent/knowledge/**
  - seo-agent/cases/**
  - mcp-plugin/src/server.ts（12 个 MCP 工具的实际签名）
  - dripops/src/DripOps/Rules/V44/**
---

# Agent 技能注册表（registry.md）

> 任何 AI Agent 读本文件即可知道：有哪些技能、输入什么、输出什么、什么情况下必须停下。
> 本文件不重复规则细节，只做路由。规则正文在各 `skill.reads` 指向的文件里。

---

## 0. 使用方式

```text
STEP 1  在 §2 的技能索引里找到需要的技能
STEP 2  读该技能的 skill.reads（规则正文）
STEP 3  按 skill.input 准备输入
STEP 4  按 skill.output 判定结果
STEP 5  遇到 skill.fails_with 里的状态 → 立即停止，不要尝试绕过
```

```text
全局前置：无论做哪个技能，都必须先读 core/universal-seo-rules.md
全局禁令：entity_status != PASS 时，禁止生成任何 SEO 字段
```

---

## 1. 技能索引（机器可读）

| skill.id | 层 | 门禁 | 可能输出 |
|---|---|---|---|
| `product-verification` | 身份 | 必做（第一个） | `PASS` / `HOLD` / `VERIFY` |
| `sku-verification` | 身份 | 必做 | `VERIFIED_SKU` / `SKU_OMIT` / `HOLD` |
| `colorway-evidence-check` | 身份 | 必做 | `PASS` / `HOLD` |
| `snapshot-completeness-check` | 输入 | 必做 | `PASS` / `SNAPSHOT_INCOMPLETE` |
| `duplicate-detection` | 身份 | 条件必做 | `EXACT_DUPLICATE` / `COLOR_VARIANT` / `MODEL_VARIANT` / `VERIFY` / `HOLD` |
| `pdp-composition` | 产出 | 需 PASS | `PASS` / `SEO_GENERATION_FORBIDDEN` |
| `pdp-validation` | 质检 | 必做 | `PASS` / `HOLD` |
| `frontend-audit` | 质检 | 必做 | `PASS` / `ROLLBACK` |
| `backend-write` | 执行 | 需 plan | `PASS` / `ROLLBACK` |
| `hold-triage` | 终止 | 任意 | `HOLD` / `BLOCKED` / `ROLLBACK` |
| `run-resume` | 运维 | 断线时 | `PASS` |
| `reverse-validation` | 质检 | 声称校验有效时 | `PASS` |
| `brand-pack-creation` | 扩展 | 新品牌 | `PASS` / `PARTIAL` |
| `category-pack-creation` | 扩展 | 新类目 | `PASS` / `PARTIAL` |

---

## 2. 技能定义

### 2.1 `product-verification`

```text
Skill:
  product-verification

Purpose:
  Verify official product identity.
  确认商品到底是什么，然后才允许做 SEO。

Input:
  supplier_product      (供应商标题 / 后台名称 / 图片集 / 现有字段)
  visual_observation    (只含客观描述：garment_type / base_color_visual / graphics / construction)
  candidate_sources[]   (Tier 1-7 搜索候选)

Output:
  PASS : Confirmed product
         {"entity_status":"PASS",
          "entity":{"brand":"","model":"","product_type":"","colorway":"",
                    "collaboration_or_collection":null}}
  HOLD : Insufficient evidence
         {"entity_status":"HOLD","conflicts":["<至少一条>"],"decision_note":"<非空>"}
  VERIFY: 需要更多证据再判

Reads:
  core/identity-verification.md
  core/universal-seo-rules.md §1 §7
  knowledge/brands/<brand>/brand-rules.md

Fails_with:
  HOLD     — 供应商标题无法支撑身份
  HOLD     — 官方商品名无法与 Tier 1-4 对齐
  HOLD     — 配色冲突 / SKU 冲突 / Product Type 冲突 / Collection 冲突
  HOLD     — 多个可能商品无法排除
  HOLD     — 联名方不可核实 / 供应商口语命名

Evidence:
  audit/*prada-78/identity-audit.json
  BLOCKED.md (air-jordan-1-106)
```

### 2.2 `sku-verification`

```text
Skill:
  sku-verification

Purpose:
  Decide whether a SKU may be written, must be omitted, or must stop the run.

Input:
  sku_resolution {
    verdict?, exact_entity{brand,model,product_type,colorway},
    sku, evidence[{tier,source_name,url,product_name,colorway,sku,exact_entity_match}],
    conflicts[], decision_note
  }

Output:
  VERIFIED_SKU : SKU 由 tier<=4 且 exact_entity_match=true 的来源附着到同一实体
  SKU_OMIT     : sku=null，全链路省略（Title / Meta / 5th field / Schema / slug）
  HOLD         : conflicts 非空，不创建 plan，不写任何东西

Reads:
  core/sku-validation.md
  knowledge/brands/<brand>/sku-pattern.md

Fails_with:
  HOLD — VERIFIED_SKU 但 sku 为空
  HOLD — SKU_OMIT 但 sku 非 null
  HOLD — HOLD 但 conflicts 为空
  HOLD — 非 HOLD 但 conflicts 非空
  HOLD — 候选命中占位符或结构拒绝正则

Forbidden as SKU:
  MrShopPlus Product ID (^536\d{12}$) / ^\d{12,}$ / URL / URL 片段 / 图片文件名 /
  generated code / supplier number / listing ID / size / internal ID /
  unknown|n/a|pending|not verified|unverified|none|null|undefined|tbd|todo|-+
```

### 2.3 `colorway-evidence-check`

```text
Skill:
  colorway-evidence-check

Purpose:
  Prevent visual color from being promoted to official colorway.

Input:
  exact_entity.colorway
  evidence[]
  visual_observation.base_color_visual

Output:
  PASS : colorway 有 tier<=4 且 exact_entity_match=true 的证据支撑
  HOLD : 无上述证据（"set verdict=HOLD"）

Reads:
  core/identity-verification.md §3
  core/hold-policy.md §1.5

Fails_with:
  HOLD — 只有 Tier 5-8 给出配色名（marketplace、supplier never qualifies an official colorway）
  HOLD — visual-leak：视觉色与官方配色相同但无 Tier 1-4 证据
  HOLD — visual_observation 缺 garment_type 或 base_color_visual
  HOLD — base_color_visual 命中 SKU/style code 形态
```

### 2.4 `snapshot-completeness-check`

```text
Skill:
  snapshot-completeness-check

Purpose:
  Refuse to run on an incomplete product snapshot.

Input:
  ProductSnapshot {
    product_id, current_name, current_url, current_sku, supplier_code,
    category, price, inventory, variants, description, key_description,
    seo_title, seo_keywords, meta_description, images, image_urls, image_alt, schema
  }

Output:
  PASS               : 四项 STOP 条件全部存在
  SNAPSHOT_INCOMPLETE: 缺任一 → STOP EXECUTION

Reads:
  core/identity-verification.md §2
  core/hold-policy.md §1.2

Fails_with:
  SNAPSHOT_INCOMPLETE — 缺 Product Images
  SNAPSHOT_INCOMPLETE — 缺 Existing Description
  SNAPSHOT_INCOMPLETE — 缺 Current SEO Fields
  SNAPSHOT_INCOMPLETE — 缺 Variants

Note:
  运行时开关 requireCompleteSnapshot 默认 false（报告模式），
  但 Agent 不得因此跳过本技能。
  实现：V44SnapshotCompleteness.Evaluate(ProductSnapshot)
```

### 2.5 `duplicate-detection`

```text
Skill:
  duplicate-detection

Purpose:
  Decide whether two listings are the same physical product.

Input:
  two listings: {name, colorway, construction, sku_or_model_evidence, generated_slug}

Output:
  EXACT_DUPLICATE | COLOR_VARIANT | MODEL_VARIANT | VERIFY | HOLD

Reads:
  core/identity-verification.md §7
  knowledge/categories/tshirts/category-rules.md §2（成对 DC 后缀）
  knowledge/categories/sneakers/category-rules.md §3

Forbidden basis:
  same price + same inventory + same description hash  ← 这不是重复的判据

Required basis:
  Same physical product + Same design + Same colorway + Same construction + Same SKU/model evidence

Fails_with:
  HOLD — 生成 slug 完全相同（最强重复信号）
  HOLD — 剥掉供应商后缀（-DC2 / -2223）后同名
```

### 2.6 `pdp-composition`

```text
Skill:
  pdp-composition

Purpose:
  Generate the V4.4 SEO payload and PDP HTML.

Gate:
  entity_status = PASS（否则 SEO_GENERATION_FORBIDDEN）

Input:
  exact_entity, facts, sku_verdict, standard

Output:
  PASS                   : 10 项产物齐备
  SEO_GENERATION_FORBIDDEN : 未 PASS

Output fields（严格顺序）:
  1 Product Name  2 H1  3 SEO Title  4 SEO Keywords  5 Meta Description
  6 URL Slug  7 Canonical  8 Key Description  9 Description / Image ALT  10 Schema

Reads:
  core/pdp-template-v4.4.md
  standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md

Fails_with:
  SEO_GENERATION_FORBIDDEN — entity_status != PASS

Implementation:
  dripops/src/DripOps/Rules/V44/V44Composer.cs
```

### 2.7 `pdp-validation`

```text
Skill:
  pdp-validation

Purpose:
  Block a draft before it reaches the backend.

Input:
  draft + sku_resolution

Output:
  PASS : 无 ERROR
  HOLD : 任一 ERROR（WARN 不阻断）

Reads:
  core/quality-check.md §1

Fails_with（ERROR 级）:
  PRODUCT-01 / NAME-S1,G1,D1 / H1-01
  SKU-01 / SKU-02 / SKU-03
  EVID-01 / EVID-02
  SEO-01 / SEO-02
  KW-01 / KW-02 / KW-S1,G1,D1
  META-01 / META-02 / META-03 / META-S1,G1,D1
  URL-02 / URL-03
  KD-01..KD-08
  DESC-01
  SCH-01..SCH-04

WARN 级（不阻断）:
  URL-01（既有未改动 slug）/ ALT-01 / ALT-02

Implementation:
  dripops/src/DripOps/Rules/V44/V44Validator.cs
```

### 2.8 `frontend-audit`

```text
Skill:
  frontend-audit

Purpose:
  Prove the published page is correct, not just that the save succeeded.

Input:
  rendered_html + draft

Output:
  PASS : FE-01..FE-05 与 FE-08..FE-10 全通过
  ROLLBACK : 任一失败

Reads:
  core/quality-check.md §2
  core/evidence-policy.md §6

Checks:
  FE-01 noindex / FE-02 Product Details H2 缺失 / FE-03 列表缺失 /
  FE-04 li != 5 / FE-05 Brand 内链缺失 /
  FE-06 决策句缺失(WARN) / FE-07 无图(WARN) / FE-08 缺 alt /
  FE-09 禁用词 / FE-10 canonical 不一致

Plus:
  HTTP 200 / title / canonical / H1 / Schema / 可爬取
```

### 2.9 `backend-write`

```text
Skill:
  backend-write

Purpose:
  Write to the backend only through an immutable, validated plan.

Input:
  product_id + plan_id

Output:
  PASS : 已写入并回读一致
  ROLLBACK : 任一守卫失败或前端验证失败

Reads:
  core/universal-seo-rules.md §5
  core/quality-check.md §4.4

Guard order（首个失败即停）:
  1 plan_id 格式        → 400 invalid_plan_id
  2 plan 存在           → 404 unknown_plan
  3 plan.product_id 匹配 → 409 plan_product_mismatch
  4 未执行过            → 409 plan_already_executed
  5 validation_status=PASS → 409 plan_not_validated
  6 plan.standard_hash 未变 → 409 standard_hash_changed
  7 声明 hash 匹配      → 409 standard_hash_mismatch
  8 snapshot_hash 未过期 → 409 stale_plan

Fails_with:
  ROLLBACK — 保存后回读不一致
  ROLLBACK — 前台 URL != 200 / canonical 不符 / 图片未加载 / ALT 不匹配

Never:
  接受任意 SEO 字段（execute 只接受 product_id + plan_id）
```

### 2.10 `hold-triage`

```text
Skill:
  hold-triage

Purpose:
  Decide HOLD vs BLOCKED vs ROLLBACK — and stop cleanly.

Input:
  reason_code, product_id, evidence

Output:
  HOLD     : 证据不足或冲突（商品本身没问题）
  BLOCKED  : 环境/后台技术故障（与身份无关）
  ROLLBACK : 已写入但验证失败

Reads:
  core/hold-policy.md

Allowed reasons（只此四类）:
  1 确证重复商品
  2 无法确认 Exact Entity
  3 关键证据冲突
  4 后台/环境技术故障

Fails_with:
  HOLD — conflicts 为空（结构非法）

Retry limits:
  同一验收项连续失败 3 次 → 换候选，不盲试
  图片上传单张最多重试 3 次

Must record:
  conflicts[] / decision_note / 商品保持"未修改"状态的证明
```

### 2.11 `run-resume`

```text
Skill:
  run-resume

Purpose:
  Resume after a disconnection without redoing finished work.

Input:
  run_id

Output:
  PASS : 已定位断点，剩余 ID 清单已产出

Reads（严格顺序）:
  1 dripops/handoff/<run>/PROGRESS.md
  2 run.json
  3 events.jsonl
  4 products/*.json（stage 为唯一断点依据）

Rules:
  inputAuditStatus = PASS  → 禁止重做
  stage = PUBLISHED / VERIFIED → 禁止重做
  幂等键 = source_key / product_id

Fails_with:
  HOLD — 找不到 run.json（run 未建立）
```

### 2.12 `reverse-validation`

```text
Skill:
  reverse-validation

Purpose:
  Prove a validator actually rejects what it claims to reject.

Input:
  validator_command, valid_input, invalid_input

Output:
  PASS : 非法输入非零退出且报出对应错误；合法输入零退出

Reads:
  core/evidence-policy.md §7

Required output:
  红→绿原始输出（写入 PROGRESS.md）

Fails_with:
  HOLD — 只跑了合法输入就说"校验通过"
```

### 2.13 `brand-pack-creation`

```text
Skill:
  brand-pack-creation

Purpose:
  Turn one brand's execution experience into a reusable knowledge pack.

Input:
  brand_id + ≥10 款已核验商品 + ≥5 条失败样本

Output:
  PARTIAL                  : 样本 10 款以上但证据不全
  VERIFIED_CASE_AVAILABLE  : 样本充分且有线上/后台验证

Deliverables:
  knowledge/brands/<brand>/brand-rules.md
  knowledge/brands/<brand>/sku-pattern.md
  knowledge/brands/<brand>/successful-case.md
  cases/<brand>-<case>.md

Reads:
  knowledge/brands/moncler/brand-rules.md §2（7 步取证协议）
  knowledge/brands/prada/（范本）

Fails_with:
  PARTIAL — 样本 < 10 款
  NO_EVIDENCE — 无任何本地素材（此时只建 PLACEHOLDER）

Reference implementation:
  knowledge/brands/prada/（有真实成功案例）
  knowledge/brands/dior/（仅 PARTIAL，含失败形态，同样是合格交付）
```

### 2.14 `category-pack-creation`

```text
Skill:
  category-pack-creation

Purpose:
  Turn one category's execution experience into a reusable knowledge pack.

Input:
  category_id + 该类目的真实 run 记录

Output:
  PARTIAL / VERIFIED_CASE_AVAILABLE

Deliverables:
  knowledge/categories/<cat>/category-rules.md
  knowledge/categories/<cat>/successful-case.md

Reads:
  knowledge/categories/tshirts/（范文：失败被完整记录）
  knowledge/categories/jackets/（范文：诚实的 NO_EVIDENCE 占位）

Fails_with:
  NO_EVIDENCE — 无 run 记录（只建 PLACEHOLDER）
```

---

## 3. Agent 可用性自检（5 问，必须能答）

### Q1. How to verify a product?

```text
读 core/identity-verification.md，用 product-verification 技能。
链路：Observe → Search → Compare → Verify → Decide
公式：Exact Product Entity = Brand + Model + Product Type + Colorway
                          + Graphic/Design + Collection + SKU(when available)
输出：PASS / HOLD / VERIFY
禁止：看到图片 → 猜品牌 → 猜款号 → 写 SEO
```

### Q2. When should I HOLD?

```text
读 core/hold-policy.md。四类原因：
  1 确证重复商品
  2 无法确认 Exact Entity
  3 关键证据冲突
  4 后台/环境技术故障（这一类归 BLOCKED）
典型触发：SKU 冲突 / 商品名无法匹配官方 / 配色不确定 / 多个可能商品 /
         快照四要素缺失 / 同 slug 疑似重复 / 会话失效 / 保存连续 2 次无响应
HOLD 后禁止：生成 SEO、创建 plan、写后台、上架
```

### Q3. How to generate PDP?

```text
前置门禁：entity_status = PASS，否则 SEO_GENERATION_FORBIDDEN
读 core/pdp-template-v4.4.md，用 pdp-composition + pdp-validation 技能。
10 项产物按固定顺序：Product Name / H1 / SEO Title / Keywords / Meta /
                    Slug / Canonical / Key Description / Description+ALT / Schema
硬约束：H1 = Product Name；恰好 1 个 <h2>Product Details</h2>；
       恰好 5 个 <li>；Brand 行承载唯一真实内链；data-standard="4.4"；
       Meta 用固定模板；Schema 与 SKU 裁决一致
```

### Q4. How to reuse Prada experience for Dior?

```text
可复用（读 knowledge/brands/prada/）：
  1 文件夹级 SHA-256 + 64-bit dHash 双重去重流程
  2 幂等键 source_key 的用法
  3 "目标发布状态 ≠ 实际状态"的记录纪律
  4 反向验证（红→绿）流程
  5 分类"必须同时包含"的集合断言
  6 视觉同一性证据（dHash=0 且 颜色 MAE=0 → 可复用现图）

必须替换（Prada 专属）：
  命名公式、人工映射表、配色噪声码清单（4E3400/4E6500/3LLJ/ASZ/6GW）

必须警惕（Dior 的额外坑，读 knowledge/brands/dior/）：
  同一 SKU 被两个商品复用（3SN272-ZIR1-6536）
  v3.2 模板与 V4.4 的 5 处硬冲突（含 real QC photos / 7–20 day delivery 已成禁用词）
  线上 URL 拼写错误（Dlue）与缺品牌前缀
```

### Q5. How to add a new category?

```text
读 knowledge/categories/jackets/category-rules.md §2（7 步取证协议）。
  1 后台取真实清单（走 API，不走 DOM）
  2 抓线上分类页
  3 逐款身份核验
  4 抽取命名骨架（≥10 款样本，禁止用 1-2 个个案当规律）
  5 抽取 SKU 模式（先判"官方货号还是内部码"）
  6 收集 ≥5 条失败形态
  7 修改 front-matter 的 status / evidence_status / version
样本 < 10 款 → 最高只能标 PARTIAL。
无素材 → 只建 PLACEHOLDER，禁止推测填充。
```

---

## 4. 注册表的维护规则

```text
RULE-ID: REG-01
IF 新增了 core/ 或 knowledge/ 下的规则文件
THEN 必须同时更新本文件的 §1 索引与 §2 技能定义
OUTPUT PASS

RULE-ID: REG-02
IF 某个技能的 skill.reads 指向的文件不存在
THEN 该技能标注为 BROKEN，不得被 Agent 调用
OUTPUT HOLD

RULE-ID: REG-03
IF 案例中发现新的可复用判定规则
THEN 必须上提到 core/ 或 knowledge/，并在此登记
     案例文件本身不是规则的权威位置
OUTPUT PASS
```

---

## 5. 本注册表覆盖的现状（诚实口径）

### 5.0 先读：本注册表的基线

```text
基线提交 : b2505b2（codex/upgrade-seo-pdp-v4.4-final，main + 4）
活动标准 : standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
           sha256 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
事实台账 : FACTS-AS-OF-2026-09-19.md（已登记散落在另外 3 条分支上的事实）
```

```text
RULE-ID: REG-04
IF 本注册表提到的文件在本分支不存在
THEN 先查 FACTS-AS-OF-2026-09-19.md §3 的分支归属表
     再决定是否需要跨分支读取
OUTPUT VERIFY
```

### 5.1 技能与验证状态

```text
有真实执行证据的技能        : product-verification / sku-verification /
                              pdp-composition / pdp-validation /
                              backend-write（仅模拟，未 live）/
                              run-resume / reverse-validation
只有规则、无执行证据的技能   : colorway-evidence-check / duplicate-detection /
                              frontend-audit / brand-pack-creation /
                              category-pack-creation / hold-triage
尚未验证的关键路径           : live write（从未在生产做过一次真实写入）
                              STATUS.md 记录 "Write path | Not verified"
                              "First live execution | NO-GO"
```
