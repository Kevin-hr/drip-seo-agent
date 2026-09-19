---
id: seo-core.04-hold-decision
capability: hold-decision
stage: 4
order: 4
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
answers: "现在该不该停？停了之后做什么？"
role: "整个系统最重要的护栏（the single most important guardrail）"
input_contract:
  identity_status: PASS | HOLD | VERIFY
  sku_verdict: VERIFIED_SKU | SKU_OMIT | HOLD
  evidence_status: PASS | HOLD
  verification_chain: object
output_contract:
  final_status: PASS | HOLD | BLOCKED | ROLLBACK | SNAPSHOT_INCOMPLETE
  hold_reason_class: 1 | 2 | 3 | 4 | null
  hold_codes: string[]
  action_permission: ALLOW_SEO_UPDATE | FORBID_UPDATE
  required_evidence: string[]
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - docs/case-studies/PRADA_BATCH_LEARNINGS.md（Failure behaviour 列）
  - standards/agent/AGENT_CONTRACT_V2.0.md §3/§4/§7/§14
  - 工作区 BLOCKED.md（Air Jordan 1 / 106 款：4 HOLD + 1 BLOCKED 的真实判例）
test_cases: [TC-003, TC-004, TC-005, TC-006, TC-007, TC-008, TC-010]
---

# 04 · HOLD Decision Engine

## 0. 这个能力的存在意义

前面三个能力都可能"发现不确定"。**不确定不应该流向生成，应该流向停止。**

```text
一般系统的默认行为：  不确定 → 猜一个 → 继续 → 出错 → 事后补救
本系统的强制行为：    不确定 → HOLD  → 停止 → 要人补证 → 再继续
```

Prada 批量学习把它写成了控制项表的一列（`PRADA_BATCH_LEARNINGS.md`）：

| Control | Failure behaviour |
|---|---|
| Exact entity | `HOLD` |
| SKU | Reject internal/supplier IDs |
| Visual evidence | Do not infer official colourway |
| Reconciliation | Do not create on title alone |
| Category mapping | Fail verification |
| Canary | Do not start bulk batch |

```text
RULE-ID: HLD-00
IF 任一上游能力返回 HOLD / VERIFY / 非 PASS
THEN 立即停止该商品，禁止调用 05-pdp-generation
OUTPUT HOLD
```

---

## 1. HOLD 是成功结果，不是失败

```text
Accuracy > Completion Rate
HOLD is a successful outcome when evidence is insufficient.
```

这条不是安慰性表述，它有**可验证的判例**支撑：

```text
Air Jordan 1 / 106 款 V4.4 run
  PUBLISHED 101  /  HOLD 4  /  BLOCKED 1
  → 同一批次里既有 101 个成功，也有 4 个 HOLD。
    说明 HOLD 不是能力不足，而是规则生效。
```

```text
RULE-ID: HLD-01
IF 某批次 HOLD 数为 0 且商品数 > 20
THEN 应复核该批次是否真的执行了身份核验（零 HOLD 在大批量下更可能是漏检而非质量高）
OUTPUT VERIFY
```

---

## 2. 四类允许的停止原因（只有这四类）

```text
1  确证重复商品
2  无法确认 Exact Entity
3  关键证据冲突
4  后台 / 环境技术故障
```

```text
RULE-ID: HLD-02
IF 停止原因不属于上述四类
THEN 不得使用 HOLD / BLOCKED 记录，必须重新归因
OUTPUT VERIFY
```

---

## 3. final_status 五值的分工（禁止混用）

| final_status | 含义 | 责任归属 | 后续动作 |
|---|---|---|---|
| `HOLD` | 证据不足或冲突，**商品本身没问题** | 取证环节 | 补证后可重跑 |
| `BLOCKED` | 环境/后台技术故障，**与身份无关** | 环境环节 | 修环境后续跑 |
| `ROLLBACK` | 已写入但验证失败 | 写路径 | 恢复原状态并如实记录 |
| `SNAPSHOT_INCOMPLETE` | 快照四要素缺失 | 采集环节 | 补齐快照后重跑 |
| `PASS` | 全链路通过 | — | 允许进入 05 |

```text
RULE-ID: HLD-03
IF 把技术故障记为 HOLD
THEN 归因错误（会导致补证方向错误）
OUTPUT HOLD

RULE-ID: HLD-04
IF 把证据不足记为 BLOCKED
THEN 归因错误（会导致等环境修复而不是补证据）
OUTPUT HOLD
```

---

## 4. HOLD 原因码（machine-readable，禁止自由文本）

