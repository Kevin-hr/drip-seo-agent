---
id: reports.prada.phase5-governance-evidence-map
kind: governance-report
phase: 5
task: 2
version: 1.0.0
status: ACTIVE
generated: 2026-09-20
branch: feature/prada-phase5-review
method: read-only; existence and tracking verified by git ls-files against this branch
---

# Governance Evidence Map

## 0. 本文的用途来源标注（重要）

```text
本表每一行的 Purpose 都标注来源，防止把"推断"当"事实"（Rule 1）：

T   = 取自该文件自身的标题（已实际读取文件内容）
P   = 仅由文件路径/名称推断（该文件没有可读的内嵌标题，例如 .json / .mjs）

本文不猜测任何用途。凡无法从文件本身或路径得出的用途，记 UNKNOWN。
```

## 1. 存在性与跟踪性总览

```text
git ls-files 统计（本分支 feature/prada-phase5-review）
  reports/          56 个文件   全部已跟踪
  tests/            12 个文件   全部已跟踪
  packs/prada/       9 个文件   全部已跟踪
  ────────────────────────────────
  仓库跟踪总数      204 个文件
```

---

## 2. 指定的三项治理证据（本任务要求确认）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `reports/PRODUCTION_READINESS_REPORT.md` | YES (8,464 B) | YES | T — 系统级就绪判定。含 `# BLOCKED`，明示未就绪，列出未验证项与未缓解风险 |
| `reports/PRE_WRITE_REVIEW_GATE.md` | YES (8,445 B) | YES | T — 单商品写入门禁评审。含 `# NO-GO` 与三项 blocker（会话过期 / 回滚基线 70-100 对 90 / 选择器未实测） |
| `reports/evidence/pre-write-gate/99-gate-result.json` | YES (16,142 B) | YES | P + 已核验内容 — 写入门禁的机器可读判定。verdict=NO-GO、execute.save_status="SIMULATED — MrShopPlus was NOT contacted"、product_id=536027551768089、baseline.score=70、gate_g1_pass=false |

```text
三项全部 Exists = YES 且 Tracked = YES。已读取内容确认其声称与文件实际一致。
```

```text
RULE-ID: P5-M01
IF 引用上述三项之一
THEN 必须注明它是通用基础设施证据，不是 Prada 案例证据（Rule 3）
OUTPUT PASS
```

---

## 3. reports/ 顶层文件（23 个，全部已跟踪）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `reports/README.md` | YES | YES | T — Reports 目录索引 |
| `reports/PRODUCTION_READINESS_REPORT.md` | YES | YES | T — 系统级就绪判定：BLOCKED |
| `reports/PRE_WRITE_REVIEW_GATE.md` | YES | YES | T — 写入门禁：NO-GO |
| `reports/RELEASE_PRECHECK_REPORT.md` | YES | YES | T — Release precheck |
| `reports/REPOSITORY_INTEGRITY_REPORT.md` | YES | YES | T — 仓库完整性 |
| `reports/STANDARD_INTEGRITY_REPORT.md` | YES | YES | T — 标准完整性 |
| `reports/BRIDGE_TEST_REPORT.md` | YES | YES | T — Bridge 测试报告 |
| `reports/MCP_SECURITY_TEST_REPORT.md` | YES | YES | T — MCP 安全测试 |
| `reports/WORKFLOW_E2E_REPORT.md` | YES | YES | T — 工作流端到端报告 |
| `reports/V2_CONFORMANCE_AUDIT.md` | YES | YES | T — Agent Contract V2.0 一致性审计 |
| `reports/V5_READINESS_GAP_REPORT.md` | YES | YES | T — V5 就绪差距 |
| `reports/V5_RELEASE_COMPLETION_REPORT.md` | YES | YES | T — V5 发布完成情况 |
| `reports/THOM_BROWNE_SIMULATION_REPORT.md` | YES | YES | T — Thom Browne 模拟执行报告 |
| `reports/P0-1_URL_STABILITY_REPORT.md` | YES | YES | T — P0-1 URL 稳定性风险 |
| `reports/P0-2_SNAPSHOT_FRESHNESS_REPORT.md` | YES | YES | T — P0-2 快照时效风险 |
| `reports/FINAL_P0_REMEDIATION_REPORT.md` | YES | YES | T — P0 整改总结 |
| `reports/LIVE_EXECUTION_READINESS_CHECK.md` | YES | YES | T — 实盘执行就绪检查 |
| `reports/LIVE_FIRST_EXECUTION_PLAN.md` | YES | YES | T — Phase 8 首次实盘执行计划 |
| `reports/PHASE_8_1_SAFE_WRITE_PLAN.md` | YES | YES | T — Phase 8.1 安全写入计划（仅 SEO 字段） |
| `reports/PHASE0-GITHUB-FREEZE.md` | YES | YES | T — Phase 0 工程冻结 |
| `reports/PHASE0-V0.1-ACCEPTANCE.html` | YES | YES | P — Phase 0 v0.1 验收（HTML） |
| `reports/V0.1-VERIFICATION-AND-GAP.html` | YES | YES | P — v0.1 验证与差距（HTML） |
| `reports/V4.4_STANDARD_FINAL_MIGRATION_2026-09-19.md` | YES | YES | T — V4.4 标准 FINAL 迁移报告 |

