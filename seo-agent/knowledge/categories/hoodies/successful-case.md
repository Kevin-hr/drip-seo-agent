---
id: knowledge.categories.hoodies.successful-case
kind: case-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [category:hoodies, brand:hellstar]
evidence_status: PARTIAL
evidence_basis:
  - dripops/dist/data/runs/hellstar-hoodies-2026-09-02/{run.json,events.jsonl,products/}
  - docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md
  - docs/architecture/DECISION_LOG.md
---

# Hellstar Hoodies 案例记录（knowledge/categories/hoodies/successful-case.md）

## 命名说明

本文件标题沿用目录约定。Hellstar 的真实状态是：

```text
产物层：8 / 9 到达 Validated + Ready（3.2 标准）
交付层：0 款发布、0 款回读、0 款前台验证
V4.4  ：0 款执行（V4.4 仅以文档形式存在）
```

因此这是"**跑到了 Ready 就停了**"的案例。

---

```text
Case Name:
  Hellstar Hoodies 9 款 —— 3.2 时代跑到 Ready，未进入执行层

Input:
  Run ID        : hellstar-hoodies-2026-09-02
  标准          : SEO/PDP 3.2
  分类公开页    : https://www.dripsneakers.org/Hellstar-Hoodies/
  分类快照      : published = 0 / unpublished = 9
  商品数        : 9

Problem:
  1. 供应商标题含纯数字后缀（Hellstar Sport Hoodie-2223 / 8807 / 9903）
  2. 1 款商品（536027374677018 Hellstar Flame Face Logo Hoodie Light Blue）停在 Blocked
  3. 既有 slug 带供应商前缀（Top-Quality-Hellstar-Sport-Hoodie-Black）
  4. 3.2 标准要求 verified SKU，而 hoodies 类目普遍难以取得货号
  5. 从 3.2 迁到 V4.4 时，旧 facts 的 sourceTier 取值不合规

Verification:
  逐商品状态机（products/<ProductID>.json）
    stage         : Discovered 9 → SnapshotCaptured 9 → Validated 16（含重试）
    releaseStatus : Blocked 26 / Ready 8
  抽样核对 536027371237407：
    validation.isValid = true
    issues = 1 条 warning — URL-03 LEGACY_SLUG_PRESERVED（slug = Top-Quality-Hellstar-Sport-Hoodie-Black）

Solution:
  1. 通过 slug 保留策略保住既有 URL（3.2 的 URL 稳定规则 → 降级为 WARN）
  2. 8 款商品完成 compose + validate，标 Ready
  3. 1 款标 Blocked
  4. 后续在提交 c581909 中把 Hellstar 工作流整体迁移到 V4.4（文档层）

Final Result:
  Discovered        9
  Validated/Ready   8
  Blocked           1
  Published         0        ← 关键
  ReadBackVerified  0
  FrontendVerified  0
  V4.4 验证         0

  V4.4 落地形态：
    docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md（438 行）
    docs/architecture/DECISION_LOG.md 新增记录
    README.md 更新

Reusable Rule:
  R1  Ready ≠ 完成。没有 execute / readback / storefront 三层，就只是"准备好"。
  R2  events.jsonl 缺终态事件是结构性缺陷（与 T-Shirts 同病）——
      必须让每个 Blocked 带机器可读原因码。
  R3  供应商数字后缀（-2223 / 8807 / 9903）与 DC 后缀（-DC2 / -DC3 / -DC4）
      是同一类噪声，可统一处理。
  R4  3.2 容忍的"供应商前缀 slug"在 V4.4 下应触发迁移——
      跨标准迁移时必须重判 URL，不能沿用 WARN。
  R5  旧 facts 的 sourceTier（mature-market / current-product-image）
      不符合 V4.4 的 tier 1..8 约束，迁移前必须重映射。
  R6  3.2 → V4.4 的迁移在 Hellstar 上只做到了文档层，
      **不能作为"V4.4 已跑通"的证据**。
```

---

## 本案例的方法论价值

Hellstar 提供了一个**"文档先行、执行后置"的迁移样本**：

```text
c581909  把 438 行的 V4.4 端到端 playbook 写出来
         （改动 3 个文件：README.md / DECISION_LOG.md / playbook）
         但没有执行任何一款
```

```text
RULE-ID: HOD-CASE-01
IF 一个品牌只有 playbook 没有 run
THEN 它是"已规范、未验证"状态
     可以复用其 playbook 的规则结构，但不得复用其"已完成"的结论
OUTPUT VERIFY
```

这条对 v1.0 本身适用：本知识层里的 `knowledge/brands/*` 也分
"有 run 证据"（Nike / Prada 部分）与"只有文档"（Dior / Moncler）两类，
必须按同一纪律区分对待。

## 关联文件

```text
类目规则 : knowledge/categories/hoodies/category-rules.md
品牌素材 : Hellstar 尚未建立知识包（见 knowledge/brands/moncler/successful-case.md §2 素材清单）
模板     : core/pdp-template-v4.4.md
```
