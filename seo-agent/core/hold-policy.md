---
id: core.hold-policy
kind: rule-set
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - standards/agent/AGENT_CONTRACT_V2.0.md #3 #4 #7 #10 #14
  - dripops/src/DripOps/Rules/V44/V44SkuGate.cs
  - dripops/src/DripOps/Rules/V44/V44FrontendAuditor.cs
  - mcp-plugin/src/server.ts
  - reports/evidence/workflow-e2e/n4-hold-blocks.json
  - BLOCKED.md (air-jordan-1-106-2026-09-18)
---

# HOLD 策略（core/hold-policy.md）

## 0. 第一原则：HOLD 是成功结果

```text
Accuracy > Completion Rate
HOLD is a successful outcome when evidence is insufficient.
```

HOLD 之后**允许**做的事：

```text
REQUEST_EVIDENCE
记录冲突到 conflicts[]
切换到下一个可独立完成的商品
```

HOLD 之后**禁止**做的事：

```text
生成任何 SEO 字段
创建 plan_id
调用 execute_product_v44
写后台任何字段
上架
把商品状态改成"已完成"
```

---

## 1. HOLD 触发条件（完整清单）

### 1.1 身份类

```text
RULE-ID: HLD-ID-01
IF SKU 无法核验（找不到 Tier 1–4 附着证据）
THEN 先判断可否走 SKU_OMIT；若 SKU 是可识别性关键项（如以 SKU 区分的同款不同配色）
OUTPUT HOLD

RULE-ID: HLD-ID-02
IF 商品名无法与官方来源匹配（只存在供应商标题或通用名）
THEN 停止
OUTPUT HOLD

RULE-ID: HLD-ID-03
IF Colorway 不确定（视觉颜色无法被 Tier 1–4 确认）
THEN 停止
OUTPUT HOLD

RULE-ID: HLD-ID-04
IF 存在多个可能的商品且证据无法排除（Supplier noise、口语命名、联名方不可核实）
THEN 不选"最像的"，停止
OUTPUT HOLD

RULE-ID: HLD-ID-05
IF 存在任一身份关键字段冲突：Color conflict | SKU conflict | Product Type conflict | Collection conflict
THEN 停止
OUTPUT HOLD
```

### 1.2 快照类

```text
RULE-ID: HLD-SNAP-01
IF Product Images | Existing Description | Current SEO Fields | Variants 任一缺失
THEN STOP EXECUTION
OUTPUT SNAPSHOT_INCOMPLETE

RULE-ID: HLD-SNAP-02
IF snapshot_hash 与 plan 中记录的不一致（快照过期）
THEN 拒绝执行
OUTPUT HOLD
```

### 1.3 重复与冲突类

```text
RULE-ID: HLD-DUP-01
IF 两个商品同名同配色且生成 slug 相同（疑似重复商品）
THEN 确认前不写 SEO、不上架
OUTPUT HOLD

RULE-ID: HLD-DUP-02
IF duplicate_status = VERIFY
THEN 需人工/额外证据裁决
OUTPUT HOLD
```

### 1.4 结构与证据类

```text
RULE-ID: HLD-STR-01
IF verdict = HOLD 但 conflicts 为空
THEN 结构非法
OUTPUT HOLD

RULE-ID: HLD-STR-02
IF verdict != HOLD 但 conflicts 非空
THEN 结构非法
OUTPUT HOLD

RULE-ID: HLD-STR-03
IF evidence 为空 或 decision_note 为空
THEN 结构非法（EVID-01 / EVID-02）
OUTPUT HOLD

RULE-ID: HLD-STR-04
IF exact_entity 的 brand / model / product_type / colorway 任一为空
THEN 实体不完整
OUTPUT HOLD
```

### 1.5 配色证据门禁（Colorway Evidence Gate）

```text
RULE-ID: HLD-CLR-01
IF verdict != HOLD 且 exact_entity.colorway 没有任何 tier <= 4 且 exact_entity_match = true 且 colorway 归一化相等的证据
THEN 必须把 verdict 改为 HOLD
OUTPUT HOLD

RULE-ID: HLD-CLR-02
IF visual.base_color_visual 与 exact_entity.colorway 归一化后相同，但无 Tier 1–4 证据
THEN visual-leak，停止
OUTPUT HOLD

RULE-ID: HLD-CLR-03
IF 只有 Tier 5–8 来源给出配色名
THEN 该配色不得进入对外字段
OUTPUT HOLD
```