---

## 4. reports/evidence/（28 个，全部已跟踪）

### 4.1 pre-write-gate（8）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `.../01-live-snapshot.json` | YES (372 B) | YES | P + 已核验 — 实盘快照读取结果；仅 372 字节，对应 502 失败返回 |
| `.../01-local-snapshot.json` | YES (16,183 B) | YES | P — 本地 checkpoint 快照（作为 basis=local-checkpoint 的来源） |
| `.../02-plan.json` | YES (11,651 B) | YES | P — 生成的 plan |
| `.../03-execute-simulated.json` | YES (12,149 B) | YES | P — 模拟执行产物（文件名即标注 simulated） |
| `.../04-verify.json` | YES (2,514 B) | YES | P — 验证步骤产物 |
| `.../05-baseline-and-gates.json` | YES (11,464 B) | YES | P + 已核验 — 回滚基线与门禁；score=70、gate_g1_pass=false、verdict=NO-GO、3 个分类记为 "NO READER" |
| `.../06-plan-contract.json` | YES (1,911 B) | YES | P — plan 契约 |
| `.../99-gate-result.json` | YES (16,142 B) | YES | P + 已核验 — 门禁总判定，见 §2 |

### 4.2 workflow-e2e（18）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `.../n1-health.json` | YES | YES | P — 步骤 1：健康检查 |
| `.../n2-search.json` | YES | YES | P — 步骤 2：检索 |
| `.../n3-read.json` | YES | YES | P — 步骤 3：读取 |
| `.../n3b-snapshot-baseline.json` | YES | YES | P — 步骤 3b：快照基线 |
| `.../n3c-storefront-baseline.json` | YES | YES | P — 步骤 3c：店铺前台基线 |
| `.../n4-hold-blocks.json` | YES | YES | P — 步骤 4：HOLD 阻断验证 |
| `.../n4-sku-gate-reject.json` | YES | YES | P — 步骤 4：SKU 闸门拒绝验证 |
| `.../n5-plan-migration.json` | YES | YES | P — 步骤 5：迁移 plan |
| `.../n5b-plan-keep-url.json` | YES | YES | P — 步骤 5b：保留 URL 的 plan |
| `.../n7-execute-simulated.json` | YES | YES | P — 步骤 7：模拟执行 |
| `.../n7-execute-simulated-keep-url.json` | YES | YES | P — 步骤 7：保留 URL 的模拟执行 |
| `.../n8-verify-migration.json` | YES | YES | P — 步骤 8：迁移后验证 |
| `.../n8-verify-keep-url.json` | YES | YES | P — 步骤 8：保留 URL 的验证 |
| `.../n9-run-status.json` | YES (48,254 B) | YES | P — 步骤 9：run 状态 |
| `.../n10-fresh-snapshot.json` | YES | YES | P — 步骤 10：新鲜快照 |
| `.../n10-stale-snapshot.json` | YES (382 B) | YES | P — 步骤 10：过期快照拒绝 |
| `.../n11-plan-on-disk.json` | YES | YES | P — 步骤 11：落盘 plan |
| `.../workflow-summary.json` | YES (12,881 B) | YES | P — 工作流汇总 |

### 4.3 其他（2）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `.../t-shirts-v3/verified-baseline.json` | YES (7,932 B) | YES | P — T-Shirts V3 可复验基线（Core 03 的旧格式样本） |
| `.../v2-contract/v2-conformance.json` | YES | YES | P — V2 契约一致性产物 |

---

