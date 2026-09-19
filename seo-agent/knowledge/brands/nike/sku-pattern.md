---
id: knowledge.brands.nike.sku-pattern
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:nike, brand:jordan]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - FINAL-REPORT.md (air-jordan-1-106-2026-09-18) 最终 URL 列
  - PROGRESS.md 同 run「SKU证据」列
  - BLOCKED.md 同 run
---

# Nike / Jordan SKU 模式（knowledge/brands/nike/sku-pattern.md）

## 0. 结论先行

```text
106 款冻结商品中，只有 7 款使用了 SKU，其余 94 款按 V4.4 §5 完全省略 SKU。
SKU 使用率 ≈ 6.6%。
```

这说明：**省略 SKU 是常态，不是异常。** 一个健康的 Nike / Jordan run 里绝大多数商品就是没有可验证 SKU 的。

出处：`FINAL-REPORT.md`（SKU 列大量为 `(omitted)`）、`PROGRESS.md`（只有 ordinal 1/2/3/5/8/9/30 标注了货号）。

---

## 1. 真实使用过的货号（逐字，全部经 Tier 4 来源确认）

| ordinal | 货号 | 对应商品 |
|---|---|---|
| 1 | `IH0296-400` | Air Jordan 11 Retro Rare Air White Royal Blue |
| 2 | `FJ3460-012` | Air Jordan 14 Retro Flint Grey |
| 3 | `CT8012-005` | Air Jordan 11 Retro Cool Grey |
| 5 | `AR0715-441` | Air Jordan 11 WMNS Midnight Navy |
| 8 | `AH7860-160` | Air Jordan 11 Low Legend Pink |
| 9 | `528895-003` | Air Jordan 11 Low Cool Grey |
| 30 | `555088-711` | Air Jordan 1 Retro High OG Taxi |

出处说明（原文）："SKU：仅 ordinal 1/2/3/5/8/9/30 使用经 Tier 4 来源确认的官方货号；其余按 V4.4 规则省略 SKU。"

---

## 2. 观察到的货号格式（描述性归纳，非标准条款）

```text
格式 A  ^[A-Z]{2}\d{4}-\d{3}$     IH0296-400 / FJ3460-012 / CT8012-005 / AR0715-441 / AH7860-160
格式 B  ^\d{6}-\d{3}$             528895-003 / 555088-711
```

两者都是**短标识 + 连字符 + 3 位配色码**。

```text
RULE-ID: NKE-SKU-01
IF 货号匹配 ^[A-Z]{2}\d{4}-\d{3}$ 或 ^\d{6}-\d{3}$
THEN 形态合法，可进入证据裁决（仍需 Tier 1-4 附着证据）
OUTPUT VERIFY

RULE-ID: NKE-SKU-02
IF 形态合法但无 Tier 1-4 来源附着到同一 exact entity
THEN 不得写入
OUTPUT SKU_OMIT
```

> 重要：`core/sku-validation.md` 明确"短的纯数字是合法的"（举例即 `528895`、`528895-153`）。不要因为"像内部编号"就误拒 Nike 货号。

---

## 3. SKU 省略在输出上的三处连锁差异（必须一致）

```text
1  Product Name       : 名称本身不含 SKU（V4.4 与 3.2 的关键差异）
2  SEO Title          : {Product Name} Reps | Drip Sneakers （无 SKU 版本）
3  Meta Description   : Shop {Product Name} reps at Drip Sneakers with ... （无 SKU 版本）
4  Product Details 第5行 : 换成一条已核实的产品专属事实（不是空、不是 N/A）
5  Schema             : 完全省略 sku 键
6  URL slug           : /product-name-colorway （不追加货号）
```

真实对照（同一 run 内）：

```text
有 SKU : Air Jordan 1 Retro High OG Taxi
         → https://www.dripsneakers.org/air-jordan-1-retro-high-og-taxi-555088-711

无 SKU : Air Jordan 1 Low Dark Concord
         → https://www.dripsneakers.org/air-jordan-1-low-dark-concord
```

```text
RULE-ID: NKE-SKU-03
IF 裁定为 SKU_OMIT
THEN 上述 6 处必须同时为"无 SKU 形态"，任一残留 SKU 痕迹即违规
OUTPUT HOLD
```

---

## 4. 禁止作为 Nike / Jordan SKU 的字符串

```text
536027439914260               MrShopPlus Product ID（命中 ^536\d{12}$）
"DM Batch" / "2223" / "8807"   供应商批次/工厂代号
URL 尾段                      例如 -og-taxi-555088-711 中的整段
图片文件名中的数字串
尺寸码（如 30、42、US9）
```

---

## 5. 与 Dior 的对照（迁移时最易踩的坑）

```text
Nike / Jordan : SKU 在商品名之外；名称 = Air Jordan 1 Retro High OG Taxi
Dior (3.2)    : SKU 被写进商品名（{Brand} {Model} {Colorway} {SKU}），
                例如 "Dior B22 Triple Grey 3SN231YK-A804"
```

```text
RULE-ID: NKE-SKU-04
IF 沿用旧的"把 SKU 写进商品名"的模板做 Nike / Jordan
THEN 违规（V4.4 §6 的 Product Name 构成中不含 SKU）
OUTPUT HOLD
```

出口：`Dior B22 Triple Grey 3SN231YK-A804` 这种写法在 V4.4 下必须改成 `Dior B22 Triple Grey` + SEO Title 中带 SKU。详见 `knowledge/brands/dior/`。
