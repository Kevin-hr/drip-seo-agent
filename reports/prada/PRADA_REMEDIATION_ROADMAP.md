---
id: reports.prada.phase5-remediation-roadmap
kind: governance-report
phase: 5
task: 3
version: 1.0.0
status: ACTIVE
generated: 2026-09-20
branch: feature/prada-phase5-review
ordering: dependency-first
no_writes_performed: true
---

# Prada Remediation Roadmap

> 本文按**依赖关系**排序，不按重要性排序。
> 每项给出：Item / Reason / Owner / Validation。
> 未满足的依赖项会使后续项失效，因此顺序不可打乱。

## 0. Owner 定义

```text
HUMAN   需要人的决策、凭据或授权（登录、归属判断、写入许可）
AGENT   可由 Agent 在无后台权限条件下完成（只读分析、方案、文档、核验读取）
INFRA   需要改动本仓库的代码或工具（读取器实现、配置修正、防护加固）
```

```text
RULE-ID: P5-RM01
IF 某项的 Owner 为 HUMAN
THEN 不得由 Agent 代为执行或推断其结论
OUTPUT HOLD
```

## 1. 依赖总览

```text
Phase 0  ──┬──> Phase 1 (Evidence Closure)
           ├──> Phase 2 (SKU Closure)
           └──> Phase 3 (URL Preparation)
                      │
                      └──> Phase 4 (Canary Write Preparation) ──> 等待人工授权

依赖要点：
  0.1（归属授权）阻塞 1.1，但**不阻塞** 2.x / 3.x
  0.2 与 0.3（登录打通）阻塞 0.4、3.3、以及全部 Phase 4
  0.5（新鲜快照闸门）是 Phase 4 的硬前置
  Phase 2 与 Phase 3 可并行；两者都不需要后台凭据
```

---

# Phase 0

Before any write —— 以下是任何写入动作的绝对前置条件。

```text
Item:       0.1  证据归属授权决策
Reason:     B1。证据含品牌方商品图与公开站整站抓取，纳入仓库的归属依据在仓库内
            无任何记录 → UNKNOWN。这是决策，不是技术问题，Agent 无权判定。
Owner:      HUMAN
Validation: 形成书面决定并落盘，二选一并记录理由：
              (a) 批准纳入 → 执行 1.1
              (b) 不批准   → 执行 1.2（可复现产物替代路径）
            判据：决定文件存在，且 evidence-availability-report §10 的对应项被勾选。
```

```text
Item:       0.2  修正 DripOps Chrome profile 路径
Reason:    PRE_WRITE_REVIEW_GATE 的 configuration finding：
            dripops/config/dripops.json 的 chromeProfileDirectory = "data/chrome-profile"
            解析为 drip-seo-agent/data/chrome-profile —— 该路径不存在。
            任何从本仓库发起的实盘运行都会启动一个全新的、未登录的 Chrome。
            真正带登录态的是 dripsneakers/dripops/dist/ 下的 profile。
Owner:      INFRA
Validation: 配置指向真实存在的已登录 profile；启动后浏览器落在
            mrshopplus 已登录页面而非 /#/login。
```

```text
Item:       0.3  恢复 MrShopPlus 会话并打通实盘读取
Reason:    B7。live_read 当前返回 502，available=false，
            cause = "Mrshopplus login is required in the dedicated DripOps Chrome profile"。
            该项不解决，B6（新鲜快照）与 Phase 4 全部无法开始。
Owner:      HUMAN（登录） + INFRA（验证读取链路）
Validation: POST /api/chatgpt-mcp/products/read { "live": true } 返回 200 且带 snapshot；
            read_product_list 成功（当前为 failed：读取大表超时）。
            判据必须包含"读取大表"这一条 —— 它此前是单点失败点。
```

```text
Item:       0.4  补齐 price / inventory / collections 三个读取器
Reason:    B7。回滚基线 70/100，阈值 90，gate_g1_pass=false。
            缺口 30 权重不是算法问题，而是三个分类记为 "NO READER"：
              price(10) + inventory(10) + collections(10)
            没有完整基线，"写错了能回滚"不成立。
Owner:      INFRA
Validation: baseline.score >= 90 且 gate_g1_pass = true；
            三个分类的 captured 字段由 false 变为 true，source 不再是 "NO READER"。
```

