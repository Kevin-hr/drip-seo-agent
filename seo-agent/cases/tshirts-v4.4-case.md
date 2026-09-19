---
id: cases.tshirts-v4.4-case
kind: case-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [category:tshirts]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/handoff/t-shirts-30/{GOAL.md,PROGRESS.md,BLOCKED.md}
  - .sandbox/state/runs/t-shirts-first-30-2026-09-01/{run.json,events.jsonl,products/,facts/,evidence/}
  - .sandbox/state/runs/t-shirts-candidate-pool-2026-09-02/{run.json,category-snapshot.json,events.jsonl}
  - dripops/dist/data/runs/t-shirts-200-2026-09-07/run.json
  - docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md
  - docs/architecture/DECISION_LOG.md
---

# 案例：T-Shirts 30 → V4.4 迁移

## 0. 历史真相（唯一正确口径，禁止改写）

```text
Historical success:
  11 products

PDP 3.1.1:
  9

PDP 3.2:
  2

V4.4 validation:
  0

Target 30:
  Not completed
```

```text
RULE-ID: TSC-V44-00
IF 任何文档或 Agent 声称 T-Shirts 已完成 30/30
THEN 该声称与事实不符，必须更正
OUTPUT HOLD
```

---

## 1. What was successful（成功的部分）

```text
1  建立了可在断线后恢复的 run 机制
   run.json 冻结 productIds；products/<ProductID>.json 记录 stage；
   PROGRESS.md 作为人类可读进度；BLOCKED.md 作为阻塞台账。
   → 这套机制后来被 Air Jordan 1 run（106 款）继承并跑通。

2  建立了完整的证据目录规范
   covers/（序号对齐 run 内顺序）+ details/（每商品 2-4 张）
   + research/<brand>/（外部来源图）+ facts/<ProductID>.facts.json
   → 这套目录约定是 v1.0 里被引用最多的结构。

3  产出了 11 个通过验证的商品
   9 个 3.1.1 + 2 个 3.2（536027547297304/HZ3831、536027547266582/HZ3830）
   这些是真实存在的、带 data-version 标记的产物。

4  把"不许为凑数猜事实"写进了任务书
   GOAL.md 原文：「候选查不到官方 SKU 或图片无法确认就 HOLD，换下一个；
   绝不为凑 30 猜事实。」

5  规定了反向验证（红→绿）
   「第一次新候选先用 skuVerified=false 的临时 facts 运行 compose，
    必须非零退出并 HOLD；换回真实已验证 facts 后必须变为 READY，贴出红→绿输出。」

6  明确了让步顺序
   「事实准确 > 可复验证据 > 完整数量 > 速度」
```

---

## 2. What failed（失败的部分）

```text
1  30 目标未达成
   实际 11 / 目标 30。达成率 36.7%。

2  两个 run 大面积停在 Blocked
   t-shirts-first-30-2026-09-01      30 个商品，26 个停在 SnapshotCaptured/Blocked
   t-shirts-candidate-pool-2026-09-02 200 个商品，166 个 Discovered/Blocked
                                      27 个 SnapshotCaptured/Blocked

3  计划中的最终 run 从未建立
   t-shirts-30-final-2026-09-07 目录不存在
   final-30-audit.json 不存在

4  可观测性缺陷：Blocked 没有机器可读原因
   events.jsonl 只有 RUN_CREATED / CATEGORY_SNAPSHOT_SAVED / PRODUCT_CHECKPOINT，
   没有终态失败事件 → 26 个商品为什么停在 Blocked，无法从证据反推。

5  供应商标题质量极差，且无法自动修复
   真实样本：
     Prada Logo T-Shirt-DC2 / Crewneck T-Shirt-DC2 / Crewneck T-Shirt
     Embroidery Logo T-Shirt / Prada T-Shirt / Loro PianaT-Shirt
   问题类型：DC 批次后缀、无品牌、无配色、排版缺空格。

6  同款成对出现，重复风险未被前置拦截
   Chrome Hearts T-Shirt ↔ Chrome Hearts T-Shirt-DC2
   Prada Logo T-Shirt    ↔ Prada Logo T-Shirt-DC2
   Burberry Embroidery T-Shirt ↔ Burberry Embroidery T-Shirt-DC2
   Balenciaga Logo Print T-Shirt ↔ Balenciaga Logo Print T-Shirt-DC2
   剥掉 DC 后缀后同名同款 → 若都发布会产生重复 PDP。

7  schema 与规则冲突
   product-facts.schema.json 把 sku 列为 required（minLength 1）
   而 V4.4 的 SKU_OMIT 要求 sku = null
   → 两者不相容，当时未解决。
```

---

## 3. Why previous execution stopped（为什么停）

```text
原因 A（文档记录的唯一阻塞，v3.2 时代）
  dripops/handoff/t-shirts-30/BLOCKED.md 全文仅一条：
    "Final acceptance version was not explicitly reconfirmed after the repository
     activated SEO/PDP 3.2. Default in GOAL.md: use 3.2 and upgrade the nine legacy
     3.1.1 products."
  → 验收版本未被确认，9 个 3.1.1 商品的处理方式悬空。
  → GOAL.md 自己标注这个默认决定是"（猜的）"。

原因 B（2026-09-07 的运行时全局阻断）
  dripops/dist/data/runs/t-shirts-200-2026-09-07/run.json:
    standardVersion : "3.7-required-runtime-blocked"
    preflightStatus : "GlobalBlocked"
    blocker         : "GLOBAL-RUNTIME-SEO-PDP-3.7-UNAVAILABLE"
    backendWrites   : 0
    productIds      : []
  → 运行时要求一个仓库里不存在的标准（3.7），直接全局阻断，未做任何写入。

原因 C（时间线证据）
  first-30       2026-09-01T22:59 → 2026-09-02T06:42 后无新事件
  candidate-pool 2026-09-02T06:42 → 2026-09-02T07:06 后无新事件
  → 两个 run 都在 2026-09-02 上午停止活动，之后再未续跑。

必须澄清的误传：
  T-Shirts 侧没有任何"后台会话过期/断线/进程被杀"的记录。
  这类记录只存在于 Air Jordan 1 的 BLOCKED.md（ENV-01/ENV-02），与本案例无关。
```

