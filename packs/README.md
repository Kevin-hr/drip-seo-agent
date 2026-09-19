---
id: packs.readme
kind: index
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
---

# Brand Packs

一个 pack 是**某个品牌的专属知识**，它挂在 Core 上工作，而不是替代 Core。

```text
seo-core/         决策系统（跨品牌，只此一份）
packs/<brand>/    品牌知识（可增可减，各自独立）
```

## Core 与 Pack 的边界（不可让渡）

| 归属 | 内容 |
|---|---|
| **Core 决定** | 身份判定逻辑、SKU 裁决逻辑、证据闸门、HOLD 原因码、生成模板与门禁 |
| **Pack 提供** | 命名公式、配色噪声词、官方货号形态、分类要求、本品牌的失败形态、已知冲突 |
| **Pack 不能做** | 放宽 Core 的权限、新增未登记的 HOLD 原因码、跳过回读、改写模板 |

```text
RULE-ID: PACK-01
IF 一个 pack 试图扩大 Core 允许的 sku_type 集合
THEN 该 run 立即 HOLD，原因码 PACK-WIDENS-PERMISSION
OUTPUT HOLD

RULE-ID: PACK-02
IF 一个 pack 试图缩小 Core 允许的集合
THEN 允许，但必须在 pack.json 里写 narrowing_rationale 与 revisit_when
OUTPUT PASS
```

理由：品牌知识只能让系统**更保守**，不能让它更宽松。否则每加一个品牌，就是一次权限扩张。

## pack.json 的必备字段

```text
pack_id / pack_version / brand / core_required
standard { file, sha256 }
evidence_status            VERIFIED_CASE_AVAILABLE | PARTIAL | NO_EVIDENCE
ready_for_production       boolean + ready_blockers[]
naming                     命名公式与噪声词
sku                        accepted_source_types / rejected_source_types / 真实样例
categories                 分类要求
failure_taxonomy           "症状 → 判定 → 原因码"（本品牌的真实字符串）
verified_success           可证实的成功案例，含 claim_boundary
blocked                    已确证的阻塞事实
provenance                 证据出处
```

```text
RULE-ID: PACK-03
IF pack.json 缺少 verified_success 或 blocked
THEN 该 pack 不完整（只报成功或只报失败的 pack 都不可信）
OUTPUT HOLD
```

## 一个 pack 是否可用，看三件事

```text
1  evidence_status 是否诚实（没有素材就写 NO_EVIDENCE，不许推测填充）
2  ready_for_production 是否为 true；为 false 时必须列出 ready_blockers
3  是否附带自己的测试集，并且能被 Core 的引擎跑通
```

## 现有 pack

| pack | evidence_status | ready_for_production | 说明 |
|---|---|---|---|
| `prada` | VERIFIED_CASE_AVAILABLE | **false** | 素材最完整，但 78 款 run 实际上传 0/78，仍需迁移 |
| `nike` | 未建 | — | 106 款 V4.4 成功记录目前只在工作区、不在任何分支 |
| `dior` | 未建 | — | 42 款 v3.2 产物，无线上验证 |
| `moncler` | 未建 | — | 无任何素材 |
