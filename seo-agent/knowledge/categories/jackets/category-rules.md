---
id: knowledge.categories.jackets.category-rules
kind: knowledge-pack
version: 0.0.0
status: PLACEHOLDER
schema: agent-readable-v1
applies_to: [category:jackets]
evidence_status: NO_EVIDENCE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis: []
---

# 外套类目规则（knowledge/categories/jackets/category-rules.md）

## 0. 证据状态：NO_EVIDENCE

```text
我在本工作区检索到的 jackets 相关执行记录：0 条
```

检索范围（全部无命中）：`audit/`、`deliverables/`、`dripops/handoff/`、
`.sandbox/state/runs/`、`dripops/dist/data/runs/`、`scripts/`。

```text
RULE-ID: JCK-00
IF 需要处理外套类商品
THEN 不得使用本文件作为规则来源（它没有规则）
     必须走 core/ 通用规则，并从零取证
OUTPUT VERIFY
```

---

## 1. 相邻素材（不构成外套经验，仅供取证起点参考）

本工作区中确实存在**非外套**的服饰类执行记录，方法可迁移、结论不可迁移：

```text
T-Shirts       11 款已验证（9 × 3.1.1 + 2 × 3.2），30 目标未完成
               → knowledge/categories/tshirts/
Hoodies        9 款（8 Ready / 1 Blocked），0 款发布
               → knowledge/categories/hoodies/
Denim Tears    Wreath Shorts 批量 run，含 published-verified 截图
               → audit/2026-08-22T17-51-12+08-00/
```

```text
RULE-ID: JCK-01
IF 要建 jackets 知识包
THEN 可迁移下列通用件：
       core/ 全部规则
       T-Shirts 的 5 类标题噪声库
       Hoodies 的 Ready ≠ 完成纪律
       三层验收（V4.4 PASS + readback + storefront 200）
     不可迁移：任何命名骨架、任何 SKU 模式、任何类目特有阈值
OUTPUT PASS
```

---

## 2. 建立 jackets 知识包的取证协议

```text
STEP 1  后台取真实清单
        店铺 luckdog → 搜索外套类关键词（Jacket / Coat / Puffer / Down / Windbreaker…）
        走 API：POST /biz/DTB_proProduct/queryList
        产物：jackets-baseline.json + .csv

STEP 2  抓线上分类页
        确认是否存在 /Jackets/ 或实际分类路径（不得假设）
        产物：jackets-category-snapshot.json

STEP 3  逐款身份核验（core/identity-verification.md）
        产物：per-product identity record

STEP 4  抽取命名骨架（≥10 款样本）
        外套常见规范要素：材质（Leather / Down / Nylon）、充绒、
                        版型（Puffer / Bomber / Parka）、联名
        产物：本文件新增"命名骨架"段

STEP 5  抽取 SKU 模式
        判定官方货号 vs 内部码
        产物：本目录 sku-pattern.md

STEP 6  收集 ≥5 条失败形态
        产物：本目录 successful-case.md

STEP 7  修改 front-matter：status / evidence_status / version
```

```text
RULE-ID: JCK-02
IF STEP 1-6 完成但样本 < 10 款
THEN 最高只能标 PARTIAL
OUTPUT VERIFY
```

---

## 3. 需特别验证的类目问题（先提出，不要预先回答）

```text
[ ] 外套类是否有稳定的官方货号体系？（待确认）
[ ] 充绒量 / 保暖等级是否属于必须核实的字段？（待确认）
    V4.4 §11 的 5 个 Product Details 字段是固定的
    → 若"充绒量"要进 PDP，只能落在第 5 行的"已核实产品专属事实"位置
[ ] 尺码体系（IT / US / 数字）是否影响 Product Name？（待确认）
    V4.4 §6 明确禁止在对外字段放 gender / sizing 词
[ ] 是否存在"同款不同充绒/不同材质"需要拆分为两个商品的情况？（待确认）
```

```text
RULE-ID: JCK-03
IF 尚未验证上述任一项
THEN 不得在正文写任何结论，只能保留为"待确认"
OUTPUT HOLD
```

---

## 4. 命名规则

```text
（空缺）

通用约束（来自 core/pdp-template-v4.4.md §6，适用所有品牌与类目）：
  Product Name = Brand + [Collaboration/Collection] + Model/Product Name
                 + [Product Type] + [Variant/Colorway]
  禁止：供应商措辞、营销填充词（Top Quality / Best Quality / 1:1 / Authentic Quality）、
        内部编码、未验证标识符、gender/sizing 词
```

## 5. 真实样例

```text
（空缺）

原因：无证据。禁止在此处填写任何未经核验的商品名、货号或配色。
```
