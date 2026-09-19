---
id: reports.prada.evidence-availability
kind: governance-report
phase: 1
version: 1.0.0
status: ACTIVE
pack: prada
generated: 2026-09-20
method: read-only filesystem + git inspection; no backend access
---

# Phase 1 — Evidence Availability Check

> 目的：确认 Prada Pack 依赖的证据**是否真的存在于仓库内**，并据此判断
> 证据是否达到"生产安全"标准。
>
> 结论先行：**没有达到。** 全部 Prada 证据都只存在于工作区，未纳入任何版本控制。

---

## 0. 检查范围与判定口径

检查位置：

```text
audit/
docs/case-studies/
scripts/
tests/
packs/prada/
shipping-audit/
```

三个独立维度，必须分开回答（否则会得出错误结论）：

```text
Exists              文件是否在磁盘上存在
Tracked by Git      是否被某个 git 仓库跟踪（并注明是哪个仓库、哪条分支）
Used by Pack        packs/prada/pack.json 的 provenance 是否引用它
```

```text
RULE-ID: EV-00
IF 文件 Exists 但未 Tracked by Git
THEN 该证据处于单点风险状态，不得判定为 production safe
OUTPUT HOLD
```

---

## 1. 冻结 run 的核心清单（audit/2026-09-02T14-30-31+08-00-prada-78/）

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json
Exists:         YES (382,135 bytes)
Tracked by Git: NO — 外层 dripsneakers 仓库跟踪 80 个文件，不含任何 audit/
Used by Pack:   YES (provenance #1)
Risk:           CRITICAL — 78 款冻结清单与 856 图计数只此一份
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/identity-audit.json
Exists:         YES (23,105 bytes)
Tracked by Git: NO
Used by Pack:   YES (provenance #1)
Risk:           CRITICAL — 14/64 存量拆分、9/5 已发布拆分、66/12 SKU 分型的唯一来源
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/validation-checks.json
Exists:         YES (727 bytes)
Tracked by Git: NO
Used by Pack:   YES (间接，pack 引用其计数结论)
Risk:           HIGH — 清单校验 valid=true 的唯一凭据
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/operations.jsonl
Exists:         YES (4,420 bytes, 8 行)
Tracked by Git: NO
Used by Pack:   YES (PRADA-B01 / PRADA-B02)
Risk:           HIGH — "实际上传 0/78" 与 read_product_list failed 的唯一凭据
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/PROGRESS.md
Exists:         YES (1,585 bytes)
Tracked by Git: NO
Used by Pack:   YES (PRADA-B01)
Risk:           MEDIUM — Task 1–4 全 PENDING 的凭据
```

```text
File:           audit/2026-09-02T14-30-31+08-00-prada-78/BLOCKED.md
Exists:         YES (405 bytes)
Tracked by Git: NO
Used by Pack:   YES（间接）
Risk:           MEDIUM — "No blocked items" 的凭据
```

---

## 2. evidence 子目录（新增纳入清点）

```text
File:           evidence/public-prada-seo-pdp-audit.json
Exists:         YES (18,348 bytes)
Tracked by Git: NO
Used by Pack:   YES (PRADA-B04，Phase 3 的版本分布来源)
Risk:           CRITICAL — 9 个存量页 PDP 版本分布（3.3 x8 / missing x1）的唯一来源
```

```text
File:           evidence/prada-source-inventory.json
Exists:         YES (439,879 bytes)
Tracked by Git: NO
Used by Pack:   NO（尚未引用）
Risk:           HIGH — 源目录文件夹级清单，去重结论的底层数据
```

```text
File:           evidence/prada-visual-dedupe.json
Exists:         YES (1,281,699 bytes)
Tracked by Git: NO
Used by Pack:   NO（尚未引用）
Risk:           HIGH — 120 组视觉近邻候选的唯一来源
```

```text
File:           evidence/public-to-local-image-matches.json
Exists:         YES (17,602 bytes)
Tracked by Git: NO
Used by Pack:   YES（verified_success 的 dhash=0 / mae=0 结论）
Risk:           HIGH — 视觉同一性证据的唯一来源
```

```text
File:           evidence/backend-unpublished-image-matches.json
Exists:         YES (10,945 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           evidence/prada-78-first-image-contact-sheet.jpg
Exists:         YES (902,125 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           evidence/public-product-images/            (目录)
Exists:         YES (10 files, 1,395,878 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           evidence/backend-unpublished-images/       (目录)
Exists:         YES (6 files, 1,421,568 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

冻结 run 目录合计：

```text
files = 28
bytes = 5,900,421
```

---

## 3. 脚本

```text
File:           scripts/build-prada-78-manifest.cjs
Exists:         YES (27,828 bytes)
Tracked by Git: NO
Used by Pack:   YES (naming 与 sku 分型的来源)
Risk:           CRITICAL — America's Cup 公式与配色清洗规则的唯一实现
```

```text
File:           scripts/validate-prada-seo-pdp-3.cjs
Exists:         YES (7,528 bytes)
Tracked by Git: NO
Used by Pack:   YES
Risk:           HIGH — 清单校验器；其反向验证（红→绿）输出未随文件保存
```

```text
File:           scripts/inventory-prada.ps1
Exists:         YES (4,866 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           scripts/audit-public-prada.ps1
Exists:         YES (5,092 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM — Phase 3 版本分布的生产者
```

```text
File:           scripts/compare-public-prada-images.cjs
Exists:         YES (3,092 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

```text
File:           scripts/prada-visual-dedupe.cjs
Exists:         YES (6,898 bytes)
Tracked by Git: NO
Used by Pack:   NO
Risk:           MEDIUM
```

---

## 4. 公开站抓取

```text
File:           shipping-audit/raw_products.json
Exists:         YES (1,562,554 bytes)
Tracked by Git: NO
Used by Pack:   YES (verified_success 的线上观测，2026-09-15)
Risk:           CRITICAL — 全项目唯一一份公开站商品全集抓取
```

---

## 5. 已经在版本控制里的部分（唯一例外）

```text
File:           docs/case-studies/PRADA_78_PREFLIGHT_CASE.md
Exists:         在本分支 NO；在 645638b YES (5,000 bytes)
Tracked by Git: YES — 仓库 Kevin-hr/drip-seo-agent，分支 codex/drip-seo-agent-work-2026-09-19
Used by Pack:   YES (provenance #5)
Risk:           LOW — 已跟踪；但本分支上不存在，需跨分支读取
```

```text
File:           docs/case-studies/PRADA_BATCH_LEARNINGS.md
Exists:         在本分支 NO；在 645638b YES (2,170 bytes)
Tracked by Git: YES — 同 645638b
Used by Pack:   YES (provenance #6)
Risk:           LOW — 同上
```

```text
File:           tests/fixtures/prada/preflight-summary.json
Exists:         在本分支 NO；在 645638b YES (682 bytes)
Tracked by Git: YES — 同 645638b
Used by Pack:   NO（尚未引用）
Risk:           LOW
```

```text
File:           tests/prada-case-regression.mjs
Exists:         在本分支 NO；在 645638b YES (2,284 bytes)
Tracked by Git: YES — 同 645638b
Used by Pack:   NO
Risk:           LOW
```

---

## 6. Pack 自身

```text
File:           packs/prada/pack.json
Exists:         YES (10,415 bytes)
Tracked by Git: YES — 本仓库，本分支（feature/prada-production-readiness 继承自 feature/prada-pack）
Used by Pack:   自身
Risk:           NONE — 已跟踪且带 sha256 引用
```

```text
File:           packs/prada/{README.md,cases.md}
Exists:         YES
Tracked by Git: YES
Used by Pack:   自身
Risk:           NONE
```

```text
File:           packs/prada/tests/{prada-cases.json,run-prada-pack-tests.mjs}
Exists:         YES
Tracked by Git: YES
Used by Pack:   自身
Risk:           NONE
```

---

## 7. 0 字节文件（强制上报）

```text
File:           check-prada.js
Exists:         YES
Tracked by Git: NO
Size:           0 bytes
Used by Pack:   NO（pack 明确禁止引用它）
Risk:           NONE（无内容，因此无价值也无风险）—— 但必须保留在案，
                防止后续有人误以为它是一个校验器
```

冻结 run 目录与 scripts/ 目录的 0 字节扫描结果：**无其他 0 字节文件**。

---

## 8. 空的遗留 run 目录

```text
audit/2026-09-02T14-30-09+08-00-prada-78/
  内容：仅一个空的 evidence/ 子目录
  含义：早于 14-30-31 的一次尝试，未产出任何文件
  风险：LOW —— 但会造成"有两个 run"的误读
```

```text
RULE-ID: EV-01
IF 引用 Prada run
THEN 必须指明是 2026-09-02T14-30-31+08-00-prada-78
     不得引用 14-30-09 那个（它是空的）
OUTPUT PASS
```

---

## 9. Critical Check 结论

```text
EVIDENCE_SINGLE_POINT_RISK
```

判定依据：

```text
1  冻结 run 的 28 个文件 / 5,900,421 bytes —— 全部未跟踪
2  shipping-audit/raw_products.json（1,562,554 bytes）—— 未跟踪，且是全项目唯一公开站抓取
3  scripts/ 下 6 个 Prada 脚本 —— 全部未跟踪
4  外层 dripsneakers 仓库共跟踪 80 个文件，其中与 Prada 相关的数量为 0
5  唯一进入版本控制的 Prada 文档在另一条分支（645638b），不在本分支
```

```text
生产安全性判定：NOT PRODUCTION SAFE
```

```text
RULE-ID: EV-02
IF 证据仅存在于工作区
THEN 不得声称该证据 production safe
     不得基于它授权任何后台写入
OUTPUT HOLD
```

---

## 10. 建议的消除动作（本任务不执行，需另行授权）

```text
[ ] 把冻结 run 的 28 个文件纳入版本控制
    （若担心体积，至少纳入 manifest.json / identity-audit.json /
      operations.jsonl / validation-checks.json / public-prada-seo-pdp-audit.json
      与 4 个 *.json 证据文件；图片目录与超大 json 可另行决策）
[ ] 把 shipping-audit/raw_products.json 纳入或转为可复现的抓取产物（含抓取时间与哈希）
[ ] 把 scripts/ 下 6 个 Prada 脚本纳入 packs/prada/tools/ 或 scripts/
[ ] 删除或标注 audit/2026-09-02T14-30-09+08-00-prada-78（空运行）
[ ] 保留 check-prada.js 并在案说明其为 0 字节
```

```text
RULE-ID: EV-03
IF 上述任一项未完成
THEN 本 Pack 的证据状态仍为 EVIDENCE_SINGLE_POINT_RISK
OUTPUT HOLD
```
