---
id: knowledge.categories.tshirts.successful-case
kind: case-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [category:tshirts]
evidence_status: VERIFIED_CASE_AVAILABLE
evidence_basis:
  - dripops/handoff/t-shirts-30/{GOAL.md,PROGRESS.md,BLOCKED.md}
  - .sandbox/state/runs/t-shirts-first-30-2026-09-01/
  - .sandbox/state/runs/t-shirts-candidate-pool-2026-09-02/
  - dripops/dist/data/runs/t-shirts-200-2026-09-07/run.json
---

# T-Shirts 案例记录（knowledge/categories/tshirts/successful-case.md）

## 命名说明

本文件标题沿用目录约定，但 T-Shirts **不是一个成功案例**。

```text
T-Shirts 的真实状态：
  目标           30 款
  实际达成       11 款（9 × 3.1.1 + 2 × 3.2）
  V4.4 验证      0 款
  是否完成       未完成
```

---

```text
Case Name:
  T-Shirts 30 款交付（未完成）——
  一个"目标没达成但失败被完整记录"的案例

Input:
  引导文件      : dripops/handoff/t-shirts-30/GOAL.md
  目标          : 在 Drip Sneakers 的 T-Shirts 分类交付 30 个有证据、已回读、已发布、前台可访问的统一标准商品
  优先级        : 事实准确 > 可复验证据 > 完整数量 > 速度
  来源 run      : t-shirts-first-30-2026-09-01
                  t-shirts-candidate-pool-2026-09-02
  幂等键        : source_key / ProductID
  候选池        : 200 个商品（其 published=10 字段已过期，不得当实时数字）

Problem:
  1. 版本不确定：仓库刚激活 SEO/PDP 3.2，但最终验收版本未被确认
  2. 已有 11 个商品分别落在 3.1.1 与 3.2 两个版本上，口径不统一
  3. 候选池 200 个商品的供应商标题不可用于身份判定（DC 后缀 / 通用名 / 无配色）
  4. 大量同款成对出现（X 与 X-DC2），存在重复商品风险
  5. facts schema 要求 sku 非空，与 V4.4 允许 SKU_OMIT 冲突

Verification:
  GOAL.md 要求的方式：
    - 每件保存字段级 evidence：brand / model / colorway / SKU / 材质设计 /
      官方来源 / 核验时间 / 后台图片匹配
    - 站内分类路径必须来自当前 sitemap
    - 只有 validation.isValid=true 且 Ready 才允许 apply --publish
    - 必须依次通过保存回读、发布回读、前台验证
    - 失败商品 HOLD，不写假值
    - 同一验收连败 3 次换候选

  反向验证（GOAL.md 明令）：
    先用 skuVerified=false 的临时 facts 运行 compose
    → 必须非零退出并 HOLD
    再换回真实已验证 facts
    → 必须变为 READY
    要求贴出红→绿输出

  实际留下的验证产物：
    - 34 个商品状态机文件（products/*.json）
    - 4 个 facts 文件（facts/*.facts.json）
    - covers/ 30 张封面 + details/ 逐商品 2-4 张细节图 + research/celine/ 4 张来源图

Solution:
  1. 用 categorySnapshot 冻结候选名单，走 run 机制
  2. 逐商品走 Discovered → SnapshotCaptured → Validated 状态机
  3. 通过 validation.isValid 的商品标 Ready，未通过标 Blocked
  4. 版本冲突未决时，记录进 BLOCKED.md 而不是自行裁决

Final Result:
  distinct 已验证商品      11
  PDP 3.1.1                9
  PDP 3.2                  2   （536027547297304/HZ3831、536027547266582/HZ3830）
  V4.4 验证                0
  30 目标                  未完成

  run 状态分布：
    t-shirts-first-30-2026-09-01       30 个文件中 26 个停在 SnapshotCaptured/Blocked
    t-shirts-candidate-pool-2026-09-02 200 个中 166 个 Discovered/Blocked，
                                       27 个 SnapshotCaptured/Blocked
  最终 run（计划中的 t-shirts-30-final-2026-09-07）   从未建立
  final-30-audit.json                                  从未生成

  事件流的局限（重要）：
    events.jsonl 里只有 RUN_CREATED / CATEGORY_SNAPSHOT_SAVED / PRODUCT_CHECKPOINT
    **没有任何终态失败事件** → 无法从事件流反推"为什么停在 Blocked"

Reusable Rule:
  R1  版本未确认时，"默认用哪个标准"这个决定必须留档；T-Shirts 就卡在这里。
  R2  供应商标题的 5 类噪声（DC 后缀 / 成对重复 / 无品牌 / 无配色 / 排版缺陷）
      必须建库并按症状判定，不能逐个临场判断。
  R3  同款成对（X 与 X-DC2）剥后缀后同名，必须先判重复再写 SEO。
  R4  事件流只记 checkpoint 不记终态原因，是可观测性缺陷——
      未来的 run 必须让 Blocked 带上机器可读原因码。
  R5  facts schema 与 SKU_OMIT 的冲突必须显式记录，不得用占位符绕过 schema。
  R6  进度报告必须分列"已验证 / 已发布 / 未完成"，禁止合并成一句完成声明。
```

