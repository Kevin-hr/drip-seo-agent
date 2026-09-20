---
id: packs.prada.cases
kind: case-record
pack_id: prada
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
evidence_status: VERIFIED_CASE_AVAILABLE
---

# Prada 案例记录

> 本文件只记录**有证据的事**。每个数字都能定位到文件；无法定位的写"无证据"。

---

## 案例 1：唯一可证实的成功单品

```text
Case Name : Prada America's Cup Patent Leather Sneakers Grey White
Product ID: 536027476120336
来源 run  : audit/2026-09-02T14-30-31+08-00-prada-78
```

### 改造前

```text
商品名 : Prada Off-White Gray
URL    : https://www.dripsneakers.org/-Prada-Off-White-Gray   ← 前导连字符、无品牌前缀
状态   : 未发布
```

### 三条独立证据

```text
1 视觉同一性
   公开图 536027476120336-prada-off-white-gray.jpg
   ↔ 本地图 "Prada Americas Cup Patent Grey White\01_main_cover.jpg"
   color_mae = 0     dhash_distance = 0
   → 确认是同一张图，可复用现图，无需重复上传

2 命名
   走 America's Cup 公式，descriptor = Patent Leather Sneakers
   → Prada America's Cup Patent Leather Sneakers Grey White

3 线上现状（2026-09-15 抓取）
   URL: https://www.dripsneakers.org/Prada-Americas-Cup-Patent-Leather-Sneakers-Grey-White
   分类: Prada + Prada America's Cup Sneakers（+ 平台全局 NEW CLOTHING）
   breadcrumb 归属 Prada；三个 Cup 分类商品之一
```

### 这个案例证明什么，不证明什么

```text
证明   : 身份判定、命名公式、分类归属、图源复用 四件事可执行
不证明 : SKU 有效性 —— 记录值是 DS-PRA-010，是内部目录码
不证明 : V4.4 合规 —— 线上观测版本是 3.3，不是 4.4
不证明 : 图片张数 —— manifest 记 expected_image_count = 12，但无线上回读产物
```

```text
RULE-ID: PRADA-CASE-01
IF 有人引用本案例证明"Prada 已合规"
THEN 该声称超出证据范围
OUTPUT HOLD
```

---

## 案例 2：78 款 run 实际执行 0/78

```text
Run ID : 2026-09-02T14-30-31+08-00-prada-78
```

前置工作**做完了**，上传**没做**：

| 项目 | 实测值 | 出处 |
|---|---|---|
| 源文件夹 | 78 | manifest |
| 源图片 | 856 | manifest |
| America's Cup 商品 | 34 | manifest |
| 其余 Prada 商品 | 44 | manifest |
| 精确重复文件夹 | 0 | manifest |
| 清单校验 | valid=true | validation-checks.json |
| **实际上传量** | **0 / 78** | PROGRESS.md（Task 1–4 全 PENDING，Progress 0/78） |
| operations.jsonl 行数 | 8（全部是开工前动作） | operations.jsonl |

```text
operations.jsonl 第 5 行：
  read_product_list = failed
  error: "Chrome extension timed out while reading the large product table"
  未提交任何表单、未修改后台状态。
```

```text
RULE-ID: PRADA-CASE-02
IF 需要报告 Prada 78 的进度
THEN 必须写"盘点/命名/去重/校验完成，上传 0/78"
     禁止写"Prada 78 已完成"
OUTPUT PASS
```

---

## 案例 3：数据不一致（未调和）

```text
2026-09-02 对账 : 10 visible / 9 matched / 69 missing
2026-09-07 清单 : 14 existing / 64 create
```

两组数字**从未在本地文件中调和**。

```text
RULE-ID: PRADA-CASE-03
IF 引用 Prada 的存量/新建数量
THEN 必须同时给出日期与出处文件
OUTPUT VERIFY
```

> 这恰好印证了 Prada 预检案例的结论：库存状态必须在执行前立即重读，
> 绝不能从较早的 manifest 推断。

---

## 案例 4：9 个存量线上 PDP 全部不合格

```text
审计对象 : 9 个公开的 Prada 存量 PDP
pdp_3_0_pass_count   = 0
update_required_count = 9
观测版本 : { 3.3: 8, missing: 1 }
```

出处：`operations.jsonl` 第 7 行 + `evidence/public-prada-seo-pdp-audit.json`。

```text
RULE-ID: PRADA-CASE-04
IF 需要复用任何 Prada 存量页
THEN 视为不可继承，必须按 V4.4 重做
OUTPUT HOLD
```

---

## 案例 5：SKU 的真实构成（本 pack 存在的理由）

```text
internal_sku_count = 66   （DS-PRA-001 … DS-PRA-078，sku_type = internal_catalog）
sourced_sku_count  = 12   （官方/来源货号，多段空格分隔）
```

`identity.status` 的两个取值：

```text
PASS-VISUAL-INTERNAL-SKU    66 个 —— 视觉确认 + 内部目录码
PASS-SOURCE-EVIDENCE        12 个 —— 有来源/现有官方码
```

```text
关键结论：66 个"SKU"是内部码。
按现行 V4.4，"Internal ID" 属被禁止的 SKU 形态。
→ 在本 pack 下全部重判为 SKU_OMIT（或补 Tier 1-4 证据升级）。
```

这是 Core `02-sku-verification` 的起点，也是 `PC-002` 测试用例的原型。

---

## 案例 6：真实的 0 字节文件

```text
check-prada.js  →  0 bytes
```

```text
RULE-ID: PRADA-CASE-05
IF 需要引用 Prada 的校验依据
THEN 不得引用 check-prada.js（它没有任何内容）
     有效校验器是 scripts/validate-prada-seo-pdp-3.cjs
OUTPUT HOLD
```

---

## 证据出处清单

```text
audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json
audit/2026-09-02T14-30-31+08-00-prada-78/identity-audit.json
audit/2026-09-02T14-30-31+08-00-prada-78/validation-checks.json
audit/2026-09-02T14-30-31+08-00-prada-78/operations.jsonl
audit/2026-09-02T14-30-31+08-00-prada-78/{PROGRESS,BLOCKED}.md
scripts/build-prada-78-manifest.cjs
scripts/validate-prada-seo-pdp-3.cjs
shipping-audit/raw_products.json（2026-09-15 抓取）
docs/case-studies/PRADA_78_PREFLIGHT_CASE.md      @ 645638b
docs/case-studies/PRADA_BATCH_LEARNINGS.md        @ 645638b
tests/fixtures/prada/preflight-summary.json       @ 645638b
```

```text
注：raw_products.json 与 audit/ 目录目前只存在于工作区，未纳入任何分支。
    这与 Air Jordan 1 的证据处境相同 —— 属已知的单点风险。
```
