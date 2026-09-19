---
id: seo-core.03-evidence-engine
capability: evidence-engine
stage: 3
order: 3
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
answers: "这条结论的证据在哪，谁可以复核？"
supersedes_format: reports/evidence/t-shirts-v3/verified-baseline.json（专用格式 → 通用格式）
input_contract:
  identity: object
  sku_resolution: object
  visual_observation: object
output_contract:
  evidence_record: object      # 见 §2 通用格式
  evidence_status: PASS | HOLD
  gaps: string[]
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - reports/evidence/t-shirts-v3/verified-baseline.json（本分支，专用格式样本）
  - tests/tshirts-v3-lessons.mjs（本分支，校验脚本样本）
  - docs/architecture/V5.1_LLM_EVIDENCE_LAYER_PLAN.md（branch feature/v5-llm-evidence-layer）
  - docs/case-studies/PRADA_BATCH_LEARNINGS.md（branch codex/drip-seo-agent-work-2026-09-19）
  - mcp-plugin/src/contracts.ts (EvidenceSchema)
test_cases: [TC-001, TC-002, TC-009, TC-010]
---

# 03 · Evidence Engine

## 0. 为什么要从"专用格式"升级到"通用格式"

现有 `reports/evidence/t-shirts-v3/verified-baseline.json` 是一个**好格式但只服务一个案例**的格式：

```json
{
  "product_id": "536027552860691",
  "source_run": "t-shirts-first-30-2026-09-01",
  "pdp_version": "3.1.1",
  "product_name": "Givenchy Stamp Print T-Shirt White",
  "sku": "BM71NK3YSA-100",
  "sku_verified": true,
  "historical_canonical_url": "https://www.dripsneakers.org/...",
  "stage": "FrontendVerified",
  "release_status": "Verified",
  "validation_is_valid": true,
  "product_state_sha256": "be8ee43e..."
}
```

它的字段（`product_id` / `source_run` / `pdp_version` / `historical_canonical_url`）都是 T-Shirts V3 特有的。Prada 用不了，Dior 用不了，Nike 用不了。

本能力把它抽象成**任何商品、任何品牌、任何标准版本都能填的通用记录**。

```text
RULE-ID: EVD-00
IF 一份证据记录里的字段名包含某个品牌或某次 run 的专有名词
THEN 该格式不可复用，必须映射为通用字段
OUTPUT VERIFY
```

---

## 1. 通用证据记录（canonical record）

```json
{
  "product": "",
  "product_id": "",
  "official_source": "",
  "source_tier": 1,
  "sku": "",
  "sku_verdict": "VERIFIED_SKU",
  "evidence": "",
  "confidence": "high",
  "status": "PASS",
  "standard_version": "4.4",
  "standard_hash": "965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7",
  "observed_at": "",
  "verified_by": "",
  "verification_chain": {
    "save_readback": "PASS",
    "publish_readback": "PASS",
    "storefront": "PASS"
  },
  "gaps": []
}
```

字段定义（禁止改名、禁止省略必填）：

| 字段 | 必填 | 含义 | 约束 |
|---|---|---|---|
| `product` | ✔ | 官方商品名（来自 01 的 PASS 结果） | 非空，不得含供应商措辞 |
| `product_id` | ✔ | 平台商品 ID（仅作定位，不作证据） | 非空 |
| `official_source` | ✔ | 支撑身份的 Tier 1–4 来源 URL | 非空；`status=PASS` 时必须有 |
| `source_tier` | ✔ | 该来源的层级 | 1..8 |
| `sku` | ✔ | 已验证货号，或 `null` | `sku_verdict` 必须与之一致 |
| `sku_verdict` | ✔ | `VERIFIED_SKU` / `SKU_OMIT` | 不得为 `HOLD`（HOLD 不产出记录） |
| `evidence` | ✔ | 一句话说清"这条证据证明了什么" | 非空，不得写"已确认"这类空话 |
| `confidence` | ✔ | `high` / `medium` / `low` | 见 §3 |
| `status` | ✔ | `PASS` / `HOLD` | 由代码判定，不由 LLM 决定 |
| `standard_version` | ✔ | 当时生效的标准版本 | 必须与 `standard_hash` 成对 |
| `standard_hash` | ✔ | 标准文件的完整 sha256 | 写全，禁止截断 |
| `observed_at` | ✔ | 取证时间（ISO8601） | 非空 |
| `verified_by` | ✔ | 取证主体（agent 标识 / 人工） | 非空 |
| `verification_chain` | ✔ | 三段回读结果 | 三段都必须有值 |
| `gaps` | ✔ | 未闭合项 | 无则写 `[]`，不得省略 |

```text
RULE-ID: EVD-01
IF 任一必填字段缺失或为空
THEN 记录非法
OUTPUT HOLD

RULE-ID: EVD-02
IF status = PASS 但 gaps 非空
THEN 非法（有缺口就不叫 PASS）
OUTPUT HOLD

RULE-ID: EVD-03
IF standard_hash 写成截断形式（含省略号）
THEN 非法（截断的哈希不可复核）
OUTPUT HOLD
```

