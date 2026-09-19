---
id: seo-agent.root
kind: index
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
language: zh-CN + en-tokens
created: 2026-09-19
branch: feature/seo-agent-knowledge-v1
---

# SEO PDP Agent Knowledge Base v1.0

本目录不是商品产出目录。它是**把已发生的 SEO PDP 执行经验抽象成 Agent 可复用能力层**的结果。

一句话定位：

> 本知识库只回答"怎么做才对"，不产出任何 PDP 商品。

## 0. 这个知识库解决什么问题

在 v1.0 之前，成功经验被困在单个任务 / 单个分支 / 单个会话里：

- Prada 命名与核验流程只存在于 `audit/*prada-78/` 的 manifest 脚本里
- T-Shirts 的真实完成度与失败形态只存在于一次 handoff 的 `PROGRESS.md`
- V4.4 的硬门禁只存在于 C# 代码与一份 23KB 的标准文档里
- 每次新品牌（Dior / Nike / Moncler）都要重新"摸索一遍"

v1.0 之后，任何 Agent（ChatGPT + MCP / 本地 Agent / Codex）只需读 `registry.md` 即可知道：有哪些技能、输入什么、输出什么、什么情况下必须停下。

## 1. 目录结构

```text
seo-agent/
├── README.md                       ← 本文件：入口与阅读顺序
├── registry.md                     ← 技能注册表（Requirement 4）
├── MIGRATION-PLAN.md               ← 从现有分支/目录迁移到本知识层的计划
├── core/                           ← 跨所有商品、所有品牌的通用规则
│   ├── universal-seo-rules.md      ← 总纲（Requirement 1）
│   ├── identity-verification.md
│   ├── sku-validation.md
│   ├── evidence-policy.md
│   ├── hold-policy.md
│   ├── pdp-template-v4.4.md
│   └── quality-check.md
├── knowledge/
│   ├── brands/                     ← 品牌知识包
│   │   ├── prada/                  ← 证据完整（有已上线成功案例）
│   │   ├── nike/                   ← 证据完整（Air Jordan 1/11 批量 101 款上线）
│   │   ├── dior/                   ← 部分证据（历史 v3.2 批量，含 unknown 失败）
│   │   └── moncler/                ← 占位（无任何本地证据）
│   └── categories/                 ← 类目知识包
│       ├── sneakers/               ← 证据完整
│       ├── tshirts/                ← 证据完整（含真实失败记录）
│       ├── hoodies/                ← 部分证据（Hellstar 3.2 run）
│       └── jackets/                ← 占位（无任何本地证据）
├── cases/                          ← 单案例记录
│   ├── prada-success-case.md
│   ├── tshirts-v4.4-case.md
│   └── future-cases/
└── (无任何商品 PDP 产出)
```

## 2. Agent 阅读顺序（强制）

```text
STEP 1  registry.md                  → 找到本次任务需要哪个 skill
STEP 2  core/universal-seo-rules.md  → 载入总纲
STEP 3  core/identity-verification.md + core/sku-validation.md
STEP 4  core/hold-policy.md          → 先知道"什么时候必须停"
STEP 5  core/evidence-policy.md      → 证据对象与 Tier 分级
STEP 6  knowledge/brands/<brand>/    → 品牌规则（若存在）
STEP 7  knowledge/categories/<cat>/  → 类目规则（若存在）
STEP 8  core/pdp-template-v4.4.md    → 只有 entity_status = PASS 才允许载入
STEP 9  core/quality-check.md        → 交付前自检
```

禁止跳步。特别是：**在 STEP 8 之前生成任何 SEO 字段都是违规**。

## 3. 机器可读约定

本目录下所有 Markdown 文件遵守同一约定，便于 MCP / 本地 Agent 解析：

1. 每个文件以 YAML front-matter 开头，字段固定：`id` / `kind` / `version` / `status` / `schema` / `evidence_basis` / `applies_to`。
2. 每条规则写成三行块，禁止写成散文：

```text
RULE-ID: <模块前缀>-<两位序号>
IF <可判定的条件>
THEN <唯一动作>
OUTPUT <PASS | HOLD | ROLLBACK | SNAPSHOT_INCOMPLETE | SEO_GENERATION_FORBIDDEN>
```

3. 枚举值一律保留英文原文（`VERIFIED_SKU` / `SKU_OMIT` / `HOLD` / `PASS`），不得翻译、不得改写。
4. 未经验证的品牌 / 类目一律在 front-matter 标 `status: PLACEHOLDER`，并在正文写 `evidence_status: NO_EVIDENCE`。**禁止 Agent 用推测填充占位文件。**

## 4. 权威来源与版本锁定

本知识层不重新定义标准，它只是标准与经验的分发层。唯一权威来源（以远端 `codex/upgrade-seo-pdp-v4.4-final` = `b2505b2` 为准，实测于 2026-09-19）：

| 层 | 文件 | 锁定值 |
|---|---|---|
| SEO-PDP 标准（活动） | `standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md` | sha256 `965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7` |
| Agent 契约 | `standards/agent/AGENT_CONTRACT_V2.0.md` | STATUS.md 记为 `2bdeb72f2ca1edb1691141005bb413248eedbd8eecf078ada60d4e747551a1da`（见 §6 第 4 条，存疑） |

活动标准的认定依据是 `docs/architecture/DECISION_LOG.md` 的 **Decision #008（2026-09-19）**：