---

## 之前执行为什么停止（结论）

```text
直接原因（文档记录的唯一一条阻塞）：
  dripops/handoff/t-shirts-30/BLOCKED.md 全文仅一条：
  "Final acceptance version was not explicitly reconfirmed after the repository
   activated SEO/PDP 3.2. Default in GOAL.md: use 3.2 and upgrade the nine legacy
   3.1.1 products."
  → 即：最终验收版本未被重新确认，导致无法判定 9 个 3.1.1 商品的处理方式。

实际中断时点（事件流证据）：
  first-30 run        2026-09-01T22:59 → 2026-09-02T06:42，此后无新事件
  candidate-pool run  2026-09-02T06:42 → 2026-09-02T07:06，此后无新事件

2026-09-07 尝试建最终 run 时被运行时全局阻断：
  dripops/dist/data/runs/t-shirts-200-2026-09-07/run.json
    standardVersion   : "3.7-required-runtime-blocked"
    preflightStatus   : "GlobalBlocked"
    blocker           : "GLOBAL-RUNTIME-SEO-PDP-3.7-UNAVAILABLE"
    backendWrites     : 0
    productIds        : []
  createdAt 2026-09-07T14:29 / updatedAt 14:44

无证据的部分（不得编造）：
  T-Shirts 侧没有任何关于"后台会话过期 / 断线 / 进程被杀"的书面记录。
  会话失效类记录只存在于 Air Jordan 1 的 BLOCKED.md（ENV-01/ENV-02），与 T-Shirts 无关。
```

```text
RULE-ID: TSC-STOP-01
IF 需要解释 T-Shirts 为何未完成
THEN 只能引用上述两类证据（版本未确认 + 2026-09-07 全局阻断），
     不得声称"因为后台会话过期"或"因为 AI 断线"
OUTPUT PASS
```

---

## 附带发现：一个未归一的版本号

```text
t-shirts-200-2026-09-07/run.json 里出现 standardVersion = "3.7-required-runtime-blocked"
```

本仓库的 `standards/_superseded/` 与 `dripops/standards/` 中都没有 3.7 的文件。

```text
RULE-ID: TSC-STD-02
IF 遇到 standardVersion 指向一个不存在的标准
THEN 记录该不一致，不得自行假设 3.7 等于某个已知版本
OUTPUT HOLD
```

## 关联文件

```text
类目规则 : knowledge/categories/tshirts/category-rules.md
完整叙事 : cases/tshirts-v4.4-case.md
模板迁移 : core/pdp-template-v4.4.md
```