## 5. reports/prada/（5 个，全部已跟踪）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `reports/prada/evidence-availability-report.md` | YES | YES | T — Phase 1 证据可用性检查 |
| `reports/prada/sku-migration-plan.md` | YES | YES | T — Phase 2 SKU 迁移治理 |
| `reports/prada/legacy-risk-inventory.md` | YES | YES | T — Phase 3 遗留风险清单 |
| `reports/prada/production-readiness-report.md` | YES | YES | T — Phase 4 生产就绪判定 |
| `reports/prada/evidence-manifest.json` | YES | YES | P + 已核验 — 36 个未入库证据文件的 sha256 清单 |
| `reports/prada/PRADA_PHASE5_BLOCKER_REVIEW.md` | YES | YES（本阶段新增） | T — Phase 5 阻塞项评审 |
| `reports/prada/GOVERNANCE_EVIDENCE_MAP.md` | YES | YES（本阶段新增） | T — 本文件 |
| `reports/prada/PRADA_REMEDIATION_ROADMAP.md` | YES | YES（本阶段新增） | T — Phase 5 整改路线图 |

---

## 6. tests/（12 个，全部已跟踪）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `tests/README.md` | YES | YES | T — "Cross-component tests" |
| `tests/pre-write-gate.mjs` | YES (10,570 B) | YES | P — 生成 reports/evidence/pre-write-gate/ 的门禁执行器 |
| `tests/workflow-e2e.mjs` | YES (31,775 B) | YES | P — 生成 reports/evidence/workflow-e2e/ 的端到端执行器 |
| `tests/bridge-acceptance.mjs` | YES (20,491 B) | YES | P — Bridge 验收（54/54 PASS，见报告） |
| `tests/e2e-mcp.mjs` | YES (7,786 B) | YES | P — MCP 端到端（30/30 PASS，见报告） |
| `tests/v2-contract.mjs` | YES (10,328 B) | YES | P — V2 契约一致性 |
| `tests/verify-mcp-tools.mjs` | YES (4,490 B) | YES | P — MCP 工具面校验 |
| `tests/verify-ssrf.mjs` | YES (949 B) | YES | P — SSRF 防护校验 |
| `tests/p0-remediation.mjs` | YES (11,753 B) | YES | P — P0 整改校验 |
| `tests/tshirts-v3-lessons.mjs` | YES (1,486 B) | YES | P — T-Shirts V3 经验回归 |
| `tests/package.json` | YES | YES | P — 测试依赖声明 |
| `tests/package-lock.json` | YES | YES | P — 依赖锁定 |

```text
关键判定：tests/ 下没有任何 Prada 专属测试。
         Prada 专属回归（tests/prada-case-regression.mjs）在 645638b，本分支不可见。
```

---

## 7. packs/prada/（9 个，全部已跟踪）

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `packs/README.md` | YES | YES | T — Brand Packs 顶层说明（Pack 与 Core 的边界） |
| `packs/prada/README.md` | YES | YES | T — Prada Pack v1.0.0 说明 |
| `packs/prada/pack.json` | YES | YES | P — 机器可读品牌知识（naming / sku / categories / blocked / provenance） |
| `packs/prada/cases.md` | YES | YES | T — Prada 案例记录 |
| `packs/prada/tests/prada-cases.json` | YES | YES | P — Pack 专属测试案例 |
| `packs/prada/tests/run-prada-pack-tests.mjs` | YES | YES | P — Pack 一致性运行器 |
| `packs/prada/tools/classify-urls.mjs` | YES | YES | P — URL 分类器（调用 Core 引擎，只读） |
| `packs/prada/tools/build-evidence-manifest.mjs` | YES | YES | P — 证据清单生成器（只读） |
| `packs/prada/tools/verify-evidence-manifest.mjs` | YES | YES | P — 证据清单校验器（只读） |

---

## 8. Prada 案例证据（工作区，**全部未跟踪**）

这一组是 Rule 3 的核心对象：它们**不是**基础设施证据，而是 Prada 的事实来源。