```text
The user-approved Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
is the only active SEO-PDP standard.
This decision explicitly supersedes the active-standard identity
selected by Decisions #001, #002 and #007.
```

```text
锁定值的校验口径（实测得出，必须遵守）：
  以上 sha256 对应的是**内容换行符归一为 LF 之后**的哈希。

  仓库已用 .gitattributes 对全部 SHA-256 锁定文件强制 `text eol=lf`：
    standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md text eol=lf
    standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md text eol=lf
    （另含 dripops/ 与 mcp-plugin/ 下的三个同内容副本）

  因此这三个文件在 Windows 上的原始字节哈希 == LF 哈希，不再有 CRLF 偏差。
  但 **`.gitattributes` 未覆盖 `standards/agent/AGENT_CONTRACT_V2.0.md`**：
  该文件在 Windows 工作区仍是 CRLF，原始字节哈希（6b97a78b361f6e372d5997814765fb0ce4cb6db95369bb3075281c36b36ec9bb）与 LF 哈希（bfec9800151c96f039dd8cced7a038b2ae5e46a509dd425f4b9321e42a7bc7ac）不同。
  校验任何哈希前先确认该文件是否在 .gitattributes 的 eol=lf 清单内。

  复现命令与完整说明见 core/quality-check.md §5.1。
```

冲突时的优先级：

```text
标准文件 > Agent Contract > 本知识层 > 单个历史案例
```

被淘汰、Agent 不得载入的标准：

```text
SEO-PDP 3.1.1
SEO-PDP 3.2
Drip_Sneakers_SEO-PDP_V4.4_STANDARD.md（无后缀的历史版本）
standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
  （曾于 2026-09-18 被 Decision #001/#002/#007 认定为活动标准，
    于 2026-09-19 被 Decision #008 取代，现仅保留历史价值）
```

> 版本更替的教训：本知识层 v1.0 的第一版就**把已过期的标准当成活动标准**（引用了 `_CLEAN_CONSOLIDATED` 与 `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8`），原因是本地副本未 fetch 远端。任何 Agent 引用标准前必须先确认远端最新状态，不能依赖本地已有引用。

## 5. Definition of Done（本知识层的验收口径）

```text
[ ] core/ 、knowledge/brands/ 、knowledge/categories/ 、cases/ 、registry.md 全部存在
[ ] Prada 经验已抽取（含已上线成功案例，带 ProductID）
[ ] T-Shirts 经验已抽取（含真实失败形态与真实完成度）
[ ] HOLD 机制已文档化（触发条件可枚举）
[ ] Evidence 体系已文档化（字段名与 Tier 分级）
[ ] 新 Agent 能回答 registry.md 中的 5 个可用性问答
[ ] 所有占位品牌/类目已标注 PLACEHOLDER，无推测内容
[ ] 未向 main 合入任何内容；未产出任何商品 PDP
[ ] front-matter 的标准路径与哈希指向**当前活动标准**（`..._STANDARD_FINAL.md` / `965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7`）
```

## 6. 重要事实披露（不得被后续 Agent 掩盖）

1. 远端仓库 `Kevin-hr/drip-seo-agent`（private，默认分支 `main`）在 2026-09-19 实测有 **5 条分支**，经验分散在 4 条互不包含的分支上：
   `main` = `ee0ef7f`；`codex/upgrade-seo-pdp-v4.4-final` = `b2505b2`（main + 4）；`codex/hellstar-hoodies-seo-pdp-3.2` = `c581909`（main + 1）；`codex/drip-seo-agent-work-2026-09-19` = `645638b`（main + 1）；`feature/v5-llm-evidence-layer` = `2981f86`（main + 1）。`develop` **不存在**。
2. 任务书里写的当前分支 `codex/upgrade-seo-pdp-v4.4-final` **是存在的**。本知识层 v1.0 的第一版曾错误地报告它"不存在"，原因是本地副本只 fetch 过 `codex/hellstar-hoodies-seo-pdp-3.2`，从未 fetch `main` 与其余分支。该错误已在本版更正。
3. `drip-seo-agent` 的真实 git 仓库位于 `.codex-worktrees/drip-seo-agent-hellstar-v44`，远端为 `git@github.com:Kevin-hr/drip-seo-agent.git`；工作区根目录下的 `drip-seo-agent/` 是一份**没有 .git 的副本**。
4. **Agent Contract 的哈希存疑**：`STATUS.md`（b2505b2）第 31 行仍写 `Agent Contract V2.0 | Pinned — 2bdeb72f2ca1edb1691141005bb413248eedbd8eecf078ada60d4e747551a1da`，但同一提交 `b2505b2` 修改了 `standards/agent/AGENT_CONTRACT_V2.0.md`，该文件 LF 归一后的实测哈希为 `bfec9800151c96f039dd8cced7a038b2ae5e46a509dd425f4b9321e42a7bc7ac`（非覆盖于 .gitattributes，工作区为 CRLF，原始字节哈希 `6b97a78b361f6e372d5997814765fb0ce4cb6db95369bb3075281c36b36ec9bb`）。**三处不一致，未归一，需人工确认**：是 pin 过期，还是文件误改。
5. 网络限制（实测）：本机 `git` 走 HTTPS 访问 github.com 会被重置（`Connection was reset` / `Empty reply from server`），但 **SSH 可用**（`ssh -T git@github.com` 认证成功），`gh api` 亦可正常使用。因此本仓库的拉取/推送应走 SSH。
