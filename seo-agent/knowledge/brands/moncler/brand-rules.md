---
id: knowledge.brands.moncler.brand-rules
kind: knowledge-pack
version: 0.0.0
status: PLACEHOLDER
schema: agent-readable-v1
applies_to: [brand:moncler]
evidence_status: NO_EVIDENCE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis: []
---

# Moncler 品牌规则（knowledge/brands/moncler/brand-rules.md）

## 0. 证据状态：NO_EVIDENCE

```text
我在本工作区中检索到的 Moncler 相关证据：0 条
```

具体检索范围（全部无命中）：

```text
audit/                                    无
deliverables/                             无
drip-seo-agent/standards/                 无
drip-seo-agent/dripops/handoff/           无
drip-seo-agent/.sandbox/state/runs/       无
drip-seo-agent/dripops/dist/data/runs/    无
scripts/                                  无
```

```text
RULE-ID: MON-00
IF 需要处理 Moncler 商品
THEN 不得使用本文件作为规则来源（它没有规则）
     必须走 core/ 的通用规则，并从零取证
OUTPUT VERIFY
```

---

## 1. 为什么这个目录仍然存在

任务书要求建立 `knowledge/brands/{prada,nike,dior,moncler}/` 四槽位。本目录的作用是**占位并显式声明空缺**，而不是让 Agent 误以为"这里有 Moncler 知识"。

```text
一个标着 PLACEHOLDER + evidence_status: NO_EVIDENCE 的空槽位，
比一个用推测填满的槽位安全得多。
```

---

## 2. 建立 Moncler Knowledge Pack 的协议（取证清单）

按以下顺序执行，每步都必须留下可验证产物：

```text
STEP 1  从后台取真实清单
        店铺 luckdog → 商品管理 → 搜索 "Moncler"
        走 API 而非 DOM：POST /biz/DTB_proProduct/queryList
        产物：moncler-baseline.json + .csv（冻结 Product ID 全集）

STEP 2  抓取线上分类页
        https://www.dripsneakers.org/Moncler/  （若存在；不存在则记录为事实）
        产物：moncler-category-snapshot.json

STEP 3  逐款做身份核验（core/identity-verification.md）
        Tier 1-4 来源优先；供应商标题只作候选
        产物：per-product identity record

STEP 4  抽取命名规则
        从 ≥10 款已确认商品里归纳命名骨架
        禁止把 1-2 个案当作规律
        产物：本文件 §3 的"真实样例"段

STEP 5  抽取 SKU 模式
        判定：是官方货号，还是内部码？
        若是内部码 → 后续只能 SKU_OMIT
        产物：sku-pattern.md

STEP 6  找出失败形态
        至少收集 5 个真实失败/存疑样本
        产物：successful-case.md 的失败段

STEP 7  把 evidence_status 从 NO_EVIDENCE 改为 PARTIAL 或 VERIFIED_CASE_AVAILABLE
```

```text
RULE-ID: MON-01
IF 执行 STEP 1-6 但样本 < 10 款
THEN 最高只能标 PARTIAL，不得标 VERIFIED_CASE_AVAILABLE
OUTPUT VERIFY
```

---

## 3. 真实样例

```text
（空缺）

原因：无证据。禁止在此处填写任何未经核验的 Moncler 商品名、货号或配色。
```

---

## 4. 命名规则

```text
（空缺）

已知的通用约束（来自 core/pdp-template-v4.4.md §6，适用于所有品牌）：
  Product Name = Brand + [Collaboration/Collection] + Model/Product Name
                 + [Product Type] + [Variant/Colorway]
  禁止：供应商措辞、营销填充词、内部编码、未验证标识符、gender/sizing 词

Moncler 专属的命名骨架：待取证。
```

---

## 5. 品牌专属风险（待确认）

```text
无人确认过的事项，一律标注为"待确认"，不得标注为"无风险"：

[ ] Moncler 是否有稳定的官方款式码体系？      待确认
[ ] Moncler 是否常见联名款（需前置联名方）？   待确认
[ ] Moncler 羽绒/外套类的"配色名"是否与视觉色差异大？ 待确认
[ ] 是否存在内部码与官方码混用？               待确认
```

---

## 6. 相关占位

```text
SKU 模式   : knowledge/brands/moncler/sku-pattern.md      （PLACEHOLDER）
案例记录   : knowledge/brands/moncler/successful-case.md  （PLACEHOLDER）
```
