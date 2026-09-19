---
id: seo-agent.migration-plan
kind: plan
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [repo:drip-seo-agent]
created: 2026-09-19
branch: feature/seo-agent-knowledge-v1
base_commit: c581909
evidence_basis:
  - git worktree list / git branch -a / git remote -v（2026-09-19 实测）
  - drip-seo-agent/STATUS.md
  - drip-seo-agent/README.md
---

# 迁移计划（MIGRATION-PLAN.md）

> 从当前分支状态迁移到 `feature/seo-agent-knowledge-v1` 知识层，
> 并给出通往 `main → develop → feature/*` 结构的可执行步骤。

---

## 1. 实测的仓库现状（2026-09-19，命令输出为证）

```text
命令 : git -C <dripsneakers> worktree list
输出 : C:/Users/Administrator/Documents/01_Projects/dripsneakers                   5aeed6a [feat/hellstar-hoodies-seo-pdp-3.2]

命令 : git -C <dripsneakers/.codex-worktrees/drip-seo-agent-hellstar-v44> remote -v
输出 : origin  https://github.com/Kevin-hr/drip-seo-agent.git (fetch)
       origin  https://github.com/Kevin-hr/drip-seo-agent.git (push)

命令 : git -C <.../drip-seo-agent-hellstar-v44> branch -a
输出 : * codex/hellstar-hoodies-seo-pdp-3.2
         remotes/origin/codex/hellstar-hoodies-seo-pdp-3.2

命令 : git -C <.../drip-seo-agent-hellstar-v44> log --oneline -n 5
输出 : c581909 docs: migrate Hellstar workflow to SEO PDP V4.4
       ee0ef7f docs: add v0.5.0-alpha release notes and completion report
       d1d3193 feat: complete V5 evidence-driven architecture foundation
       a774535 fix(p0): remediate URL stability + snapshot freshness; add gates, audits and agent contract
       b503d47 feat: initial Drip SEO Agent architecture freeze
```

### 1.1 四个必须首先承认的事实（v1.0 第一版曾在此犯错，本版已更正）

```text
事实 1  任务书写的当前分支是存在的
        任务书: Current branch: codex/upgrade-seo-pdp-v4.4-final
        实测  : 存在，tip = b2505b2（main + 4），远端与本地均已具备。
        v1.0 第一版误报"不存在"，原因：本地副本只 fetch 过
        codex/hellstar-hoodies-seo-pdp-3.2，从未 fetch main 与其余分支。

事实 2  main 存在，develop 不存在
        远端默认分支 = main（ee0ef7f）。
        远端共 5 条分支，全部是 "main + N"，且**互不包含**：
          main                                 ee0ef7f
          codex/upgrade-seo-pdp-v4.4-final     b2505b2   main + 4
          codex/hellstar-hoodies-seo-pdp-3.2   c581909   main + 1
          codex/drip-seo-agent-work-2026-09-19 645638b   main + 1
          feature/v5-llm-evidence-layer        2981f86   main + 1
        develop 确实不存在。
        → "不要直接合并到 main" 这条约束的对象确实存在，必须遵守。

事实 3  drip-seo-agent 的真实 git 仓库不在 drip-seo-agent/ 目录里
        真实仓库 : .codex-worktrees/drip-seo-agent-hellstar-v44/（含 .git 目录）
        工作区可见的 drip-seo-agent/ 目录：**没有 .git**，是一份未受版本控制的副本
                 （它在 dripsneakers 这个外层仓库里也是 untracked）
        → 任何 git 操作都必须落在 .codex-worktrees/ 下的那个仓库里

事实 4  网络路径受限，必须走 SSH
        git 走 HTTPS 访问 github.com 会被重置：
          Recv failure: Connection was reset / Empty reply from server
        SSH 可用：
          ssh -T git@github.com -> "Hi Kevin-hr! You've successfully authenticated"
        gh api 可用（api.github.com 正常）。
        → fetch/push 一律使用 git@github.com:Kevin-hr/drip-seo-agent.git
```

```text
RULE-ID: MIG-00
IF 要对 drip-seo-agent 做 git 操作
THEN 必须定位到 .codex-worktrees/drip-seo-agent-hellstar-v44
     不得假设 dripsneakers/ 根目录或 drip-seo-agent/ 子目录是同一仓库
OUTPUT HOLD
```

---

## 2. 本次已完成的迁移（Commit 记录为证）

```text
新分支   : feature/seo-agent-knowledge-v1
创建方式 : git worktree add -b feature/seo-agent-knowledge-v1 <新路径> <base>
新工作树 : .codex-worktrees/drip-seo-agent-knowledge-v1
基线提交 : b2505b2  （= codex/upgrade-seo-pdp-v4.4-final tip，main + 4）
发布方式 : SSH push（HTTPS 被阻断，见 §1.1 事实 4）
副作用   : 无。未修改任何既有文件；hellstar 工作树保持 clean（未动过）
```

