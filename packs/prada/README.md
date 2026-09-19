---
id: packs.prada.readme
kind: knowledge-pack
pack_id: prada
pack_version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
evidence_status: VERIFIED_CASE_AVAILABLE
ready_for_production: false
core_required: feature/seo-pdp-intelligence-core-v1 (>= ce99c80a)
standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
---

# Prada Pack v1.0.0

## 0. 一句话定位

Prada 的价值不在于"做得好"，而在于它是**第一个把失败讲清楚的品牌**：

```text
它证明了 66/78 个"SKU"其实是内部目录码。
```

这条发现直接催生了 Core 的第 2 个能力（`02-sku-verification`），也是本 pack 存在的理由。

---

## 1. 生产就绪状态：**false**

```text
ready_for_production : false
```

四个阻塞项（缺任一项都不允许投产）：

```text
PRADA-RUN-EXECUTED-0-OF-78
  78 款 run 的实际上传量是 0 / 78。
  operations.jsonl 只有 8 行，全部是开工前的盘点 / 鉴权 / 对账 / 校验。

PRADA-SKU-MIGRATION-UNRESOLVED
  66 个 DS-PRA-### 内部码按 V4.4 不得作为对外 SKU。
  必须逐款重判为 VERIFIED_SKU 或 SKU_OMIT。

PRADA-LEGACY-URLS-BROKEN
  5 个未发布商品的 URL 形如 /-Prada-Sneakers-Black-Red（前导连字符、无品牌前缀）。

PRADA-LEGACY-PDP-VERSION-3.3-NOT-V4.4
  9 个线上存量 Prada PDP 的审计结果：pdp_3_0_pass_count = 0，
  观测版本 3.3 x8 与 missing x1。旧页不可继承。
```

```text
RULE-ID: PRADA-READY-01
IF ready_for_production = false
THEN 本 pack 只能用于核验与规划，不得驱动真实写入
OUTPUT HOLD
```

---

## 2. 命名（Core 01 的输入）

### America's Cup 系列（有公式，可自动生成）

```text
{brand} America's Cup {descriptor} {colorway}
descriptor 只允许三种：Patent Leather Sneakers / Soft Rubber Sneakers / Leather Sneakers
```

真实成品：

```text
Prada America's Cup Patent Leather Sneakers Grey White
Prada America's Cup Patent Leather Sneakers Black/Silver
Prada America's Cup Soft Rubber Sneakers Carbon Black
```

### 非 Cup 系列

必须走人工映射表。**规则上不可猜。**

```text
Prada Cloudbust Thunder Sneakers Black Grey White
Prada Collapse Re-Nylon and Suede Sneakers Palisander
Prada Triangle Logo Platform Sneakers White
Prada Trail Suede Sneakers Khaki
```

### 配色噪声词

```text
4E3400 / 4E6500 / 3LLJ / ASZ / 6GW   ← 从**对外配色名**中剥离
```

一个容易搞错的边界：这几串字符**同时**是官方货号的组成段。剥离只作用于对外配色名，不作用于证据链里的货号。

---

## 3. SKU（Core 02 的输入）

### 本 pack 主动缩小了 Core 的权限

```text
Core 允许 : official_brand_code / authorized_retailer_code / stockx_code / goat_code
本 pack 允许: official_brand_code / authorized_retailer_code
```

理由（`pack.json` 的 `narrowing_rationale`）：Prada 的证据基础里**没有任何 Tier 2 / Tier 3 确认**，
接受这两类就等于声称一个本 pack 支撑不了的能力。缩小只会降低 SKU 使用率，永远不会产生错误值。

恢复条件（`revisit_when`）：拿到一条带 exact-entity 证据的 Tier 2 / Tier 3 Prada 确认。

### 官方货号真实样例（12 条，逐字）

```text
4E3400 ASZ F0I89 F G000
4E3400 ASZ F0002 F G000
4E6500 3LLJ F0002 F 025
1D246M 055 F0002
1E819L 3KR F0002
1T255M 3LFR F0002
2DB205 055 F0002
2EG479 D7C F0002 F G001
2EG479 D7C F0BW5 F G001
2EG479 D7C F0008 F G001
2EG479 D7C F0304 F G001
1E959N D7C F0007 F 005
```

### 半成品货号（真实反例，禁止直接使用）

```text
2EG2933                    只有主型号，无配色段
2EG4243                    只有主型号，无配色段
1E819LF0503KR2             段位粘连
1D246M JHR FO002 F         字符混淆（字母 O 与数字 0）
2DB205 055 F0002 F         尾部悬空分隔符
```

处理方式：回到 Tier 1-4 **逐字符**重读；仍无法确定就省略 SKU。

---

## 4. 分类（Core 01/04 的输入）

```text
America's Cup（34 个）→ 必须同时包含 Prada 与 Prada America's Cup Sneakers
其余 44 个            → 必须包含 Prada
平台全局分类 NEW CLOTHING → 可保留，但禁止用它替代目标分类
```

---

## 5. 怎么被 Core 使用

```bash
# Core 自身的一致性测试
node seo-core/tests/run-core-tests.mjs

# 本 pack 的测试（会带上 Core 引擎与 pack 约束）
node packs/prada/tests/run-prada-pack-tests.mjs
```

代码里：

```js
import { runCore } from "../../seo-core/engine.mjs";
import pack from "./pack.json" with { type: "json" };

const result = runCore(input, "v44_standard", pack);
```

`runCore(input, policy, pack)` 的第三个参数就是 pack。它会：
1. 先校验 pack 没有扩大 Core 权限（扩大即 HOLD，原因码 `PACK-WIDENS-PERMISSION`）
2. 用 pack 的 `naming.series` 参与商品名组合
3. 用 pack 的 `accepted_source_types` 收紧 SKU 来源类型

---

## 6. 本 pack 不能做的事（边界）

```text
不能放宽 SKU 规则
不能把 DS-PRA-### 变成合法 SKU
不能替代 Core 的 HOLD 判定
不能驱动真实写入（ready_for_production = false）
不能声称 78 款已完成 —— 它没有
```

## 7. 关联文件

```text
packs/prada/pack.json                    机器可读知识
packs/prada/cases.md                     真实案例与证据链
packs/prada/tests/prada-cases.json       pack 专属测试案例
packs/prada/tests/run-prada-pack-tests.mjs
```