```text
身份类
  ID-BRAND-UNVERIFIED      品牌无法核实
  ID-NAME-UNMATCHED        官方商品名无法对齐
  ID-COLORWAY-UNVERIFIED   配色无 Tier 1-4 证据
  ID-COLLECTION-UNKNOWN    联名 / Collection 不可核实
  ID-MULTI-CANDIDATE       多个可能实体无法排除
  ID-FIELD-MISSING         brand/model/product_type/colorway 有空值

SKU 类
  SKU-TYPE-REJECTED        来源类型不在 accepted 清单
  SKU-STRUCT-REJECTED      命中占位符或结构拒绝
  SKU-CONFLICT             同一码附着到两个实体
  SKU-POLICY-STRICT        strict_require_verified 模式下缺官方码

证据类
  EVD-EMPTY                证据数组为空
  EVD-LOW-CONFIDENCE       confidence = low
  EVD-GAPS-PRESENT         status=PASS 但 gaps 非空
  EVD-REJECTED-AS-MISSING  把拒绝记录成缺失

重复类
  DUP-SAME-SLUG            生成 slug 与另一商品完全相同
  DUP-VERIFY               重复状态为 VERIFY

环境类
  ENV-SESSION-EXPIRED      后台会话失效
  ENV-BROWSER-TIMEOUT      浏览器保活超时 / 批次中断
  ENV-SAVE-NO-RESPONSE     保存无 DTO 响应
  ENV-SNAPSHOT-INCOMPLETE  快照四要素缺失

写路径类
  WR-PLAN-NOT-VALIDATED    plan 未通过 validation
  WR-STANDARD-HASH-CHANGED 标准哈希在 prepare 后发生变化
  WR-STALE-SNAPSHOT        snapshot_hash 已过期
  WR-STOREFRONT-FAILED     前台验证失败
```

```text
RULE-ID: HLD-05
IF hold_codes 为空但 final_status 不是 PASS
THEN 结构非法
OUTPUT HOLD

RULE-ID: HLD-06
IF hold_codes 使用了自由文本（不在上述枚举内）
THEN 该记录不可被机器消费
OUTPUT HOLD
```

---

## 5. 重试上限（防止用重试掩盖问题）

```text
RULE-ID: HLD-07
IF 同一验收项连续失败 3 次
THEN 换下一个候选 / 下一个商品，不继续盲试
OUTPUT HOLD

RULE-ID: HLD-08
IF 图片上传单张失败
THEN 最多重试 3 次
OUTPUT HOLD

RULE-ID: HLD-09
IF 保存返回超时或响应不确定
THEN 先读取 plan / run / 后台状态再决定是否重试
     禁止直接重新提交（会产生重复写入）
OUTPUT VERIFY
```

真实判例：AJ1 ordinal 102 连续 2 次保存无响应 → 停止该商品、保持未修改，而不是盲点第三次。

---

## 6. HOLD 之后允许与禁止

```text
允许:
  REQUEST_EVIDENCE          列出需要哪一条具体证据
  记录 conflicts[] / hold_codes[]
  切换到下一个可独立完成的商品
  保持商品"未修改"状态的证明

禁止:
  生成任何 SEO 字段
  创建 plan
  调用 execute
  写后台任何字段
  上架
  把商品标记为"已完成"
  用占位符填满空缺以便继续
```

```text
RULE-ID: HLD-10
IF 在 HOLD 状态下产生了任何 SEO 产物
THEN 该产物非法，必须作废
OUTPUT ROLLBACK
```

---

## 7. 动作权限

```text
final_status = PASS  → ALLOW_SEO_UPDATE
final_status != PASS → FORBID_UPDATE

FORBID_UPDATE 时唯一允许的输出是 required_evidence
```

输出形状（禁止长篇解释）：

```text
## Decision
PASS | HOLD | BLOCKED | ROLLBACK | SNAPSHOT_INCOMPLETE

## Evidence
Confirmed:   -
Unconfirmed: -
Conflict:    -

## Action Permission
PASS → ALLOW_SEO_UPDATE
其他 → FORBID_UPDATE

## Required to unblock
1. 需要哪一条具体证据（Tier 级别 + 字段）
2. 需要确认哪个字段
```

---

## 8. 与下一阶段的接口

```text
final_status = PASS → 进入 05-pdp-generation
其他               → 流程终止，产出 HOLD 报告（outputs 必须为 null）
```

```text
RULE-ID: HLD-11
IF final_status != PASS 但仍产出了 SEO 字段
THEN 违反生成门禁（GEN-00），产物必须作废
OUTPUT ROLLBACK
```

`sku_verdict` 在 HOLD / ROLLBACK 时报告的是**第 2 阶段自身的判定**，不是最终状态。

```text
为什么这样设计：
  TC-009 里 SKU 本身是 VERIFIED_SKU，问题出在证据记录上。
  如果一律报 HOLD，人就不知道"货号是对的，要补的是当前来源"，
  会去重新找货号 —— 补错方向。
```

参考实现：`tests/run-core-tests.mjs` 中 `stageHoldDecision()`。
