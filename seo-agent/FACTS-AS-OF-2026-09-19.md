---
id: seo-agent.facts-as-of-2026-09-19
kind: fact-ledger
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
as_of: 2026-09-19
applies_to: all-products
remote: git@github.com:Kevin-hr/drip-seo-agent.git
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - git fetch over SSH + git for-each-ref (2026-09-19)
  - gh api repos/Kevin-hr/drip-seo-agent/... (2026-09-19)
  - .gitattributes / STATUS.md / docs/architecture/DECISION_LOG.md @ b2505b2
  - docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md @ b2505b2
  - reports/V4.4_STANDARD_FINAL_MIGRATION_2026-09-19.md @ b2505b2
  - reports/evidence/t-shirts-v3/verified-baseline.json @ b2505b2
  - 工作区根目录 PROGRESS.md / FINAL-REPORT.md / BLOCKED.md（AJ1 run，未入 git）
---

# 已完成事实台账（截至 2026-09-19）

> 本文件的目的：把**散落在 4 条互不包含分支上的已完成事实**集中登记成一张可核验的表，
> 并明确标注每条事实的存放位置与"是否已归一"。
>
> 本文件**只登记事实，不产出商品，不合并分支**。合并决策见 `MIGRATION-PLAN.md`。

---

## 1. 仓库与分支实况（实测）

```text
remote   : git@github.com:Kevin-hr/drip-seo-agent.git   (private)
default  : main
measured : 2026-09-19

refs/heads/main                                  ee0ef7f
refs/heads/codex/upgrade-seo-pdp-v4.4-final      b2505b2   (main + 4)
refs/heads/codex/hellstar-hoodies-seo-pdp-3.2    c581909   (main + 1)
refs/heads/codex/drip-seo-agent-work-2026-09-19  645638b   (main + 1)
refs/heads/feature/v5-llm-evidence-layer         2981f86   (main + 1)
refs/tags/v0.1.0                                 8c404fd
refs/tags/v0.5.0-alpha                           28a11a5

develop  : 不存在
```

```text
RULE-ID: FACTS-01
IF 需要引用"当前状态"
THEN 必须说明是引用了哪一条分支或哪个提交
     因为 4 条分支互不包含，单说"仓库里"没有意义
OUTPUT PASS

RULE-ID: FACTS-02
IF 只做过 codex/hellstar-hoodies-seo-pdp-3.2 的 fetch
THEN 不得对仓库整体状态下结论（这正是 v1.0 第一版犯的错）
OUTPUT HOLD
```

---

## 2. 标准身份（唯一活动标准）

```text
decision : docs/architecture/DECISION_LOG.md #008  (2026-09-19)
文件      : standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
version   : 4.4
status    : FINAL
bytes     : 19351
sha256    : 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
EOL       : LF（由 .gitattributes 强制 eol=lf，故原始字节哈希 == LF 哈希）
```

被取代的上一版：

```text
文件   : standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
bytes  : 23567
sha256 : 5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8
状态   : 曾由 Decision #001 / #002 / #007 认定为活动标准（2026-09-18）
         由 Decision #008 取代（2026-09-19），现仅保留历史价值
```

`.gitattributes`（b2505b2 新增）对以下 5 个同内容副本强制 `text eol=lf`：

```text
standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
dripops/standards/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
mcp-plugin/rules/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
mcp-plugin/skills/drip-seo-executor/references/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
```

---

## 3. 已完成事实（按证据强度排列）

### 3.1 V4.4 标准迁移（`codex/upgrade-seo-pdp-v4.4-final` = b2505b2）

```text
4 个提交：
  05872cd8  chore: promote SEO-PDP V4.4 final standard
  d61189ce  build: preserve V4.4 standard byte identity
  60336e09  docs: carry T-Shirts V3 lessons into V4.4
  b2505b2f  style: normalize T-Shirts knowledge files
```

自述验证结果（`reports/V4.4_STANDARD_FINAL_MIGRATION_2026-09-19.md`，Result: PASS）：

```text
npm run typecheck                         PASS
npm test                                  PASS — 19/19
npm run check-package                     PASS — 12 tools
dotnet build ... --configuration Release  PASS — 0 warnings, 0 errors
dripops/build.ps1                         PASS
dripops/dist/DripOps.exe self-test        PASS — no failures
git diff --check（排除字节锁定副本）        PASS
No live MrShopPlus write or publication was performed by this migration.
```

产出的新文件：

```text
.gitattributes
docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md        7165 bytes
reports/V4.4_STANDARD_FINAL_MIGRATION_2026-09-19.md   1516 bytes
reports/evidence/t-shirts-v3/verified-baseline.json   7757 bytes
tests/tshirts-v3-lessons.mjs                          （新增）
standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md       （提升为活动标准）
standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md（移入）
```

```text
RULE-ID: FACTS-11
IF 需要 V4.4 的"哪些检查通过"
THEN 引用上表，并注明它来自迁移报告的自述
     （我未在本机复跑这 6 项，故标注为"自述"而非"已复验"）
OUTPUT VERIFY
```

