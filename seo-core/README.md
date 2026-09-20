---
id: seo-core.readme
kind: index
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
name: "SEO PDP Intelligence Core v1"
branch: feature/seo-pdp-intelligence-core-v1
base: b2505b2
standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
created: 2026-09-20
---

# SEO PDP Intelligence Core v1

这不是文档库。这是一个**决策系统**：把已经发生过的成功与失败，压缩成五个可执行判断。

```text
供应商给的东西
      │
      ▼
01 Product Identity   ──  它到底是什么？
      │
      ▼
02 SKU Verification   ──  这个货号是谁的？
      │
      ▼
03 Evidence Engine    ──  证据在哪，谁能复核？
      │
      ▼
04 HOLD Decision      ──  现在该不该停？      ← 系统最重要的护栏
      │
      ▼
05 PDP Generation     ──  只有 PASS 之后才生成
      │
      ▼
   MCP / MrShopPlus   ──  在 Core 之后，不在之前
```

## 核心文件（只有 5 个）

| # | 文件 | 回答的问题 |
|---|---|---|
| 01 | `01-product-identity.md` | 供应商给的是什么？ |
| 02 | `02-sku-verification.md` | 这个货号是官方的，还是我们自己编的？ |
| 03 | `03-evidence-engine.md` | 每条结论的证据在哪，谁能复核？ |
| 04 | `04-hold-decision.md` | 现在该不该停？停了之后做什么？ |
| 05 | `05-pdp-generation.md` | 只有 PASS 之后才生成什么、按什么顺序生成 |

## 测试集（Step 3）

```text
tests/test-cases-v1.json     10 个案例，机器可读
tests/run-core-tests.mjs     参考实现 + 断言（93 项检查）
tests/README.md              如何运行、如何新增案例
```

```bash
node seo-core/tests/run-core-tests.mjs
```

任何 Agent（ChatGPT / Trae / Claude / Qwen / MCP agent）在接触商品之前，
都必须先让这套测试全绿。

## 三条不可让渡的原则

```text
1  Accuracy > Completion Rate
2  HOLD 是合格结果，不是失败
3  PASS 由代码判定，不由 LLM 的文字判定
```

## 数据来源（能力 merge，不是代码 merge）

本 Core 从三个方向抽取能力，**没有合并任何分支**：

| 来源 | 贡献的能力 |
|---|---|
| `codex/upgrade-seo-pdp-v4.4-final` (`b2505b2`) | 活动标准 + `.gitattributes` LF 锁定 + T-Shirts V3 经验与可复验基线 + 回归脚本 |
| `codex/drip-seo-agent-work-2026-09-19` (`645638b`) | Prada 批量控制项与"拒绝 ≠ 缺失"等失败行为（02 与 03 的主要来源） |
| `feature/v5-llm-evidence-layer` (`2981f86`) | "PASS 由代码判定"与证据层分层（03 的设计来源） |

## 一个必须由人裁决的问题

`02-sku-verification.md` §5 记录了一个**尚未裁决的设计冲突**：

```text
v44_standard（默认）          实体 PASS + 无官方码 → SKU_OMIT（可发布）
strict_require_verified      实体 PASS + 无官方码 → HOLD

差异后果：Air Jordan 1 / 106 款中，只有 7 款有官方货号。
  v44_standard           → 101 款上架
  strict_require_verified→ 94 个额外 HOLD
```

默认取标准（有 Decision #008 背书），严格模式作为可切换开关存在。
`tests/test-cases-v1.json` 的 TC-002 对两种 policy **同时断言**，
所以这个开关不会在无人察觉的情况下漂移。

## 结构位置

```text
main (ee0ef7f)
  └── develop (b2505b2)
        └── feature/seo-pdp-intelligence-core-v1   ← 本分支
              ├── seo-core/01..05 + tests/
              │
              └── 未来：
                  feature/prada-pack
                  feature/nike-pack
                  feature/dior-pack
                  feature/mcp-execution
```

MCP 排在 Core **之后**。顺序反了就会变成"先自动上传，再发现错了"。