```text
RULE-ID: TSC-V44-01
IF 解释 T-Shirts 停止原因
THEN 只能引用原因 A / B / C，不得引入 Air Jordan 1 的环境故障作为解释
OUTPUT PASS
```

---

## 4. V4.4 corrections（V4.4 修正点）

### 4.1 修正 1：SKU 可以省略（最重要的结构性变化）

```text
3.1.1 / 3.2 : 必须有 verified SKU，否则不能发布
V4.4        : 三值裁决 VERIFIED_SKU / SKU_OMIT / HOLD
              实体 PASS 但无 SKU → SKU_OMIT，完全省略，全链路无 SKU 痕迹
```

出处：`docs/architecture/DECISION_LOG.md` #001 — "Rejected: SEO/PDP 3.2"，
"Reason: 3.2 requires verified SKU"；#008 — 把决策层整体迁移到唯一活动的 V4.4 标准。

```text
对 T-Shirts 的影响：
  T-Shirt 是最常没有官方货号的类目 → SKU_OMIT 对 T-Shirts 的解锁幅度最大。
  但注意：SKU_OMIT 的前提是 Exact Entity PASS，不是"查不到就算了"。
```

### 4.2 修正 2：H2 结构收紧

```text
3.2  : PDP 内恰好 1 个 H2 + 1 个 Style 内链（商品名可作标题）
V4.4 : Key Description 内恰好 1 个 <h2>Product Details</h2>
       且禁止把完整 Product Name 机械重复为另一个标题（§13 / KD-07）
```

### 4.3 修正 3：Product Details 恰好 5 个字段

```text
V4.4 固定 5 个 <li>：Brand（带唯一内链）/ Product Type / Model / Colorway /
                    SKU 或一条已核实的产品专属事实
校验码：KD-03、FE-04
```

### 4.4 修正 4：内链必须有优先级，且不得发明

```text
Verified brand hub → exact model/collection category → broader product category
→ No guessed link; VERIFY
```

### 4.5 修正 5：版本标记换名

```text
data-version="3.1.1" / "3.2"   →   data-standard="4.4"
V4.4 不存在 data-version 输出。
```

### 4.6 修正 6：验收口径换掉

```text
作废：Meta 120–160、data-version="3.2"、1 个 Style 内链
采用：core/pdp-template-v4.4.md + core/quality-check.md 的全套
```

### 4.7 修正 7：失败必须带机器可读原因

```text
V4.4 要求 HOLD 必须携带 ≥1 条 conflicts（否则结构非法）。
这正好补上 T-Shirts 的可观测性缺陷：26 个 Blocked 当时没有原因码。
```

---

## 5. V4.4 迁移执行清单（做 T-Shirts 时按此执行）

```text
STEP 0  先确认最终验收版本（这正是当初卡住的地方）
        → 明确写进 PROGRESS.md，不得使用"（猜的）"

STEP 1  重新 scan T-Shirts 分类，冻结 final run 名单
        走 API（POST /biz/DTB_proProduct/queryList），不走 DOM

STEP 2  对 11 个已有产物逐款重判
        → 3.1.1 / 3.2 产物不能原样迁移，必须按 V4.4 重建
        → 优先复用其已确证的事实与证据，不重做证据采集

STEP 3  对每个候选先做噪声筛查（本文件 §2.5 的 5 类）
        DC 后缀 → 剥离；成对同名 → 判重复；无品牌 → HOLD；无配色 → HOLD

STEP 4  身份核验（core/identity-verification.md）
        Tier 1-4 优先；T-Shirt 常无货号 → 准备走 SKU_OMIT

STEP 5  按 V4.4 生成（core/pdp-template-v4.4.md）
        严守 1 个 H2 / 5 个 li / data-standard="4.4"

STEP 6  解决 facts schema 冲突
        → 显式记录，不用占位符绕过

STEP 7  三层验收：V4.4 PASS → 后台回读 → 前台 200 + DOM 核验
        逐款记录，禁止整体声称

STEP 8  产出 final-30-audit.json，逐条记录：
        HTTP 200 / Title / Canonical / Product Name=H1 / 
        H2 唯一且为 Product Details / 恰好 5 个 li / Brand 内链可达 /
        图片存在 / data-standard="4.4"

STEP 9  让每个 HOLD/Blocked 携带机器可读原因码
        （修补当初的 events.jsonl 可观测性缺陷）
```

---

## 6. 本案例贡献给知识层的规则

```text
→ core/universal-seo-rules.md §8  R1 数量目标让位于事实准确
                                   R4 连败 3 次换候选
                                   R6 回滚并如实记录
→ core/hold-policy.md        §3    重试上限
→ core/evidence-policy.md    §4    facts schema 与 SKU_OMIT 的冲突
                             §5    断点续跑纪律
→ core/sku-validation.md     §4    SKU_OMIT 路径
→ knowledge/categories/tshirts/category-rules.md   全部
```

## 关联文件

```text
类目规则   : knowledge/categories/tshirts/category-rules.md
品牌包     : knowledge/brands/prada/（T-Shirts 的 Prada 商品与 Prada 鞋类共用命名规则）
模板       : core/pdp-template-v4.4.md
HOLD 规则  : core/hold-policy.md
```
