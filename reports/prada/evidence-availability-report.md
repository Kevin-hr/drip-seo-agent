---
id: reports.prada.evidence-availability
kind: governance-report
phase: 1
version: 1.0.0
status: ACTIVE
pack: prada
generated: 2026-09-20
method: read-only filesystem + git inspection; no backend access
---

# Phase 1 — Evidence Availability Check

> 目的：确认 Prada Pack 依赖的证据**是否真的存在于仓库内**，并据此判断
> 证据是否达到"生产安全"标准。
>
> 结论先行：**没有达到。** 全部 Prada 证据都只存在于工作区，未纳入任何版本控制。

---

## 0. 检查范围与判定口径

检查位置：

```text
audit/
docs/case-studies/
scripts/
tests/
packs/prada/
shipping-audit/
```

三个独立维度，必须分开回答（否则会得出错误结论）：

```text
Exists              文件是否在磁盘上存在
Tracked by Git      是否被某个 git 仓库跟踪（并注明是哪个仓库、哪条分支）
Used by Pack        packs/prada/pack.json 的 provenance 是否引用它
```

```text
RULE-ID: EV-00
IF 文件 Exists 但未 Tracked by Git
THEN 该证据处于单点风险状态，不得判定为 production safe
OUTPUT HOLD
```

---

