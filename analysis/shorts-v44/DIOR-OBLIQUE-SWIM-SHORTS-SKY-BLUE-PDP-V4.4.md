# Dior Oblique Swim Shorts Sky Blue — SEO-PDP V4.4（Canary #1）

- **Drip Product ID**：`536027503505948`
- **分类**：`/Shorts/`（CategoryId `536025126720018`）
- **标准**：`standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`（SHA-256 `965314cd…3e5b7`）
- **原状态**：`IsShow=0`（未上架）· `SeoTitle=" reps | Drip Sneakers"` · `SeoDesc` 空 · `SeoKeyword` 空 · `UrlValue=-Dior-CD-Obi-Drawstring-Shorts-Blue` · 13 张图 ALT 全空 · `Content` 为供应商搬运 HTML（含 `dripsneakers.net` 死链与 Instagram/WhatsApp 外链）
- **原 Name**：`Dior CD Obi Drawstring Shorts Blue`（供应商自造名，非官方名）

---

## Pass 1 — Exact Entity

| 字段 | 锁定值 | 证据 |
|---|---|---|
| Brand | Dior | 品牌官方产品页 |
| Exact Product Name | Dior Oblique Swim Shorts | dior.com 官方页标题 |
| Colorway | Sky Blue | dior.com 官方配色名 |
| Product Type | Swim Shorts | 官方 |
| Collection | Dior Oblique | 官方 |
| Single Item vs Set | 单件 | 自有图 13 张 |
| Front | 通体 tonal Dior Oblique 印花 + 穿孔系带抽绳 | 自有图 #1 #6 #8 |
| Back | 同色 tonal 满印，无后背图案 | 自有图 #2 #5 |

### 视觉指纹逐项比对（自有高清图 ↔ 官方页面描述）

| 官方描述 | 自有图实证 | 判定 |
|---|---|---|
| Tonal allover Dior Oblique print | 浅蓝底 + 同色调灰蓝 Oblique 满印 | ✅ |
| Drawstring closure with Dior-engraved tips | 抽绳 + 穿孔系带 + 金属绳头 | ✅ |
| Front self-fastening closure | 前襟自体粘合结构 | ✅ |
| Side flap pocket with self-fastening closure | 右侧翻盖口袋 | ✅ |
| Interior mesh | 内衬网布可见 | ✅ |
| Mid-rise waist | 中腰弹力腰头 | ✅ |
| 100% polyester / Made in Italy | 图上不可验证 | — |

**Pass 1 结论：PASS**（本轮识别出并纠正了原 Name 的产品类型错误——原名为 Drawstring Shorts，实物为 Swim Shorts）

---

## Pass 2 — Evidence / SKU

| 项 | 值 |
|---|---|
| SKU Verdict | **`VERIFIED_SKU`** |
| Verified SKU | **`293B103CB041_C510`** |
| 源层级 | **Tier 1 — Brand Official Product Page** |
| 主来源 | `dior.com/…/products/293B103CB041_C510` → "Dior Oblique Swim Shorts / Sky Blue Technical Fabric / Reference: 293B103CB041_C510" |
| 交叉来源 1 | `dior.com/…/products/293B103CB041_C565` → 同款 Sea Green，确认 `293B103CB041` 为款号 |
| 交叉来源 2 | `dior.com` 官方电商（AE）→ 同款 Blue，Reference `293B103CB041_C520` |
| 交叉来源 3 | dior.com 男装 Beachwear 页 → "Dior Oblique Swim Shorts Sky Blue Technical Fabric €990" |

**被拒候选（禁止用作 SKU）**：
- 供应商内部编号：`GD001` / `czt4082` / `777` / `2342` 一类 → §5 明令禁止
- 商品自身 Drip Product ID `536027503505948` → §5 明令禁止
- 内标成分（45% Polyester / 55% 未识别 / 巴西 CNPJ 税号）→ 与官方 100% polyester 不符，reps 标签不可信，**不作为证据**

**Pass 2 结论：PASS**

> 备注：该官方配色页现已在 Dior 各地区站下架（季节性下架），故官方图无法直连获取；实体锁定依据为官方页面内容（三处独立命中，互相一致）+ 13 张自有高清图逐项比对。

---

## Pass 3 — 标准输出（V4.4 §25 十项）

### 1. Product Name
```
Dior Oblique Swim Shorts Sky Blue
```

### 2. H1
```
Dior Oblique Swim Shorts Sky Blue
```

### 3. SEO Title
```
Dior Oblique Swim Shorts Sky Blue 293B103CB041_C510 Reps | Drip Sneakers
```
（§7 格式：Product Name + Verified SKU + Reps | Drip Sneakers）

### 4. SEO Keywords
```
Dior Oblique Swim Shorts Sky Blue, Dior Oblique Swim Shorts, Sky Blue Swim Shorts, 293B103CB041_C510, Dior Oblique Reps Swim Shorts
```