基线选择说明（重要）：

```text
第一版曾以 c581909（hellstar 分支）为基线，因为当时本地只 fetch 过那一条分支。
发现远端真实状态后改为 b2505b2，理由：
  b2505b2 含 Decision #008 认定的活动标准（..._STANDARD_FINAL.md，965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7）
  + .gitattributes 的 LF 字节锁定 + T-Shirts V3 经验文档 + 机器可读基线 + 回归测试
  → 这是 5 条分支中**事实密度最高、且标准最新**的一条
未选择的做法与原因：
  未把 4 条分支合并进来（会在 README.md / DECISION_LOG.md 产生语义冲突，
  且需要人工裁决）；改为在 FACTS-AS-OF-2026-09-19.md 中逐条登记其内容与位置
```

四个独立提交：

```text
eff10d8  feat: create SEO PDP Agent core knowledge architecture
         8 files  —— seo-agent/README.md + seo-agent/core/*.md（7 个）

1a36674  feat: extract Prada reusable knowledge
         13 files —— knowledge/brands/{prada,nike,dior,moncler}/* + cases/prada-success-case.md

e21f88f  feat: extract T-Shirts V4.4 knowledge
         9 files  —— knowledge/categories/{tshirts,sneakers,hoodies,jackets}/* +
                     cases/tshirts-v4.4-case.md + cases/future-cases/*

（Commit 4）feat: create Agent registry
         —— seo-agent/registry.md + seo-agent/MIGRATION-PLAN.md
```

```text
约束遵守情况：
  未修改 main（不存在）
  未合并到任何分支
  未产出任何商品 PDP（本分支只含 .md 与目录）
  未触碰 .codex-worktrees/drip-seo-agent-hellstar-v44（git status 全程 clean）
```

---

## 3. 目标 Git 结构（任务书要求）

```text
main
 |
 |
develop
 |
 |
feature/seo-agent-knowledge-v1   ← 本次成果

future:
feature/prada-pack
feature/dior-pack
feature/jordan-pack
feature/mcp-execution
```

### 3.1 这个结构目前缺 2 个前置件

```text
[ ] main    —— 不存在
[ ] develop —— 不存在
```

因此**本迁移计划的第一步不是合并代码，而是先决定 main 的历史基线。**

这是一个需要人工拍板的事项（见 §4 决策 D-A），Agent 不得自行决定。

---

## 4. 需要人工决策的事项

| # | 决策 | 选项 | 影响 |
|---|---|---|---|
| D-A | `main` 的历史基线取哪一个？ | (1) 取 `c581909`（= 现有唯一分支 HEAD）<br>(2) 取 `b503d47`（最初的 architecture freeze）<br>(3) 另起干净历史 | 决定 `main` 的第一个提交，进而决定所有 feature 的 base |
| D-B | 现有 `codex/hellstar-hoodies-seo-pdp-3.2` 如何处置？ | (1) 改名为 `develop`<br>(2) 合并进 `develop` 后保留<br>(3) 保留为历史分支 | 决定 develop 的起点 |
| D-C | 知识层是否要同时落到 `dripsneakers/drip-seo-agent/` 目录？ | (1) 保持单一份（在 worktree 里）<br>(2) 建立同步机制<br>(3) 把 worktree 变成规范检出 | 决定未来 Agent 从哪里读知识层 |
| D-D | 远端 `origin` 是否允许推送新分支？ | 是 / 否 | 决定能否 `git push -u origin` |

```text
RULE-ID: MIG-01
IF D-A 未决
THEN 不得创建 main 或 develop
OUTPUT HOLD
```

---

## 5. 迁移步骤（D-A / D-B 决策后执行）

### 5.1 建立 main 与 develop 骨架

```powershell
$repo = 'C:\Users\Administrator\Documents\01_Projects\dripsneakers\.codex-worktrees\drip-seo-agent-hellstar-v44'

# STEP 1  以决策 D-A 选定的基线创建 main（示例用 c581909）
git -C $repo branch main c581909

# STEP 2  以决策 D-B 选定的方式创建 develop
git -C $repo branch develop c581909
#   或（若选"把 hellstar 分支改名为 develop"）
# git -C $repo branch -m codex/hellstar-hoodies-seo-pdp-3.2 develop

# STEP 3  校验三支共存且互不干扰
git -C $repo branch -a
git -C $repo log --oneline -n 1 main
git -C $repo log --oneline -n 1 develop
```

```text
注意：以上命令只创建分支指针，**不切换任何工作树**，因此不会改变任何现有文件。
```

### 5.2 把知识层合入结构的正确顺序

