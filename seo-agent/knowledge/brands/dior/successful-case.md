---
id: knowledge.brands.dior.successful-case
kind: case-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:dior, category:sneakers]
evidence_status: PARTIAL
evidence_basis:
  - deliverables/Dior-Sneakers-PDP-V3.2-Report.md
  - git log --oneline（SEO-PDP-3.2-STANDARD 分支）
  - deliverables/dior-B22-unknown-pdp-v32.md 等 3 个 unknown 占位文件
---

# Dior 案例记录（knowledge/brands/dior/successful-case.md）

## 命名说明（重要）

**本文件标题沿用目录约定，但 Dior 目前不存在"成功案例"。**

```text
Dior 的真实状态：
  有批量产物（42 款，v3.2）      ← 有
  有线上/后台验证证据             ← 无
  有可确认的成功交付             ← 无
```

因此本文件记录的是**一个"部分完成且证据不足的批量"**，而不是成功案例。

```text
RULE-ID: DIO-CASE-01
IF 有人引用本文件声称"Dior 已完成"
THEN 该声称无效
OUTPUT HOLD
```

---

```text
Case Name:
  Dior Sneakers PDP V3.2 批量生成（42 款）
  性质：产物生成完成 / 交付验证缺失

Input:
  分支          : SEO-PDP-3.2-STANDARD
  日期          : 2026-09-01
  来源          : https://www.dripsneakers.org/Dior-Sneakers/
  商品总数      : 42
  系列          : B22（13）/ B30（15）/ B33（14）
  工具          : dior_scraper.py、scripts/generate_dior_pdp_v32.py

Problem:
  1. 42 款中有 12 款（全部为 Denim Tears B33）在 URL / H1 中都没有 SKU
  2. 2 款 B33 有 SKU 但没有现成 PDP HTML
  3. 5 款 B33 的 URL 存在拼写错误（Dlue → Blue）
  4. 有 3 个系列（B22 / B30 / B33）出现 "unknown" 占位产物
  5. 全部产物使用已被淘汰的 v3.2 模板

Verification:
  报告中自述的判定方式：
    28 PASS   = 已有 PDP HTML + 已验证 SKU
    2  FIX    = 有 SKU，缺 PDP HTML
    12 HOLD   = SKU 未验证（No SKU in URL/H1）

  本次整理（2026-09-19）的独立核对：
    已核对 deliverables/ 下实际文件：报告.md、dior-pdp-v32-results.json (88 KB)、
    dior-sneakers-products.json (5.4 KB)、33 个 dior-*.pdp-v32.md
    → 文件存在性与报告自述一致
    → 但**无任何线上页面抓取、无后台回读**，28 PASS 无法独立证实

Solution:
  1. 抓取 /Dior-Sneakers/ 分类页得到 42 款
  2. 按 3.2 模板批量生成 SEO + PDP（商品名内含 SKU）
  3. 输出 33 个 md + 1 个结构化 json
  4. 不可发布的 12 款明确标 HOLD 并列明原因

Final Result:
  PASS            28
  FIX              2
  HOLD            12
  合计            42

  产物            : dior-pdp-v32-results.json
                    dior-pdp-scraper-raw.json
                    dior-sneakers-products.json
                    dior-*.pdp-v32.md × 33
  线上验证        : 无证据
  发布动作        : 报告中列为 "Next Steps"，未证实执行

Reusable Rule:
  R1  该批量**不能**作为成功案例引用（缺线上/后台验证）。
  R2  把 "unknown" 作为产物文件名留档，是值得保留的失败记录习惯。
  R3  同一 SKU 被附着到两个商品（3SN272-ZIR1-6536 → B33 White + B33 Black）
      是必须在生成前拦截的冲突。
  R4  线上 URL 的拼写错误（Dlue）与缺品牌前缀都是 §10 迁移触发条件。
  R5  v3.2 → V4.4 迁移存在 5 处硬冲突（见 brand-rules.md §4），
      必须整体重建而非局部改写。
  R6  "SKU 未验证"这个 HOLD 理由在 V4.4 下可能被 SKU_OMIT 解掉——
      但这是待验证假设，不是结论。
```

---

## 本案例对知识层的贡献

Dior 的价值不在"跑通了"，而在提供了三个**其他品牌没有提供的样本**：

```text
1  一个 SKU 被复用给两个商品的样本（3SN272-ZIR1-6536 × 2）
2  线上 URL 拼写错误已固化的样本（Dlue）
3  "unknown" 作为正式失败产物被留档的样本
```

这三条已被抽取为可复用规则：

```text
knowledge/brands/dior/sku-pattern.md  §3 异常 1 / 2 / 3
knowledge/brands/dior/sku-pattern.md  §4 数据质量缺陷
core/identity-verification.md         §7 重复商品判定
```

## 关联文件

```text
品牌规则 : knowledge/brands/dior/brand-rules.md
SKU 模式 : knowledge/brands/dior/sku-pattern.md
模板迁移 : core/pdp-template-v4.4.md
```