---

## 2. 从旧格式迁移（映射表）

| 旧字段（T-Shirts V3 专用） | 通用字段 | 说明 |
|---|---|---|
| `product_name` | `product` | 直接映射 |
| `product_id` | `product_id` | 直接映射 |
| `historical_canonical_url` | `official_source` | **注意**：历史 URL 是**证据**，不是官方来源；映射后 `confidence` 不得为 `high` |
| `sku` | `sku` | 直接映射；但必须回源复核，历史 SKU 不自动继承 |
| `sku_verified` | `sku_verdict` | `true` → `VERIFIED_SKU`；`false` → `SKU_OMIT` |
| `source_run` | （丢弃） | run 名不是证据 |
| `pdp_version` | （丢弃） | 旧版本号不进入通用格式 |
| `stage` / `release_status` / `validation_is_valid` | `verification_chain` | 三值合并为三段回读 |
| `product_state_sha256` | `evidence` | 作为"该状态快照的哈希"写入证据说明 |

```text
RULE-ID: EVD-04
IF 迁移历史记录时把 historical_canonical_url 当作 official_source
THEN 必须把 confidence 降级为 medium 或以下
     （历史 URL 只能证明"曾经那样"，不能证明"官方如此"）
OUTPUT VERIFY

RULE-ID: EVD-05
IF 迁移历史 SKU 时未重新取证
THEN 不得置为 VERIFIED_SKU
OUTPUT HOLD
```

T-Shirts 文档的原文纪律（`T_SHIRTS_V3_LESSONS_TO_V4.4.md`）：

> Names, SKUs and URLs in this table are historical evidence. They must be re-verified against current images and sources before a V4.4 write.

---

## 3. confidence 判定（可复算，不靠感觉）

```text
high    至少 2 条独立 Tier 1–3 来源，且关键字段逐字一致
medium  1 条 Tier 1–4 来源，无冲突
low     只有 Tier 5–8 证据，或存在已解释但未消除的偏差
```

```text
RULE-ID: EVD-06
IF 关键字段存在分歧但被"取多数"处理
THEN confidence 最高只能 medium
OUTPUT VERIFY

RULE-ID: EVD-07
IF confidence = low
THEN 该记录不得支撑 PASS（除非 gaps 显式列出并已被人工作出裁决）
OUTPUT HOLD
```

---

## 4. PASS 闸门由代码执行，不由 LLM 执行

V5.1 计划的原话（`V5.1_LLM_EVIDENCE_LAYER_PLAN.md`）：

> The PASS decision is evaluated by code (`evaluate_evidence_pass`), never decided inside an LLM response.

本能力据此规定：

```text
RULE-ID: EVD-08
IF "PASS" 这个结论由 LLM 的文字输出直接给出
THEN 该结论无效
OUTPUT HOLD

RULE-ID: EVD-09
IF 需要判定 PASS
THEN 必须调用确定性函数 evaluateEvidencePass(record)
     输入是结构化记录，输出是 PASS 或 HOLD + gaps
OUTPUT PASS
```

参考实现：`tests/run-core-tests.mjs` 中 `evaluateEvidencePass()`。

---

## 5. 批次级证据包（一次 run 交付时必须齐备）

来自 Prada 批量学习（`PRADA_BATCH_LEARNINGS.md` §Minimum evidence for a completed live batch）：

```text
1. 冻结的输入清单 + 源目录清单哈希
2. 逐项的 identity 与 SKU 裁决，附证据引用
3. 每个可执行项的不可变 plan ID
4. 逐项执行结果 + 后台回读
5. 逐项发布后的公开 URL 验证
6. 最终一对一核对 + 重复计数
7. 显式的 blocked 清单（没有也要写"无"）
```

```text
RULE-ID: EVD-10
IF 声称一个批次已完成
THEN 上述 7 项必须齐备，缺一不算完成
OUTPUT HOLD

RULE-ID: EVD-11
IF blocked 清单缺失（哪怕实际为空）
THEN 交付不完整
OUTPUT HOLD
```

---

## 6. 三条记录纪律

```text
纪律一：证据与生成物分开存放。
        文案可以重建，证据必须可审计。

纪律二：失败也是证据。
        Prada 案例原文："The backend product-list read timed out.
        The operation was recorded as failed, and no form submission was claimed."
        → 超时记录为失败，绝不允许记录为成功。

纪律三：拒绝 ≠ 缺失。
        供应商码被拒绝 ≠ 没有 SKU。两者在下游的处置不同（前者要留冲突记录）。
```

```text
RULE-ID: EVD-12
IF 把"被拒绝的候选"记录成"未找到候选"
THEN 证据链失真
OUTPUT HOLD
```

---

## 7. 与下一阶段的接口

```text
evidence_status = PASS → 进入 04-hold-decision（应返回"无 HOLD"）
evidence_status = HOLD → 进入 04-hold-decision（携带 gaps）
```

03 只产出记录，不产出文案。`evidence_status = PASS` 也不意味着可以生成 → 还需 04 放行。