```text
STEP 4  把 feature/seo-agent-knowledge-v1 合入 develop
        （不是直接合入 main）
        合入前先跑 §7 的验证清单

STEP 5  develop 稳定后，再按团队流程把 develop 合入 main
        本计划不代为执行这一步——它属于发布决策
```

```powershell
# STEP 4 示例（在干净的工作树里执行）
$wt = 'C:\Users\Administrator\Documents\01_Projects\dripsneakers\.codex-worktrees\drip-seo-agent-knowledge-v1'
git -C $wt status --short        # 必须为空
# 切到 develop 的工作树后再 merge，避免在 feature 工作树里切分支
```

```text
RULE-ID: MIG-02
IF 在 feature/seo-agent-knowledge-v1 的工作树里直接 git checkout develop
THEN 会改变该工作树的检出内容 → 禁止
     应另建 develop 的工作树，或使用 --no-checkout 的方式操作
OUTPUT HOLD
```

### 5.3 建立后续 Pack 分支的约定

```text
feature/prada-pack      ← 把 knowledge/brands/prada/ 升级到 V4.4 并补线上证据
feature/dior-pack       ← 解除 12 个 HOLD，修 5 处模板冲突，解决 SKU 复用冲突
feature/jordan-pack     ← 统一 AJ1 run 使用的标准文件与仓库锁定标准文件
feature/mcp-execution   ← 打通 live write（当前 STATUS.md 记录 NO-GO）
```

```text
每个 pack 分支的 Definition of Done：
  [ ] 该品牌/类目的 evidence_status 从 PARTIAL 升到 VERIFIED_CASE_AVAILABLE
  [ ] front-matter 的 version 递增
  [ ] registry.md §5 的"现状诚实口径"同步更新
  [ ] 至少产出一条新的 Reusable Rule 并上提到 core/
```

---

## 6. 从现有目录到知识层的迁移映射