### 3.2 T-Shirts V3 → V4.4 经验与机器可读基线（b2505b2）

```text
文档   : docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md
基线   : reports/evidence/t-shirts-v3/verified-baseline.json
回归   : tests/tshirts-v3-lessons.mjs
```

已验证的历史结果（文档 + JSON 双份）：

```text
FrontendVerified + Verified + validation.isValid=true 同时满足的 distinct 商品数 : 11
其中 PDP 3.1.1 : 9
其中 PDP 3.2   : 2
V4.4 下独立重新验收通过 : 0
候选快照 : 200
2026-09-02 快照的 published=10 : 历史值，已过期
```

**11 个真实商品（名称 + SKU，逐字来自该文档）**：

| Product ID | V3 PDP | Product | Verified SKU |
|---|---|---|---|
| 536027552860691 | 3.1.1 | Givenchy Stamp Print T-Shirt White | BM71NK3YSA-100 |
| 536027552907547 | 3.1.1 | Givenchy Stamp Print T-Shirt Black | BM71NK3YSA-001 |
| 536027553036823 | 3.1.1 | Loewe Relaxed Fit Embroidered Logo T-Shirt White | S359Y22XAC-2100 |
| 536027559207962 | 3.1.1 | BAPE ABC Camo By Bathing Ape Tee Black/Green | 0ZXTEM110006N |
| 536027545737240 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Gucci Embroidery Off White/Navy | 756596XJFV89088 |
| 536027545785624 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Embroidery Navy/White | 756596XJFV84930 |
| 536027547266582 | 3.2 | adidas Originals Britcore Short Sleeve Ringer T-Shirt Off White/Aurora Coffee | HZ3830 |
| 536027547297304 | 3.2 | adidas Originals Britcore Short Sleeve Ringer T-Shirt Crystal Sky | HZ3831 |
| 536027549064979 | 3.1.1 | Gucci Cotton Piquet T-Shirt with Embroidery Black | 856003XJHQG1043 |
| 536027550608151 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Embroidery White | 835640XJHCV9692 |
| 536027550738203 | 3.1.1 | Gucci Cotton Jersey T-Shirt with Embroidery Grey Mélange | 835640XJHCW1183 |

计数推导（可复算）：

```text
第一个 run（名为 "first 30"）   : 30 个快照 → 4 个终态成功
候选池 run（200 个）            : +7 个终态成功
4 + 7 = 11  ✓
两个 run 的 run.json 均记录 standardVersion = 3.1.1
```

文档同时确立的失效边界：

```text
t-shirts-30-final-2026-09-07 从未创建      → 不得引用为权威 run
t-shirts-200-2026-09-07       GlobalBlocked  → productIds=[] / backendWrites=0
"30/30 completed" 是禁止表述
V3 的 HTML 模板 / 关键词数量 / 标题结构 一律不得直接搬入 V4.4
```

### 3.3 Prada 案例研究（`codex/drip-seo-agent-work-2026-09-19` = 645638b）

```text
1 个提交：645638b7  docs: capture Prada batch preflight learnings
新增文件：
  docs/case-studies/PRADA_78_PREFLIGHT_CASE.md
  docs/case-studies/PRADA_BATCH_LEARNINGS.md
  tests/fixtures/prada/preflight-summary.json
  tests/prada-case-regression.mjs
修改：README.md / RELEASE_NOTES_V0.5.0_ALPHA.md / tests/README.md / tests/package.json
```

```text
RULE-ID: FACTS-21
IF 引用这两个 Prada 案例文档
THEN 注明它们位于 645638b，**不在本分支**
     且本知识层尚未逐字核验其内容（只有文件名与提交信息为证据）
OUTPUT VERIFY
```

### 3.4 V5.1 证据层计划（`feature/v5-llm-evidence-layer` = 2981f86）

```text
1 个提交：2981f866  docs(v5.1): add LLM Evidence Layer development plan
新增文件：docs/architecture/V5.1_LLM_EVIDENCE_LAYER_PLAN.md
```

注：本地工作区另有一份 `analysis/v5/EVIDENCE_SCHEMA_SPEC.md`，其 front-matter 状态为 V5.1-DRAFT / 待审批，字段（`confidence` / `color_histogram` / `match_score` 等）**不在** V44 运行态 schema 中。

### 3.5 Hellstar V4.4 端到端 playbook（`codex/hellstar-hoodies-seo-pdp-3.2` = c581909）

```text
1 个提交：c5819093  docs: migrate Hellstar workflow to SEO PDP V4.4
新增：docs/playbooks/HELLSTAR_HOODIES_SEO_PDP_V4.4_END_TO_END.md（438 行）
修改：README.md / docs/architecture/DECISION_LOG.md
```

该 playbook 内含 8 款 Hellstar 的历史锁定实体与 SKU（作为迁移基线，非免检许可）。它**不在本知识层所在分支上**。

### 3.6 Air Jordan 1 / 106 款 V4.4 批量（未入 git）