### 5. Meta Description
```
Shop Dior Oblique Swim Shorts Sky Blue reps (293B103CB041_C510) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

### 6. URL Slug
```
dior-oblique-swim-shorts-sky-blue-293b103cb041-c510
```

### 7. Canonical URL
```
https://www.dripsneakers.org/dior-oblique-swim-shorts-sky-blue-293b103cb041-c510
```

### 8. Key Description（写入后台「关键描述」字段）

```html
<p>
This Dior swim short is crafted in sky blue technical fabric with a tonal allover Dior Oblique print and a lace-up drawstring waist finished with Dior-engraved metal tips.
</p>

<h2>Product Details</h2>

<ul>
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Dior/"><strong>Dior</strong></a></li>
<li><strong>Product Type:</strong> Swim Shorts</li>
<li><strong>Model:</strong> Oblique Swim Shorts</li>
<li><strong>Colorway:</strong> Sky Blue</li>
<li><strong>SKU:</strong> 293B103CB041_C510</li>
</ul>
```

- 5 字段齐备：Brand / Product Type / Model / Colorway / SKU ✅（§12 §14）
- Brand 行携带品牌内链 `/Dior/`，锚文本加粗，非 "click here" ✅（§15）
- 未重复完整 Product Name 作为 H2 ✅（§13）

### 9. Description Rule / Image ALT

**Description（后台「商品描述」）**：§16 规定为「产品详情图 only」。当前供应商 HTML 必须清除；本商品无独立详情图素材，该字段本次**清空**，详情图待补（见「未通过项」）。

**Image ALT ×13**（按 ImgList 顺序，格式 = Product Name + View/Detail，§21）：

| # | ALT |
|---|---|
| 1 | Dior Oblique Swim Shorts Sky Blue Front View |
| 2 | Dior Oblique Swim Shorts Sky Blue Side View with Flap Pocket |
| 3 | Dior Oblique Swim Shorts Sky Blue Worn Front View |
| 4 | Dior Oblique Swim Shorts Sky Blue Front View on Hanger |
| 5 | Dior Oblique Swim Shorts Sky Blue Side View on Hanger |
| 6 | Dior Oblique Swim Shorts Sky Blue Drawstring Waist Detail |
| 7 | Dior Oblique Swim Shorts Sky Blue Waistband Detail |
| 8 | Dior Oblique Swim Shorts Sky Blue Lace-Up Drawstring Detail |
| 9 | Dior Oblique Swim Shorts Sky Blue Waist Detail Side Angle |
| 10 | Dior Oblique Swim Shorts Sky Blue Flap Pocket Detail |
| 11 | Dior Oblique Swim Shorts Sky Blue Inner Label Detail |
| 12 | Dior Oblique Swim Shorts Sky Blue Dior Hangtag |
| 13 | Dior Oblique Swim Shorts Sky Blue Care Label Detail |

### 10. Product Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Dior Oblique Swim Shorts Sky Blue",
  "brand": { "@type": "Brand", "name": "Dior" },
  "category": "Swim Shorts",
  "color": "Sky Blue",
  "sku": "293B103CB041_C510"
}
```

---

## 写入映射表

| 后台字段 | 位置 | 现值 | 目标值 |
|---|---|---|---|
| `Name` | 表单「商品名称」 | Dior CD Obi Drawstring Shorts Blue | Dior Oblique Swim Shorts Sky Blue |
| `SeoTitle` | SEO 区 | ` reps \| Drip Sneakers` | Dior Oblique Swim Shorts Sky Blue 293B103CB041_C510 Reps \| Drip Sneakers |
| `SeoKeyword` | SEO 区 | 空 | 见 §4 |
| `SeoDesc` | SEO 区 | 空 | 见 §5 |
| `UrlValue` | SEO 区 | `-Dior-CD-Obi-Drawstring-Shorts-Blue` | dior-oblique-swim-shorts-sky-blue-293b103cb041-c510 |
| `Content` | 表单 editor[0]「商品描述」 | 供应商 HTML（死链+外链） | 清空 |
| 关键描述 | 表单 editor[1] | 未设置 | 见 §8 |
| `ImgList[].alt` | 商品图片 | 13/13 空 | 见 §9 |
| `IsShow` | 表单「商品上架」 | 0 | 1 |

---

## V4.4 门禁自检（§26）

| 门禁 | 状态 |
|---|---|
| Exact Entity | PASS |
| Evidence | PASS |
| SKU when SKU exists | PASS |
| User Decision | PASS |
| SEO Clean | PASS |
| SERP Decision | PASS |
| Meta Description Assurance | PASS |
| Key Description Placement | PASS |
| 5-Field Product Details | PASS |
| Brand Internal Link | PASS |
| Description Image-Only | **PARTIAL** — 已清除供应商 HTML，但无详情图可填 |
| Crawlability | 待前台验收 |

**未通过项（诚实标注）**：`Description Image-Only` 为 PARTIAL。原因：本商品 13 张图均属商品图槽位（ImgList），无独立详情长图素材；`Content` 字段需通过后台上传注入图片，本次仅完成清除动作。