## 1. 冻结 run 的核心清单（audit/2026-09-02T14-30-31+08-00-prada-78/）

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json
Exists:         YES (382,135 bytes)
Tracked by Git: NO — 外层 dripsneakers 仓库跟踪 80 个文件，不含任何 audit/
Used by Pack:   YES (provenance #1)
Risk:           CRITICAL — 78 款冻结清单与 856 图计数只此一份
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/identity-audit.json
Exists:         YES (23,105 bytes)
Tracked by Git: NO
Used by Pack:   YES (provenance #1)
Risk:           CRITICAL — 14/64 存量拆分、9/5 已发布拆分、66/12 SKU 分型的唯一来源
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/validation-checks.json
Exists:         YES (727 bytes)
Tracked by Git: NO
Used by Pack:   YES (间接，pack 引用其计数结论)
Risk:           HIGH — 清单校验 valid=true 的唯一凭据
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/operations.jsonl
Exists:         YES (4,420 bytes, 8 行)
Tracked by Git: NO
Used by Pack:   YES (PRADA-B01 / PRADA-B02)
Risk:           HIGH — "实际上传 0/78" 与 read_product_list failed 的唯一凭据
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/PROGRESS.md
Exists:         YES (1,585 bytes)
Tracked by Git: NO
Used by Pack:   YES (PRADA-B01)
Risk:           MEDIUM — Task 1–4 全 PENDING 的凭据
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/BLOCKED.md
Exists:         YES (405 bytes)
Tracked by Git: NO
Used by Pack:   YES（间接）
Risk:           MEDIUM — "No blocked items" 的凭据
```

---

## 2. evidence 子目录（新增纳入清点）

```text
File:           evidence/public-prada-seo-pdp-audit.json
Exists:         YES (18,348 bytes)
Tracked by Git: NO
Used by Pack:   YES (PRADA-B04，Phase 3 的版本分布来源)
Risk:           CRITICAL — 9 个存量页 PDP 版本分布（3.3 x8 / missing x1）的唯一来源
```

```text
File:           evidence/prada-source-inventory.json
Exists:         YES (439,879 bytes)
Tracked by Git: NO
Used by Pack:   NO（尚未引用）
Risk:           HIGH — 源目录文件夹级清单，去重结论的底层数据
```

```text
File:           evidence/prada-visual-dedupe.json
Exists:         YES (1,281,699 bytes)
Tracked by Git: NO
Used by Pack:   NO（尚未引用）
Risk:           HIGH — 120 组视觉近邻候选的唯一来源
```

```text
File:           evidence/public-to-local-image-matches.json
Exists:         YES (17,602 bytes)
Tracked by Git: NO
Used by Pack:   YES（verified_success 的 dhash=0 / mae=0 结论）
Risk:           HIGH — 视觉同一性证据的唯一来源
```

```text
File:           evidence/backend-unpublished-image-matches.json
Exists:         YES (10,945 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           evidence/prada-78-first-image-contact-sheet.jpg
Exists:         YES (902,125 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           evidence/public-product-images/            (目录)
Exists:         YES (10 files, 1,395,878 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           evidence/backend-unpublished-images/       (目录)
Exists:         YES (6 files, 1,421,568 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

冻结 run 目录合计：

```text
files = 28
bytes = 5,900,421
```

---

## 3. 脚本

```text
File:           scripts/build-prada-78-manifest.cjs
Exists:         YES (27,828 bytes)
Tracked by Git: NO
Used by Pack:   YES (naming 与 sku 分型的来源)
Risk:           CRITICAL — America's Cup 公式与配色清洗规则的唯一实现
```

```text
File:           scripts/validate-prada-seo-pdp-3.cjs
Exists:         YES (7,528 bytes)
Tracked by Git: NO
Used by Pack:   YES
Risk:           HIGH — 清单校验器；其反向验证（红→绿）输出未随文件保存
```

```text
File:           scripts/inventory-prada.ps1
Exists:         YES (4,866 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           scripts/audit-public-prada.ps1
Exists:         YES (5,092 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM — Phase 3 版本分布的生产者
```

```text
File:           scripts/compare-public-prada-images.cjs
Exists:         YES (3,092 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           scripts/prada-visual-dedupe.cjs
Exists:         YES (6,898 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

---

## 4. 公开站抓取

```text
File:           shipping-audit/raw_products.json
Exists:         YES (1,562,554 bytes)
Tracked by Git: NO
Used by Pack:   YES (verified_success 的线上观测，2026-09-15)
Risk:           CRITICAL — 全项目唯一一份公开站商品全集抓取
```

---

## 5. 已经在版本控制里的部分（唯一例外）

```text
File:           docs/case-studies/PRADA_78_PREFLIGHT_CASE.md
Exists:         在本分支 NO；在 645638b YES (5,000 bytes)
Tracked by Git: YES — 仓库 Kevin-hr/drip-seo-agent，分支 codex/drip-seo-agent-work-2026-09-19
Used by Pack:   YES (provenance #5)
Risk:           LOW — 已跟踪；但本分支上不存在，需跨分支读取
```

```text
File:           docs/case-studies/PRADA_BATCH_LEARNINGS.md
Exists:         在本分支 NO；在 645638b YES (2,170 bytes)
Tracked by Git: YES — 同 645638b
Used by Pack:   YES (provenance #6)
Risk:           LOW — 同上
```

```text
File:           tests/fixtures/prada/preflight-summary.json
Exists:         在本分支 NO；在 645638b YES (682 bytes)
Tracked by Git: YES — 同 645638b
Used by Pack:   NO（尚未引用）
Risk:           LOW
```

```text
File:           tests/prada-case-regression.mjs
Exists:         在本分支 NO；在 645638b YES (2,284 bytes)
Tracked by Git: YES — 同 645638b
Used by Pack:   NO
Risk:           LOW
```

### 5.1 `tests/`（本分支，Phase 1 要求的检查位置之一）

本分支 `tests/` 共 12 个文件，**全部已跟踪**：

```text
File:           tests/pre-write-gate.mjs                    (10,570 bytes)
Exists:         YES
Tracked by Git: YES — 本仓库，本分支
Used by Pack:   NO（但见 Phase 4：它是写入门禁证据的生产者）
Risk:           NONE

File:           tests/README.md / package.json / package-lock.json
                tests/bridge-acceptance.mjs / e2e-mcp.mjs / workflow-e2e.mjs
                tests/v2-contract.mjs / verify-mcp-tools.mjs / verify-ssrf.mjs
                tests/p0-remediation.mjs / tshirts-v3-lessons.mjs
Exists:         YES（11 个文件，均已跟踪）
Tracked by Git: YES
Used by Pack:   NO
Risk:           NONE
```

```text
关键判定：tests/ 下没有任何 Prada 专属测试。
          唯一的 Prada 回归测试（tests/prada-case-regression.mjs）在 645638b，不在本分支。
```

```text
RULE-ID: EV-04
IF 需要跑 Prada 专属回归
THEN 必须先从 645638b 取回 tests/prada-case-regression.mjs
     不得声称本分支已包含 Prada 回归覆盖
OUTPUT VERIFY
```

---

## 6. Pack 自身

```text
File:           packs/prada/pack.json
Exists:         YES (10,415 bytes)
Tracked by Git: YES — 本仓库，本分支（feature/prada-production-readiness 继承自 feature/prada-pack）
Used by Pack:   自身
Risk:           NONE — 已跟踪且带 sha256 引用
```

```text
File:           packs/prada/{README.md,cases.md}
Exists:         YES
Tracked by Git: YES
Used by Pack:   自身
Risk:           NONE
```

```text
File:           packs/prada/tests/{prada-cases.json,run-prada-pack-tests.mjs}
Exists:         YES
Tracked by Git: YES
Used by Pack:   自身
Risk:           NONE
```

---

## 7. 0 字节文件（强制上报）

```text
File:           check-prada.js
Exists:         YES
Tracked by Git: NO
Size:           0 bytes
Used by Pack:   NO（pack 明确禁止引用它）
Risk:           NONE（无内容，因此无价值也无风险）—— 但必须保留在案，
                防止后续有人误以为它是一个校验器
```

冻结 run 目录与 scripts/ 目录的 0 字节扫描结果：**无其他 0 字节文件**。

---

## 8. 空的遗留 run 目录

```text
audit/2026-09-02T14-30-09+08-00-prada-78/
  内容：仅一个空的 evidence/ 子目录
  含义：早于 14-30-31 的一次尝试，未产出任何文件
  风险：LOW —— 但会造成"有两个 run"的误读
```

```text
RULE-ID: EV-01
IF 引用 Prada run
THEN 必须指明是 2026-09-02T14-30-31+08-00-prada-78
     不得引用 14-30-09 那个（它是空的）
OUTPUT PASS
```

---

## 9. Critical Check 结论

```text
EVIDENCE_SINGLE_POINT_RISK
```

判定依据：

```text
1  冻结 run 的 28 个文件 / 5,900,421 bytes —— 全部未跟踪
2  shipping-audit/raw_products.json（1,562,554 bytes）—— 未跟踪，且是全项目唯一公开站抓取
3  scripts/ 下 6 个 Prada 脚本 —— 全部未跟踪
4  外层 dripsneakers 仓库共跟踪 80 个文件，其中与 Prada 相关的数量为 0
5  唯一进入版本控制的 Prada 文档在另一条分支（645638b），不在本分支
6  本分支 tests/ 下 0 个 Prada 专属测试；唯一的 Prada 回归测试在 645638b
```

必须区分清楚的一点（否则会得出错误结论）：

```text
本仓库确实跟踪着一套证据树（reports/ 55 个文件、tests/ 12 个文件）——
但那是「通用基础设施证据」：写入门禁、工作流 E2E、V2 契约、T-Shirts V3 基线、
Thom Browne 模拟。它们对 Prada 有价值（共享同一条写入路径），
却都不是 Prada 案例证据。

Prada 案例证据（78 款 run、公开站抓取、画像比对、SKU 分型）在本仓库中：
      已跟踪 = 0 个文件
```

```text
生产安全性判定：NOT PRODUCTION SAFE
```

```text
RULE-ID: EV-02
IF 证据仅存在于工作区
THEN 不得声称该证据 production safe
     不得基于它授权任何后台写入
OUTPUT HOLD
```

### 9.1 本次已完成的最小缓解（不等于消除）

把证据搬进仓库是一个**需要授权**的决定（体积、以及素材归属），
所以本次先做能够立即做且可验证的那一步：**把每一个证据文件用 sha256 钉死**。

```text
产物
  reports/prada/evidence-manifest.json          36 个文件 / 7,518,279 bytes
  packs/prada/tools/build-evidence-manifest.mjs  生成器（只读）
  packs/prada/tools/verify-evidence-manifest.mjs 校验器（只读）

校验
  $ node packs/prada/tools/verify-evidence-manifest.mjs
    VERIFIED : 36
    LOST     : 0
    CHANGED  : 0
    ZERO-BYTE: 1  (check-prada.js)
    EVIDENCE_MANIFEST_VERIFIED — every pinned file is present and byte-identical.
```

这解决什么 / 不解决什么：

```text
解决   ：证据丢失或被静默修改 → 立即可检测（LOST / CHANGED）
         清单本身进入版本控制，因此"我们依赖哪些文件"这件事是可审计的
         清单的 36 个文件 / 7,518,279 bytes 与 §9 的判定依据独立吻合（交叉验证）

不解决 ：文件本身仍未纳入版本控制 → 载体仍可能整体丢失
         因此 EVIDENCE_SINGLE_POINT_RISK 维持不变，不降级
```

```text
RULE-ID: EV-06
IF 证据未入库但已有 sha256 清单
THEN 风险等级仍为 EVIDENCE_SINGLE_POINT_RISK
     但可补充说明"可检测"与"不可恢复"是两个不同问题
OUTPUT HOLD
```

---

## 10. 建议的消除动作（本任务不执行，需另行授权）

```text
[ ] 把冻结 run 的 28 个文件纳入版本控制
    （若担心体积，至少纳入 manifest.json / identity-audit.json /
      operations.jsonl / validation-checks.json / public-prada-seo-pdp-audit.json
      与 4 个 *.json 证据文件；图片目录与超大 json 可另行决策）
[ ] 把 shipping-audit/raw_products.json 纳入或转为可复现的抓取产物（含抓取时间与哈希）
[ ] 把 scripts/ 下 6 个 Prada 脚本纳入 packs/prada/tools/ 或 scripts/
[ ] 删除或标注 audit/2026-09-02T14-30-09+08-00-prada-78（空运行）
[ ] 保留 check-prada.js 并在案说明其为 0 字节
```

```text
RULE-ID: EV-03
IF 上述任一项未完成
THEN 本 Pack 的证据状态仍为 EVIDENCE_SINGLE_POINT_RISK
OUTPUT HOLD
```

---

## 11. 已纳入版本控制的证据（本仓库，供对照）

以下是本仓库**已跟踪**的证据树，Phase 1 必须把它们与未跟踪的 Prada 证据区分开。

### 11.1 `reports/`（55 个文件，全部已跟踪）

```text
通用治理文档（23 个）
  reports/PRODUCTION_READINESS_REPORT.md              8,464   ← 仓库级就绪判定：BLOCKED
  reports/PRE_WRITE_REVIEW_GATE.md                    8,445   ← 写入门禁：NO-GO
  reports/LIVE_EXECUTION_READINESS_CHECK.md           5,121
  reports/LIVE_FIRST_EXECUTION_PLAN.md               22,361
  reports/PHASE_8_1_SAFE_WRITE_PLAN.md               31,733
  reports/RELEASE_PRECHECK_REPORT.md                  6,644
  reports/REPOSITORY_INTEGRITY_REPORT.md              2,700
  reports/STANDARD_INTEGRITY_REPORT.md                4,560
  reports/THOM_BROWNE_SIMULATION_REPORT.md           12,140
  reports/WORKFLOW_E2E_REPORT.md                     13,351
  reports/V2_CONFORMANCE_AUDIT.md                    10,067
  reports/V5_READINESS_GAP_REPORT.md                  7,485
  reports/V5_RELEASE_COMPLETION_REPORT.md             2,617
  reports/P0-1_URL_STABILITY_REPORT.md                6,760
  reports/P0-2_SNAPSHOT_FRESHNESS_REPORT.md           5,480
  reports/FINAL_P0_REMEDIATION_REPORT.md              9,198
  reports/BRIDGE_TEST_REPORT.md                       6,924
  reports/MCP_SECURITY_TEST_REPORT.md                 8,774
  reports/PHASE0-GITHUB-FREEZE.md                     8,249
  reports/PHASE0-V0.1-ACCEPTANCE.html                26,383
  reports/V0.1-VERIFICATION-AND-GAP.html             32,504
  reports/V4.4_STANDARD_FINAL_MIGRATION_2026-09-19.md  1,556
  reports/README.md                                   1,385

证据文件（28 个）
  reports/evidence/pre-write-gate/       8 个  ← 含机器可读门禁判定 99-gate-result.json
  reports/evidence/workflow-e2e/        18 个
  reports/evidence/t-shirts-v3/          1 个
  reports/evidence/v2-contract/          1 个

本次新增（5 个）
  reports/prada/*.md                     4 个
  reports/prada/evidence-manifest.json   1 个
```

```text
计数更正（Phase 5 自查）：本节曾写"证据文件（32 个）"，实测为 28 个。
  23（顶层）+ 28（evidence）+ 5（prada）= 56，与 reports/ 总数吻合。
  已在 Phase 5 分支修正；feature/prada-production-readiness 未作修改。
  详见 reports/prada/GOVERNANCE_EVIDENCE_MAP.md §10。
```

### 11.2 `tests/`（12 个文件，全部已跟踪）

```text
tests/pre-write-gate.mjs          → 生成 reports/evidence/pre-write-gate/
tests/workflow-e2e.mjs            → 生成 reports/evidence/workflow-e2e/
tests/bridge-acceptance.mjs       → 54/54 PASS（见 PHASE0 与 BRIDGE_TEST_REPORT）
tests/e2e-mcp.mjs                 → 30/30 PASS
tests/v2-contract.mjs
tests/verify-mcp-tools.mjs
tests/verify-ssrf.mjs
tests/p0-remediation.mjs
tests/tshirts-v3-lessons.mjs
tests/README.md / package.json / package-lock.json
```

```text
结论：本仓库的「能力可信度」证据是完整的；
      本 Pack 缺失的是「Prada 这个品牌的事实」的证据。
```

---

## 12. 与仓库既有治理文档的关系

本报告不是从零开始，而是接在既有治理之上。必须明确两者关系：

```text
reports/PRODUCTION_READINESS_REPORT.md（2026-09-18，repo @ b503d47，tag v0.1.0）
  范围：整个系统
  判定：BLOCKED —— "not ready for a live production write"
  并给出两项未验证：live browser execution path、category routes

reports/PRE_WRITE_REVIEW_GATE.md（2026-09-18）
  范围：单商品（Thom Browne 536027551768089）
  判定：NO-GO，三项 blocker（会话过期 / 回滚基线 70-100 / 选择器未实测）

reports/prada/production-readiness-report.md（2026-09-20，见 Phase 4）
  范围：Prada Pack
  判定：false —— 与上述结论一致，并补充 Prada 专属 blocker
```

```text
RULE-ID: EV-05
IF 报告 Prada 的生产就绪状态
THEN 必须同时声明它与仓库级判定（BLOCKED / NO-GO）的关系
     不得让读者以为 Prada 是唯一未就绪的部分
OUTPUT PASS
```