```text
Item:       0.5  执行前新鲜快照闸门（写入前 24 小时内必须重采）
Reason:    B6。全部状态数据冻结于 2026-09-02，已证实存在时效性后果
            （536027476120336 的 URL 在两个时点不一致）。
            在 18 天前的数据上写入等于在未知当前状态下写入。
Owner:      AGENT（执行重采） + HUMAN（确认闸门被遵守）
Validation: 存在一份写入前生成的快照，含生成时间戳与哈希，且 age <= 24h；
            任何写入请求都必须携带该快照的哈希，过期即拒绝。
            （本仓库已有 n10-fresh-snapshot / n10-stale-snapshot 的先例可复用）
```

---

# Phase 1

Evidence Closure

```text
Item:       1.1  证据入库（仅当 0.1 判定为"批准"）
Reason:    B1。36 个文件 / 7,518,279 bytes 仅存在于工作区。
            载体整体丢失则本 Pack 不可复核、不可重建、不可审计。
Owner:      HUMAN（授权） + INFRA（执行入库）
Validation: git ls-files 中可检索到这 36 个路径；
            verify-evidence-manifest.mjs 仍报 VERIFIED 36 / LOST 0 / CHANGED 0；
            入库前后 sha256 与 evidence-manifest.json 逐项一致。
```

```text
Item:       1.2  可复现产物替代路径（仅当 0.1 判定为"不批准"）
Reason:    同上。不能用"授权未定"当作什么都不做的理由：
            若证据不能入库，就必须让它可被重新生成并校验。
Owner:      INFRA
Validation: 每个证据来源都有一条可执行的重建命令；
            重建产物与 evidence-manifest.json 的 sha256 一致（或显式记录不可复现项）。
            raw_products.json 属"时点抓取"，不可复现 → 必须显式标注为不可复现资产。
```

```text
Item:       1.3  把 Prada 专属回归测试补回本仓库
Reason:    本分支 tests/ 下 0 个 Prada 专属测试；
            唯一的 Prada 回归（tests/prada-case-regression.mjs）在 645638b，本分支不可见。
Owner:      AGENT
Validation: 该文件出现在本仓库并被纳入测试执行；
            运行通过；且不依赖任何后台访问。
```

```text
Item:       1.4  处置空遗留 run 与 check-prada.js
Reason:    audit/2026-09-02T14-30-09+08-00-prada-78/ 仅含一个空 evidence/ 子目录，
            会被误读为"有两个 run"；check-prada.js 为 0 字节，会被误读为校验器。
Owner:      INFRA
Validation: 形成处置记录（删除 / 标注），且报告中禁止引用这两者；
            证据清单继续显式标记 check-prada.js 为 0 字节。
```

```text
Item:       1.5  把 Phase 3 新发现补进 pack.json
Reason:    pack 的 blocked 列表早于 Phase 3；缺两类已证实缺陷：
              (a) 8 个存量页 Product Details 为 6 标签且无 Brand 内联
              (b) 9/9 存量页 meta 含 V4.4 禁用短语（8 页为 "7–20 day delivery"）
Owner:      AGENT
Validation: pack.json 仍通过 pack 结构校验；packs/prada 一致性测试仍 PASS。
```

---

# Phase 2

SKU Closure

> 本阶段不需要后台凭据，可与 Phase 3 并行。
> 全程遵守 Rule 2：三要素齐备才可 VERIFIED_SKU，否则 SKU_OMIT。禁止猜。

```text
Item:       2.1  12 项 Tier 1–4 逐项核验（按 REVIEW-2 §2.5 的优先级）
Reason:    B2。12 项的 identity.source 只有本店 URL 或本地文件夹名两种形态；
            manifest 中 prada.com / stockx / goat.com 等品牌与零售商域名出现 0 次。
            没有一条来自品牌方或授权零售商，因此 0 项可判 VERIFIED_SKU。
Owner:      AGENT
Validation: 每项产出一条证据记录，含：来源层级(1–4) / URL / exact_entity_match /
            与实体绑定的 SKU 字符串。未取得 Tier 1–4 确认者一律落 SKU_OMIT。
            判据：不存在"看起来对"但无来源层级的条目。
```

```text
Item:       2.2  5 项形态不一致项回源重读
Reason:    这些项在冻结证据中无法互相重建，属于最高风险：
              1E819L 3KR F0002   ← 文件夹名为粘连且版本段不同 (1E819LF0503KR2)
              1D246M 055 F0002   ← 配色段不同 (055 vs JHR)，且 FO002 存在 O/0 混淆
              1T255M 3LFR F0002  ← 文件夹名粘连 (1T255M3LFRF0)，版本段 F0002 vs F0
              2DB205 055 F0002   ← 文件夹名多尾部悬空 F
              2EG479 D7C F0008 F G001 ← 本店 URL 中形态被粘连并重排
Owner:      AGENT
Validation: 逐字符比对记录（含 O 与 0 的显式判读）；
            无法消歧者维持 SKU_OMIT 并在冲突记录中留存。
```

