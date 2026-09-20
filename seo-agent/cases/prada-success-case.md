---
id: cases.prada-success-case
kind: case-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada, category:sneakers]
evidence_status: VERIFIED_CASE_AVAILABLE
evidence_basis:
  - audit/2026-09-02T14-30-31+08-00-prada-78/{manifest.json,identity-audit.json,validation-checks.json,operations.jsonl,PROGRESS.md,BLOCKED.md}
  - shipping-audit/raw_products.json (抓取于 2026-09-15)
  - deliverables/PRADA-78-END-TO-END-AI-EXECUTION-GUIDE.md
  - scripts/build-prada-78-manifest.cjs
  - scripts/validate-prada-seo-pdp-3.cjs
---

# 案例：Prada 78 批量 run（含 1 个已验证成功单品）

## 1. 案件基本信息

```text
Run ID        : 2026-09-02T14-30-31+08-00-prada-78
来源引导文件  : deliverables/PRADA-78-END-TO-END-AI-EXECUTION-GUIDE.md
目标          : 把 Prada Shoes 的 78 个商品上架到 luckdog / dripsneakers.org
优先级        : 商品身份与不重复 > 数据不丢失 > SEO/PDP 正确 > 78/78 覆盖 > 速度
模式          : draft → execute
起止          : 2026-09-02（盘点）→ 2026-09-07（最后一次进度更新）
```

## 2. 真实计数（可复算）

manifest 与校验器输出（`validation-checks.json`）：

```text
products=78  images=856  americas_cup=34  prada_only=44  existing=14  missing=64  valid=true
```

```text
source_folder_count            = 78
source_image_count             = 856
exact_duplicate_folder_count   = 0
existing_source_product_count  = 14      （9 published_update_required + 5 unpublished_update_required）
missing_source_product_count   = 64      （create_and_publish）
action 分布                    : create_and_publish 64 / update_existing_and_publish 14
SKU 分布                       : internal_sku_count 66 / sourced_sku_count 12
```

## 3. 这个 run 实际完成了什么（必须诚实）

```text
Task 0 后端对账        : 部分完成（校验器 PASS；后台列表读取失败）
Task 1 逐项对账 0/78   : PENDING
Task 2 单品试跑        : PENDING（目标 ID 536027476120336）
Task 3 批量 77         : PENDING
Task 4 证据与终检      : PENDING
实际上传量             : 0 / 78
```

证据：`PROGRESS.md` 逐项标注 PENDING 与 `Progress: 0/78`；`operations.jsonl` 仅 8 行，全部为开工前的
盘点 / 鉴权 / 对账 / 校验动作，无任何 create / update / publish 记录。

```text
operations.jsonl 中的失败记录：
  第 5 行  read_product_list = failed
           error: "Chrome extension timed out while reading the large product table"
  未提交任何表单、未修改后台状态。
```

结论：

> **"Prada 78 已成功"这个说法不成立。** 成立的说法是：
> "Prada 78 的**盘点、命名、去重、校验四件事做完了**，上传没做。"

## 4. 唯一可证实的成功单品

```text
Product ID : 536027476120336
商品名     : Prada America's Cup Patent Leather Sneakers Grey White
URL        : https://www.dripsneakers.org/Prada-Americas-Cup-Patent-Leather-Sneakers-Grey-White
分类       : Prada  +  Prada America's Cup Sneakers  (+ NEW CLOTHING)
图片       : manifest expected_image_count = 12
抓取时点   : 2026-09-15（shipping-audit/raw_products.json）
```

改造前（2026-09-02 记录）：

```text
标题 : Prada Off-White Gray
URL  : https://www.dripsneakers.org/-Prada-Off-White-Gray
状态 : 未发布
```

证明链（三条独立证据）：

```text
1. 视觉同一性 公开图 536027476120336-prada-off-white-gray.jpg
             ↔ 本地 Prada Americas Cup Patent Grey White\01_main_cover.jpg
             color_mae = 0, dhash_distance = 0
2. 命名       走 America's Cup 公式（descriptor = Patent Leather Sneakers）
3. 线上现状   2026-09-15 抓取：三个 Cup 分类商品之一，breadcrumb 归属 Prada
```

## 5. 这个 run 真正留下的资产（不是商品，是脚本）

| 资产 | 路径 | 价值 |
|---|---|---|
| 命名 + 清单生成器 | `scripts/build-prada-78-manifest.cjs` | America's Cup 公式、配色清洗、内部/来源 SKU 分型、identity-audit 生成 |
| 校验器 | `scripts/validate-prada-seo-pdp-3.cjs` | 强制标题以 `Prada ` 开头、title == product_title、关键词 8 个有序唯一、meta 150–160、PDP 3.0 字段完整性、禁词扫描 |
| 视觉去重 | `scripts/prada-visual-dedupe.cjs` | 64-bit dHash 近邻 |
| 公开图对账 | `scripts/compare-public-prada-images.cjs` | dHash + 颜色 MAE |
| 源目录清单 | `scripts/inventory-prada.ps1` | 文件夹级 SHA-256 |
| 公开页审计 | `scripts/audit-public-prada.ps1` | 线上 PDP 版本探测 |

## 6. 未解决 / 未修复项

```text
[ ] 78/78 未上传
[ ] 后台大表格读取超时未修复
[ ] 2026-09-02（10/9/69）与 2026-09-07（14/64）两组对账数字未调和
[ ] 9 个线上存量 PDP 未通过 3.0 校验（版本 3.3×8 / missing×1），未修复
[ ] 5 个未发布品的破损 URL（形如 /-Prada-Sneakers-Black-Red）未修复
[ ] 66 个 internal_catalog SKU 未替换为 V4.4 合法的 SKU 或 SKU_OMIT
[ ] check-prada.js 为 0 字节空文件，未删除也未修复（保留为证据）
```

## 7. 从这个案例抽象出的可复用规则

```text
R1  "盘点完成" ≠ "上传完成"。进度报告必须分别陈述两者，禁止合并叙述。
R2  幂等键统一用 source_key；断线恢复先读 PROGRESS.md / BLOCKED.md / operations.jsonl。
R3  大列表读取必须走 API（POST /biz/DTB_proProduct/queryList），DOM 分页 15 条/页不可靠。
R4  源目录重复判定用内容哈希（SHA-256 + dHash），不用文件名。
R5  视觉近邻对只记录候选，不做删除决策（deletion_decision = "none"）。
R6  manifest 的 published 字段是目标值；线上事实必须来自抓取或后台回读。
R7  内部目录码不是 SKU。跨标准迁移时，内部码路径必须重判为 SKU_OMIT。
R8  校验器必须做反向验证（红→绿），否则无法证明它真的会拦。
```

## 8. 迁移到 V4.4 时的必改项

```text
1  PDP 3.0 → V4.4（模板、字段、内链、5 字段 Product Details、data-standard="4.4"）
2  66 个 internal_catalog SKU → SKU_OMIT（或补 Tier 1-4 证据升级为 VERIFIED_SKU）
3  破损 URL → 触发 §10 迁移，old → 单跳 301 → final
4  9 个版本 3.3 的存量页 → 重新按 V4.4 审计并修复
5  分类"必须同时包含"关系 → 升级为可复验的集合断言
```