| File | Exists | Tracked | Purpose |
|---|---|---|---|
| `audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json` (382,135 B) | YES | **NO** | P + 已核验 — 78 款冻结清单（身份 / SKU / 分类 / 目标标题 / 图数） |
| `.../identity-audit.json` (23,105 B) | YES | **NO** | P + 已核验 — 14/64 存量拆分、9/5 发布拆分、66/12 SKU 分型 |
| `.../validation-checks.json` (727 B) | YES | **NO** | P — 清单校验结论 |
| `.../operations.jsonl` (4,420 B, 8 行) | YES | **NO** | P + 已核验 — 操作流水；含 read_product_list=failed，证明 0 次写入 |
| `.../PROGRESS.md` (1,585 B) | YES | **NO** | P — Task 1–4 全 PENDING，Progress 0/78 |
| `.../BLOCKED.md` (405 B) | YES | **NO** | P — 阻塞项记录 |
| `.../evidence/public-prada-seo-pdp-audit.json` (18,348 B) | YES | **NO** | P + 已核验 — 9 个线上页的 PDP 版本与结构审计（Phase 3 的来源） |
| `.../evidence/prada-source-inventory.json` (439,879 B) | YES | **NO** | P — 源目录文件夹级清单（含 content/tree signature） |
| `.../evidence/prada-visual-dedupe.json` (1,281,699 B) | YES | **NO** | P — 视觉近邻去重结果 |
| `.../evidence/public-to-local-image-matches.json` (17,602 B) | YES | **NO** | P + 已核验 — 公开图与本地图的 dhash/mae 比对（success case 的依据） |
| `.../evidence/backend-unpublished-image-matches.json` (10,945 B) | YES | **NO** | P — 后台未发布商品图比对 |
| `.../evidence/prada-78-first-image-contact-sheet.jpg` (902,125 B) | YES | **NO** | P — 78 款首图接触表 |
| `.../evidence/public-product-images/` (10 files, 1,395,878 B) | YES | **NO** | P — 公开站图片留存 |
| `.../evidence/backend-unpublished-images/` (6 files, 1,421,568 B) | YES | **NO** | P — 后台未发布商品图片留存 |
| `audit/2026-09-02T14-30-09+08-00-prada-78/evidence/` (空目录) | YES | **NO** | P — 空的遗留 run，不得被引用 |
| `shipping-audit/raw_products.json` (1,562,554 B) | YES | **NO** | P + 已核验 — 2026-09-15 公开站整站抓取；全项目唯一 |
| `scripts/build-prada-78-manifest.cjs` (27,828 B) | YES | **NO** | P — 清单构建器（命名公式与 SKU 分型的实现） |
| `scripts/validate-prada-seo-pdp-3.cjs` (7,528 B) | YES | **NO** | P — 清单校验器 |
| `scripts/inventory-prada.ps1` (4,866 B) | YES | **NO** | P — 源目录盘点 |
| `scripts/audit-public-prada.ps1` (5,092 B) | YES | **NO** | P — 公开页审计（Phase 3 版本分布的生产者） |
| `scripts/compare-public-prada-images.cjs` (3,092 B) | YES | **NO** | P — 公开图与本地图比对 |
| `scripts/prada-visual-dedupe.cjs` (6,898 B) | YES | **NO** | P — 视觉去重 |
| `check-prada.js` (0 B) | YES | **NO** | P — **0 字节，非校验器，不得引用** |

```text
合计 36 个文件 / 7,518,279 bytes —— 与 reports/prada/evidence-manifest.json 完全一致。
字节级枚举以该清单为准；本表给出用途与跟踪状态。
```

```text
RULE-ID: P5-M02
IF 报告 Prada 的证据状态
THEN 必须把 §8（未跟踪，Prada 事实）与 §3–§7（已跟踪，基础设施）分开陈述
OUTPUT PASS
```

---

## 9. 结论

```text
已跟踪       reports/ 56 + tests/ 12 + packs/prada/ 9 = 77 个治理与工具文件
未跟踪       36 个 Prada 案例证据文件（7,518,279 bytes）

Prada 事实来源：全部未跟踪，风险状态 EVIDENCE_SINGLE_POINT_RISK（未降级）
基础设施证据：全部已跟踪，且三项指定证据内容已逐项核验
```

---

## 10. 一处计数更正（自查发现）

```text
reports/prada/evidence-availability-report.md §11.1 原写：
  "证据文件（32 个）"
实测（本分支 git ls-files + 逐目录计数）：
  reports/evidence/ 下共 28 个文件
    pre-write-gate  8
    workflow-e2e   18
    t-shirts-v3     1
    v2-contract     1
  23（顶层）+ 28（evidence）+ 5（prada）= 56 ✓ 与 reports/ 总数吻合

结论：原"32"为计数笔误，应为 28。已在本分支同步修正该文件。
（feature/prada-production-readiness 未作任何修改，按 Git Rules 保持原样。）
```

```text
RULE-ID: P5-M03
IF 发现既有交付物中的计数错误
THEN 必须显式记录更正，不得静默修改
OUTPUT PASS
```
