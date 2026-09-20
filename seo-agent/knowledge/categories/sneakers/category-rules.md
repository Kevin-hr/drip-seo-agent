---
id: knowledge.categories.sneakers.category-rules
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [category:sneakers]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - PROGRESS.md / FINAL-REPORT.md / BLOCKED.md (air-jordan-1-106-2026-09-18)
  - audit/2026-09-02T14-30-31+08-00-prada-78/
  - deliverables/Dior-Sneakers-PDP-V3.2-Report.md
  - shipping-audit/raw_products.json
---

# 运动鞋类目规则（knowledge/categories/sneakers/category-rules.md）

## 0. 类目概况

运动鞋是**素材最多、证据最完整、也是唯一有 V4.4 批量成功记录**的类目。

```text
已有素材的品牌：
  Nike / Jordan   Air Jordan 1 / 11 / 14，106 款，101 已上线（V4.4）
  Prada           78 款清单（未上传），1 款已上线并改造成功
  Dior            B22 / B30 / B33，42 款（v3.2 产物，无线上验证）
  Balenciaga      Runner / Track / Track Hike（有素材，未建包）
  Louis Vuitton   LV Skate（PDP V3.2 单品）
  Bottega Veneta  Orbit 系列（PDP 3.0 目录）
  Gucci           Ace / Rhyton（有素材，未建包）
```

---

## 1. 运动鞋类目的赋能点：SKU 存在基础比服饰好

```text
运动鞋普遍有官方货号体系：
  Nike / Jordan : IH0296-400 / CT8012-005 / 528895-003 / 555088-711
  Prada         : 2EG479 D7C F0008 F G001 / 4E3400 ASZ F0002 F G000
  Dior          : 3SN231YK-A804 / 3SN279ZRD-H868（待独立验证）
```

```text
RULE-ID: SNK-SKU-01
IF 是运动鞋商品
THEN 优先尝试取得官方货号（Tier 1-4）；只有在确实取不到时才走 SKU_OMIT
OUTPUT VERIFY
```

对照：T-Shirts 的多数商品无货号，SKU_OMIT 是主路径；运动鞋应按"先争取 VERIFIED_SKU"的预期执行。

---

## 2. 命名骨架（跨品牌对照）

```text
Nike / Jordan : Air Jordan {代次} Retro {High|Mid|Low} [OG] {Colorway}
                Travis Scott x Air Jordan 1 Low Olive
                Air Jordan 1 Mid PS Chicago (Kids)

Prada         : Prada America's Cup {descriptor} {Colorway}
                Prada Cloudbust Thunder Sneakers Black Grey White

Dior          : Dior {Model} {Colorway}          ← v3.2 时还把 SKU 写进了名称，V4.4 必须去掉
```

```text
RULE-ID: SNK-NAME-01
IF 名称里包含 SKU
THEN 违规（V4.4 §6 的 Product Name 构成不含 SKU）
OUTPUT HOLD
```

---

## 3. 类目特有的身份难点

```text
1  同名同配色的重复款
   AJ1 ordinal 65 与 102 同名同配色，生成 slug 完全相同
   → 这是最强的重复信号

2  配色名与视觉不符
   AJ1 ordinal 31：后台名 Bleached Coral，主图无该特征
   → 配色冲突 → HOLD

3  联名方不可核实
   AJ1 ordinal 67："liv X" 非可核实联名方
   → Collection 冲突 → HOLD

4  供应商口语
   AJ1 ordinal 68："Air Jordan 1 Low tenis"（西语"球鞋"）
   → 无配色/联名信息 → HOLD

5  官方码被复用给两个商品
   Dior 3SN272-ZIR1-6536 → B33 White 与 B33 Black 同时使用
   → SKU 冲突 → HOLD
```

```text
RULE-ID: SNK-ID-01
IF 两个商品生成相同 slug
THEN 视为疑似重复，在确认前两者都不写 SEO、不上架
OUTPUT HOLD
```

---

## 4. 商品清单与后台读取

```text
DOM  : 15 条/页（不可靠，易漏）
API  : POST /biz/DTB_proProduct/queryList
       示例过滤：{ IsShow: false, Name: "Air Jordan 1" }
       实测分页 50 + 50 + 6 = 106，无遗漏
```

```text
RULE-ID: SNK-READ-01
IF 需要建立冻结名单
THEN 走 API 分页 + 落盘 baseline.json/.csv，并记录"共 N 条"的后台原始显示值
OUTPUT PASS
```

---

## 5. 三层验收口径（运动鞋已验证可执行）

```text
Layer 1  V4.4 PASS        （validator 全绿）
Layer 2  后台 readback PASS（标题 / 图片数 / PDP 标记 / 分类一致）
Layer 3  前台 storefront 200 + DOM 核验
```

前台核验的 6 项（AJ1 run 实测口径）：

```text
HTTP 200
title == V4.4 SEO Title
canonical == 最终 URL
H1 == Product Name
Key Description 含 Product Details 标题 且恰好 5 个 li
Brand 内部链接可访问
```

---

## 6. 类目规则

```text
RULE-ID: SNK-CAT-01
IF 商品属于某个系列（如 Prada America's Cup）
THEN 必须归属"品牌 + 系列"两个分类，不得只挂品牌
OUTPUT PASS

RULE-ID: SNK-CAT-02
IF 用平台全局分类（如 NEW CLOTHING）代替目标分类
THEN 违规
OUTPUT HOLD

RULE-ID: SNK-CAT-03
IF 需要迁移 URL（身份错误 / 供应商噪音 / 歧义 / slug 残留）
THEN old → 单跳 301 → final；final = 200；canonical / Schema / sitemap / 内链同步
OUTPUT PASS

RULE-ID: SNK-CAT-04
IF 现有 live URL 已正确
THEN 必须保留（AJ1 run 实例：ordinal 62 保留 air-jordan-1-retro-low-chicago）
OUTPUT PASS
```

---

## 7. 类目的风险清单（来自真实记录）

```text
[ ] 后台保存无响应（AJ1 ordinal 60 BLOCKED / ordinal 102 slug 冲突转 HOLD）
[ ] Chrome 保活超时导致批次中断（AJ1 ENV-02：ordinal 40-60 全部报
    "Target page, context or browser has been closed"）
[ ] 保存成功但 toast 未出现导致误判（AJ1 ENV-03：4 款被误判，改为以 API 返回 + 回读为准）
[ ] 后台会话失效（AJ1 ENV-01；Prada run 的 read_product_list 超时）
[ ] 图片主体未修改但 Description 字段遗留旧链接（AJ1 §7 披露）
[ ] 大表格读取超时（Prada：Chrome extension timed out while reading the large product table）
```

---

## 8. 建新品牌包的优先级建议

```text
按"素材完整度 + 可抽取性"排序：

1  Balenciaga     有 Runner / Track / Track Hike 素材 + .codex/bal* 脚本 → 可抽取
2  Bottega Veneta 有 Orbit PDP 3.0 完整目录 + 标准 → 可抽取
3  Louis Vuitton  有 LV Skate PDP V3.2 单品 + shipping-audit 中的 URL 证据 → 可抽取
4  Gucci          有 Ace / Rhyton 素材 + 上传脚本 → 需先取证
5  Moncler        无任何素材 → 不可建包
```

详见 `knowledge/brands/moncler/successful-case.md` §2 的素材清单。

## 关联文件

```text
Nike 品牌包 : knowledge/brands/nike/
Prada 品牌包: knowledge/brands/prada/
Dior 品牌包 : knowledge/brands/dior/
HOLD 规则   : core/hold-policy.md
```