> Tier 5–8（marketplace、supplier）"never qualifies an official colorway"。

### 1.6 运行环境类（可恢复型 HOLD / BLOCKED）

```text
RULE-ID: HLD-ENV-01
IF 后台会话失效（跳转 /#/login）
THEN 停止本轮，要求人工登录；禁止猜测认证接口、禁止保存密码
OUTPUT HOLD

RULE-ID: HLD-ENV-02
IF 浏览器保活超时导致批次中断（Target page, context or browser has been closed）
THEN 重启后逐条核对后台实际状态，确认哪些未被修改，再续跑；禁止盲目重跑
OUTPUT HOLD

RULE-ID: HLD-ENV-03
IF 保存返回 HTTP 200 但成功 toast 未出现
THEN 以 API 返回 + 后台回读为准，不得直接判失败、不得重复盲点提交
OUTPUT VERIFY

RULE-ID: HLD-ENV-04
IF 保存连续 2 次无任何 DTO 响应（status=null, body 为空）
THEN 停止该商品，标 BLOCKED，保持未修改状态
OUTPUT ROLLBACK
```

---

## 2. HOLD 与 BLOCKED 的区别（不得混用）

| 终态 | 含义 | 允许的后续动作 |
|---|---|---|
| `HOLD` | 证据不足或冲突，**商品本身没问题**，只是无法确证身份 | REQUEST_EVIDENCE；补充证据后可重跑 |
| `BLOCKED` | 环境/后台技术故障，**与身份无关** | 修复环境后续跑；商品保持未修改 |
| `ROLLBACK` | 已写入但前端验证失败 | 恢复该商品原状态并如实记录 |
| `SNAPSHOT_INCOMPLETE` | 快照四要素缺失 | 补齐快照后重跑 |

只有以下四类原因才允许进入 HOLD / BLOCKED：

```text
1. 确证重复商品
2. 无法确认 Exact Entity
3. 关键证据冲突
4. 后台/环境技术故障
```

---

## 3. 同一动作的失败重试上限

```text
RULE-ID: HLD-RETRY-01
IF 同一动作（同一验收项）连续失败 3 次
THEN 换下一个候选 / 下一个商品，不继续盲试
OUTPUT HOLD

RULE-ID: HLD-RETRY-02
IF 图片上传单张失败
THEN 最多重试 3 次
OUTPUT HOLD
```

---

## 4. 真实 HOLD 案例（可作为判定基准）

| ProductID | 原名称 | 终态 | 类型 | 判定依据 |
|---|---|---|---|---|
| 536027112870683 | Air Jordan 1 Retro High OG Bleached Coral | HOLD | Exact Entity 未确认 | 主图（侧面）无 Bleached Coral 特征（白鞋头 + 黑 Swoosh + 灰白鞋身），无法排除实为 White/Black |
| 536027078410004 | liv X Air Jordan 1 High Grey | HOLD | Collection 未确认 | "liv X" 非可核实联名方 |
| 536027078231322 | Air Jordan 1 Low tenis | HOLD | Exact Entity 未确认 | "tenis" 为供应商口语（西语"球鞋"），无配色/联名信息 |
| 536027039236880 | Air Jordan 1 NRG OG High NOT FOR RESALE Varsity Red | HOLD | 疑似重复 + slug 冲突 | 与 536027079115024 同名同配色，slug 完全相同，后台保存被拒 |
| 536027084322835 | Air Jordan 1 High Zoom Air CMFT Black Court Purple Lemon Venom (W) | BLOCKED | 后台保存故障 | 连续 2 次保存无 DTO 响应 |

出处：`BLOCKED.md`（Run ID `air-jordan-1-106-2026-09-18`），合计 HOLD 4 条、BLOCKED 1 条，全部保持"未修改"状态。

对比参照：同一 run 中 101 款通过并上架，说明 HOLD 不是能力不足，而是规则生效。

---

## 5. HOLD 输出形状（Agent 必须按此格式回）

```text
## Decision
HOLD

## Evidence
Confirmed:    <已确证的部分>
Unconfirmed:  <缺失的关键项>
Conflict:     <冲突明细>

## Action Permission
FORBID_UPDATE
REQUEST_EVIDENCE

## Required to unblock
1. <需要哪一条 Tier 1-4 证据>
2. <需要确认哪个字段>
```

禁止把"已确证的部分"写成"已完成"。