| 现有位置 | 内容 | 去向 |
|---|---|---|
| `standards/V4.4/*.md` | V4.4 唯一活动标准 | **不迁移**。知识层只引用（core/pdp-template-v4.4.md 写明 sha256 锁定） |
| `standards/agent/AGENT_CONTRACT_V2.0.md` | Agent 契约 | **不迁移**。作为 core/** 的上游 |
| `dripops/src/DripOps/Rules/V44/*.cs` | 规则实现 | **不迁移**。core/quality-check.md 记录校验码映射 |
| `mcp-plugin/src/*.ts` | MCP 契约 | **不迁移**。registry.md §2.9 记录工具签名与守卫顺序 |
| `dripops/handoff/t-shirts-30/*` | T-Shirts 任务书与进度 | 已抽取 → `knowledge/categories/tshirts/` + `cases/tshirts-v4.4-case.md` |
| `dripops/dist/data/runs/hellstar-hoodies-2026-09-02/*` | Hellstar 3.2 run | 已抽取 → `knowledge/categories/hoodies/` |
| `audit/2026-09-02T*-prada-78/*` | Prada 78 清单与核验 | 已抽取 → `knowledge/brands/prada/` + `cases/prada-success-case.md` |
| 根目录 `PROGRESS.md` / `FINAL-REPORT.md` / `BLOCKED.md`（AJ1 106） | Air Jordan 1 V4.4 批量 | 已抽取 → `knowledge/brands/nike/` + `knowledge/categories/sneakers/` |
| `deliverables/Dior-*.md`、`dior-pdp-v32-results.json` | Dior v3.2 批量 | 已抽取（PARTIAL） → `knowledge/brands/dior/` |
| `deliverables/PRADA-78-END-TO-END-AI-EXECUTION-GUIDE.md` | Prada 任务书 | 已抽取 → `cases/prada-success-case.md` §6 |
| `dripops/standards/SEO-PDP-3.1.1.json`、`3.2.json`、`standards/_superseded/*` | 已淘汰标准 | **不迁移**。README.md 明确列为不得载入 |

```text
原则：知识层是**抽取层**，不是文件搬家。
      原始执行记录一律留在原位（它们是证据），知识层只放抽取后的规则与索引。
```

---

## 7. 合入前的验证清单

```text
结构
[ ] seo-agent/core/ 存在（7 个文件）
[ ] seo-agent/knowledge/brands/ 存在（4 个品牌 × 3 个文件）
[ ] seo-agent/knowledge/categories/ 存在（4 个类目）
[ ] seo-agent/cases/ 存在（2 个案例 + future-cases/）
[ ] seo-agent/registry.md 存在
[ ] seo-agent/MIGRATION-PLAN.md 存在

知识
[ ] Prada 经验已抽取（含 ProductID 536027476120336）
[ ] T-Shirts 经验已抽取（11 / 9 / 2 / 0 / 未完成 五数齐全）
[ ] HOLD 机制已文档化（core/hold-policy.md 触发条件可枚举）
[ ] Evidence 体系已文档化（core/evidence-policy.md 字段名与 Tier 分级）

占位诚实性
[ ] moncler/* 三个文件均标 status: PLACEHOLDER + evidence_status: NO_EVIDENCE
[ ] jackets/category-rules.md 同上
[ ] 全部占位文件正文无任何推测内容（已逐字检查）

可用性
[ ] registry.md §3 的 5 个问答均能独立作答
[ ] 每个技能都写明了 Reads / Fails_with

未越界
[ ] 本分支不含任何商品 PDP 产物
[ ] 未修改 standards/ 下任何文件
[ ] 未修改 dripops/ 下任何文件
[ ] 未修改 mcp-plugin/ 下任何文件
```

```text
验证命令（可直接执行）：
  git -C <wt> log --oneline c581909..HEAD
  git -C <wt> show --stat --oneline HEAD
  git -C <wt> diff --name-status c581909..HEAD
  → diff 结果必须全部是 "A"（新增），不得出现 "M" 或 "D"
```

---

## 8. 风险与回滚

| # | 风险 | 概率 | 影响 | 处置 |
|---|---|---|---|---|
| 1 | `dripsneakers/drip-seo-agent/` 副本与 worktree 版本长期分叉 | 高 | Agent 读到旧知识 | 执行决策 D-C；在此之前所有 Agent 必须只读 worktree 路径 |
| 2 | `main` 基线选错，导致历史不可追溯 | 中 | 需重写历史 | 执行决策 D-A 时留 review 记录 |
| 3 | 直接在 feature 工作树里切分支，覆盖检出内容 | 中 | 工作树内容被替换 | 遵守 MIG-02：另建工作树 |
| 4 | 两个 pack 分支同时改 registry.md 产生冲突 | 中 | 合并冲突 | registry.md 的 §5 用追加式段落；冲突时保留双方并去重 |
| 5 | 误把 `.codex-worktrees/drip-seo-agent-hellstar-v44` 当成普通目录清理 | 低 | 丢失整个仓库 | 该目录含 `.git`，属仓库本体；任何"清理 .codex-worktrees"的动作都要先确认 |
| 6 | 误把 0 字节文件当有效产物 | 中 | 假证据 | 已知 `check-prada.js` 为 0 字节；任何引用前先校验文件大小 |

### 回滚

```text
回滚整条分支（不影响任何既有内容）：
  git -C <repo> worktree remove <knowledge-v1 工作树路径>
  git -C <repo> branch -D feature/seo-agent-knowledge-v1

回滚单个提交：
  git -C <wt> revert <commit>

注意：回滚只涉及本分支新增的 seo-agent/ 目录，
      不会影响 standards/ / dripops/ / mcp-plugin/ 的任何内容。
```

---

## 9. 完成本迁移后的下一步（推荐）

```text
推荐优先级（按"能解锁多少下游价值"排序）：

P1  执行决策 D-A / D-B / D-C，建立 main → develop → feature/* 骨架
    → 没有这一步，任何 pack 分支都没有合法 base

P2  打通 feature/mcp-execution（live write）
    → STATUS.md 记录 "Write path | Not verified" / "First live execution | NO-GO"
    → 这是整个系统唯一未验证的关键路径；不打通，知识层就只能指导"直连后台"的执行

P3  建立 feature/jordan-pack
    → 把 AJ1 106 款的执行证据纳入版本控制
      （PROGRESS.md / FINAL-REPORT.md / BLOCKED.md / air-jordan-1-baseline.*
        目前只在工作区，不在任何分支内 —— 这是全项目最大的单点风险）
    → 标准一致性问题**已消解**：AJ1 run 用的
      inputs/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
      sha256 965314CDB899BFDDAAFD25D6E083BFF6861663C38A7860F553BE7E4B34D3E5B7
      与 Decision #008 认定的活动标准
      standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
      sha256 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
      **是同一份**。v1.0 第一版把它报成"不一致"，是因为对照了当时被取代的
      _CLEAN_CONSOLIDATED（5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8）
    → 这是目前唯一有 101 款成功记录的品牌，最值得固化为标准样板

P4  建立 feature/dior-pack
    → 解除 12 个 HOLD（评估 SKU_OMIT 路径）
    → 修 5 处 v3.2→V4.4 模板冲突
    → 解决 3SN272-ZIR1-6536 的归属冲突

P5  建立 feature/prada-pack
    → 把 66 个 internal_catalog SKU 重判为 SKU_OMIT 或补 Tier 1-4 证据
    → 修 9 个线上版本 3.3 的存量页

P6  补新建 Balenciaga / Bottega Veneta / LV 品牌包
    → 有素材，可按 brand-pack-creation 技能建包
```

```text
不建议做的事：
  不要在没有 live write 能力的前提下继续扩大商品数量
  → 那只会把"未验证的写入路径"乘以更多商品数
```