```text
Item:       2.3  66 项内部码落 SKU_OMIT 并验证下游无 SKU 痕迹
Reason:    B2。66 项 identity.sku_type = internal_catalog，全部匹配 ^DS-PRA-\d{3}$。
            按 V4.4 属 Internal ID，不得对外。
Owner:      AGENT
Validation: Core 在 SKU_OMIT 下的生成器一致性断言全部通过：
              h1 = product_name、恰好 1 个 <h2>Product Details</h2>、恰好 5 个 <li>、
              data-standard="4.4"、canonical = origin+slug、schema 完全省略 sku 键、
              SEO Title 无 SKU、meta 无 SKU 括号。
            本仓库已有覆盖：Core TC-002 / TC-005 / TC-006（三者均为 PASS + SKU_OMIT，
            均触发生成器断言）。
            ⚠ Phase 5 自查发现的覆盖缺口：Pack 运行器
            （packs/prada/tests/run-prada-pack-tests.mjs）目前只断言
            final_status / sku_verdict / hold_codes / action_permission 与 sku_rejections，
            未包含上述生成器断言。建议在本项一并补齐，使 PC-002 / PC-003 / PC-004
            也在 SKU_OMIT 下验证下游无 SKU 痕迹。
```

```text
Item:       2.4  SKU 状态闭合声明
Reason:    闭合必须可判定，否则 B2 永远无法关闭。
Owner:      AGENT
Validation: NEEDS_VERIFICATION = 0，且 VERIFIED_SKU + SKU_OMIT = 78；
            报告必须同时给出三个数字（Core 规则 SKU-MIG-06）。
```

---

# Phase 3

URL Migration Preparation

```text
Item:       3.1  9 个 KEEP URL 的保留约束成文
Reason:    B4。9 项已发布页 URL 判定 KEEP；它们同时都需要 REBUILD PDP（B3）。
            "既要重建内容、又要一字不改 URL"是本品牌最易出事的交叉点，
            且仓库级 P0-1（URL 静默改名，Unmitigated）恰好命中该场景。
Owner:      AGENT
Validation: 每个重建方案首页显式声明 "URL unchanged"；
            并给出保护措施（改名即阻断 / 可回滚）。
```

```text
Item:       3.2  5 项 MIGRATE 的单跳 301 方案
Reason:    B4。5 项 URL 路径以连字符开头，无法承接索引流量。
Owner:      AGENT（出方案） 
Validation: 每项给出 old → 301 → final 三元组；
            最终 URL 200；无重定向链；canonical / Schema / sitemap / 内链同步。
            语义漂移项须以目标标题为准（例：Cloudbust 旧名含 Silver-Black，
            目标标题为 Black Grey White）。
```

```text
Item:       3.3  536027476120336 的当前 URL 实时读数
Reason:    B4 + B6。manifest（2026-09-02）为 /-Prada-Off-White-Gray，
            而 2026-09-15 公开站观测已是 /Prada-Americas-Cup-...-Grey-White。
            按冻结值执行会对一个已正确的 URL 做二次改动 —— P0-1 的触发场景。
Owner:      HUMAN（读取需登录）
Validation: 记录当前真实 URL 与读取时间；
            若已是 Grey-White 形态 → 改判 KEEP，不迁移；
            若仍为 -Prada-Off-White-Gray → 纳入 3.2 的迁移集合。
```

```text
Item:       3.4  P0-1（静默改名）缓解
Reason:    仓库级 P0-1 标记 Unmitigated，且 Prada 的 9 个 KEEP URL 全部是已发布页。
            这是全项目唯一一个"改动即可能造成不可逆索引损失"的风险。
Owner:      INFRA
Validation: 存在一种机制，能在 URL 被改动时阻断提交或提供单跳回滚；
            并以一个已发布 KEEP 页面做只读演练（不改动线上）。
```

---

# Phase 4

Canary Write Preparation

```text
Item:       4.1  选定 canary 商品
Reason:    需要一个受控样本验证写入链路，同时把风险面缩到最小。
Owner:      AGENT（提名） + HUMAN（确认）
Validation: 优先选择未发布项（避免触及已发布 KEEP URL）；
            选定结果记录理由。建议候选范围：5 个 unpublished 中 URL 已破损者。
```

```text
Item:       4.2  canary plan 生成 + 字段级人工复核
Reason:    plan 必须先通过校验并由人逐字段确认，再谈执行。
Owner:      AGENT（生成） + HUMAN（复核）
Validation: plan validation_status = PASS；
            人工逐字段签字（product_name / seo_title / keywords=5 /
            meta / slug / key_description 的 <li>=5 与 Brand 内联 / schema / image_alt）。
```