```text
Run ID : air-jordan-1-106-2026-09-18
位置   : 工作区根目录 PROGRESS.md / FINAL-REPORT.md / BLOCKED.md +
         air-jordan-1-baseline.json / .csv
         ⚠ 这些文件**不在任何 git 分支内**（外层 dripsneakers 仓库只跟踪 15 个文件）
结果   : 冻结 106 → PUBLISHED 101 / HOLD 4 / BLOCKED 1 / UNPROCESSED 0
         随机抽查 24 款 → 24 PASS / 0 FAIL
标准   : inputs/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
         sha256 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
         → **与 Decision #008 认定的活动标准同一份**（此前的"标准不一致"疑点由此消解）
未做   : Description 字段未修改；未使用 MCP Bridge 通道（浏览器直连执行）
```

```text
RULE-ID: FACTS-31
IF 需要引用 AJ1 106 款的证据
THEN 必须指出它在工作区而非 git 内
     → 这是知识层最大的单点风险：唯一一次 101 款成功记录没有版本控制保护
OUTPUT HOLD
```

### 3.7 Dior 批量（v3.2 产物，无线上验证）

```text
位置   : deliverables/Dior-Sneakers-PDP-V3.2-Report.md + dior-pdp-v32-results.json +
         dior-sneakers-products.json + 33 个 dior-*.pdp-v32.md（工作区，未入 git）
结果   : 42 款 → PASS 28 / FIX 2 / HOLD 12（HOLD 全部为 Denim Tears B33 无 SKU）
线上验证 : 无
```

### 3.8 各 run 的规模（工作区 run 目录）

```text
hellstar-hoodies-2026-09-02      标准 3.2   9 款    Ready 8 / Blocked 1 / published 0
t-shirts-first-30-2026-09-01     标准 3.1.1 30 快照  4 终态成功
t-shirts-candidate-pool-2026-09-02 标准 3.1.1 200 款 +7 终态成功
t-shirts-200-2026-09-07          GlobalBlocked  productIds=[] / backendWrites=0
air-jordan-1-106-2026-09-18      标准 4.4   106 款  101 published
```

---

## 4. 明确未完成 / 未验证（不得声称已完成）

```text
[ ] live write（生产真实写入）：从未执行过一次
      STATUS.md -> "Write path | Not verified — no live write has been performed"
[ ] First live execution：NO-GO
      reports/PRE_WRITE_REVIEW_GATE.md；rollback baseline 70/100（阈值 90）
[ ] MrShopPlus 后台会话过期
      live 读取失败直到 DripOps Chrome profile 重新登录
[ ] pre-write gate：tests/pre-write-gate.mjs = NO-GO
[ ] verify-ssrf.mjs：自 b503d47 起不可运行
[ ] T-Shirts 30 目标：未完成（11 / 30），V4.4 下重新验收 0 款
[ ] Prada 78：该 run 实际上传 0/78
[ ] Dior 42：无任何线上或后台验证
[ ] Hellstar：0 款发布（分类快照 published = 0）
[ ] develop 分支：不存在
[ ] Agent Contract 哈希三处不一致（见 §5）
```

---

## 5. 事实性不一致（已发现，未擅自归一）

| # | 不一致 | 三处取值 | 处置 |
|---|---|---|---|
| 1 | Agent Contract V2.0 哈希 | STATUS.md 记 `2bdeb72f2ca1edb1691141005bb413248eedbd8eecf078ada60d4e747551a1da`；文件 LF 哈希 `bfec9800151c96f039dd8cced7a038b2ae5e46a509dd425f4b9321e42a7bc7ac`；文件 CRLF 原始哈希 `6b97a78b361f6e372d5997814765fb0ce4cb6db95369bb3075281c36b36ec9bb` | **待人工确认**：pin 过期还是文件误改。文件未被 .gitattributes 覆盖 |
| 2 | 4 条分支互不包含 | 每条都是 `main + N`，没有任何一条包含其余分支的成果 | 需合并决策（见 MIGRATION-PLAN D-A..D-D） |
| 3 | AJ1 关键证据未入 git | PROGRESS.md / FINAL-REPORT.md / BLOCKED.md 仅在工作区 | 建议后续纳入版本控制 |
| 4 | 本知识层 v1.0 第一版的标准锁定 | 曾引 `_CLEAN_CONSOLIDATED_2026-09-17.md` / `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8`（已于 2026-09-19 被 Decision #008 取代） | 已在本版全部修正（22 个文件 / 44 行 front-matter） |

---

## 6. 本台账的维护约定

```text
RULE-ID: FACTS-99
IF 新增任何一条"已完成"事实
THEN 必须在本文件登记：事实 + 证据位置（分支/提交/文件/哈希/计数）+ 证据强度（自述 or 已复验）
OUTPUT PASS
```

```text
证据强度标签：
  已复验 = 我在本机亲自跑过并保留输出
  自述   = 来自仓库文档的自述，我未复跑
  转述   = 来自第三方记录，未交叉验证
```