```text
Item:       4.3  canary 执行 + 三段回读
Reason:    生成 ≠ 写入 ≠ 完成。B5 说明本 Pack 从未有过真实写入。
Owner:      HUMAN（触发执行）
Validation: execute 不再返回 SIMULATED；
            save_readback / publish_readback / storefront 三段全部 PASS；
            任一段失败 → 立即 ROLLBACK 并如实记录（不得记为成功）。
```

```text
Item:       4.4  更新 B5 的表述
Reason:    B5 是历史事实记录，不能被"关闭"，只能被补充。
Owner:      AGENT
Validation: B5 从"0/78 且无先例"更新为"历史 0/78；canary 已通过 + canary 标识"，
            且保留原始 0/78 事实不被覆盖。
```

---

## 2. 关键路径

```text
最短可写入路径（严格串行）：
  0.1 归属决策 ──> 0.2 profile 修正 ──> 0.3 登录与读取打通 ──> 0.4 读取器补齐
    ──> 0.5 新鲜快照闸门 ──> 4.1 canary 选定 ──> 4.2 plan 复核
    ──> 4.3 canary 执行与回读

可全程并行、且不需要任何凭据的工作：
  Phase 1（除 1.1）
  Phase 2（2.1 / 2.2 / 2.3 / 2.4）
  Phase 3（3.1 / 3.2 / 3.4）
```

```text
依赖判据：0.3 未完成时，Phase 4 的任何项都无法开始（因为无法读取当前状态）；
          0.4 未完成时，4.3 即使成功也"无法回滚"，因此不允许执行。
```

---

## 3. 本路线图明确不做的事

```text
不上传任何商品
不登录后台做写入
不改 MrShopPlus 任何字段
不 Publish
不改 IsShow
不改 SKU / URL / 图片 / 价格 / 库存 / 分类 / SEO
不合并 production branch
不迁移证据（等 0.1 决策）
```

```text
RULE-ID: P5-RM02
IF 有人以"路线图已存在"为由跳过 Phase 0
THEN 该执行无效
OUTPUT HOLD
```

---

## 4. 进度跟踪表

| 项 | 主题 | Owner | 依赖 | 状态 |
|---|---|---|---|---|
| 0.1 | 证据归属授权决策 | HUMAN | — | 未开始 |
| 0.2 | DripOps profile 路径修正 | INFRA | — | 未开始 |
| 0.3 | MrShopPlus 登录与实盘读取打通 | HUMAN | 0.2 | 未开始 |
| 0.4 | 补齐三个读取器（基线 ≥90） | INFRA | 0.2 | 未开始 |
| 0.5 | 新鲜快照闸门 | AGENT+HUMAN | 0.3 | 未开始 |
| 1.1 | 证据入库 | HUMAN+INFRA | 0.1(a) | 未开始 |
| 1.2 | 可复现产物替代路径 | INFRA | 0.1(b) | 未开始 |
| 1.3 | Prada 回归测试补回 | AGENT | — | 未开始 |
| 1.4 | 空 run 与 0 字节文件处置 | INFRA | — | 未开始 |
| 1.5 | pack.json 补齐 Phase 3 发现 | AGENT | — | 未开始 |
| 2.1 | 12 项 Tier 1–4 核验 | AGENT | — | 未开始 |
| 2.2 | 5 项形态不一致项回源 | AGENT | — | 未开始 |
| 2.3 | 66 项 SKU_OMIT 下游校验 | AGENT | — | 未开始 |
| 2.4 | SKU 状态闭合声明 | AGENT | 2.1,2.3 | 未开始 |
| 3.1 | KEEP URL 保留约束 | AGENT | — | 未开始 |
| 3.2 | 5 项 301 迁移方案 | AGENT | — | 未开始 |
| 3.3 | 536027476120336 实时读数 | HUMAN | 0.3 | 未开始 |
| 3.4 | P0-1 缓解 | INFRA | — | 未开始 |
| 4.1 | canary 选定 | AGENT+HUMAN | 0.3 | 未开始 |
| 4.2 | canary plan 复核 | AGENT+HUMAN | 4.1 | 未开始 |
| 4.3 | canary 执行与回读 | HUMAN | 0.4,0.5,4.2 | 未开始 |
| 4.4 | B5 表述更新 | AGENT | 4.3 | 未开始 |

```text
说明：状态全部为"未开始"。本阶段只产出评审与规划，不产生任何执行结果，
      因此不存在可以标记为"已完成"的项。
```
