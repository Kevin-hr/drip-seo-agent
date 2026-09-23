# Canary #1 执行报告 — Dior Oblique Swim Shorts Sky Blue

**执行时间**：2026-09-23
**Product ID**：`536027503505948`
**分类**：`/Shorts/`（`536025126720018`）
**结论**：**端到端完成** — 实体锁定 → SKU 验证 → V4.4 全字段生成 → 生产写入 → 上架 → 前后台双向验收
**回滚快照**：`canary_rollback_payload.json`

---

## 0. 一句话结果

按图锁定实体为 **Dior Oblique Swim Shorts / Sky Blue / Reference `293B103CB041_C510`**，12 项字段写入成功，商品已从后台上架（`IsShow: false → true`），`/Shorts/` 已上架数 **43 → 44**，前台 PDP 200 且 Key Description 渲染于购买区正下方。

---

## 1. 实体锁定（按图搜索，而非按文件名）

### 为什么必须按图

供应商文件名全部不可信，实测反例：

| 商品 | 文件名声称 | 实际图片 |
|---|---|---|
| Dior CD Obi Drawstring Shorts Blue | `dior_cd_obi_drawstring_shorts_blue` | 是 Oblique 全印泳裤（**原商品名产品类型错误**：实为 Swim Shorts，非 Drawstring Shorts） |
| Chrome Hearts Denim Shorts Black | `copy_of_..._yellow_cross` | 黑牛仔 + 蓝白十字 |
| Sp5der OG Web Shorts | `copy_of_..._off_white_short_1017` | 双配色 Sp5der 卫裤 |
| Gallery Dept Shorts - GD001 | — | 6 配色拼图（实体不唯一） |

### 视觉指纹逐项比对（13 张高清自有图 ↔ Tier 1 官方描述）

| 官方描述 | 自有图实证 | 判定 |
|---|---|---|
| Tonal allover Dior Oblique print | 浅蓝底 + 同色调灰蓝 Oblique 满印 | ✅ |
| Drawstring closure with Dior-engraved tips | 抽绳 + 穿孔系带 + 金属绳头 | ✅ |
| Front self-fastening closure | 前襟自体粘合 | ✅ |
| Side flap pocket with self-fastening closure | 右侧翻盖口袋 | ✅ |
| Interior mesh | 内衬网布 | ✅ |
| Mid-rise waist | 中腰弹力腰头 | ✅ |

### SKU Verdict

| 项 | 值 |
|---|---|
| Verdict | **`VERIFIED_SKU`** |
| SKU | **`293B103CB041_C510`** |
| 源层级 | **Tier 1 — Brand Official Product Page** |
| 主来源 | dior.com `293B103CB041_C510` → "Dior Oblique Swim Shorts / Sky Blue Technical Fabric" |
| 交叉源 1 | dior.com `293B103CB041_C565` → 同款 Sea Green，确认 `293B103CB041` 为款号 |
| 交叉源 2 | Dior 官方电商（AE）同款 Blue → Reference `293B103CB041_C520` |
| 交叉源 3 | dior.com 男装 Beachwear → "Dior Oblique Swim Shorts Sky Blue Technical Fabric €990" |

**被拒证据（§5 禁止）**：供应商编号 `GD001`；Drip Product ID；内标成分（45% Polyester / 55% 未识别 / 巴西 CNPJ 税号）— 与官方 100% polyester 不符，reps 标签不可信。

**证据短板（诚实标注）**：该官方配色页现已在 Dior 各地区站下架，官方原图无法直连；实体锁定依据为三处独立官方页面内容 + 13 张自有高清图逐项比对。

---

## 2. 写入通道（本轮首次打通，可复用）

| 项 | 值 |
|---|---|
| 保存接口 | `POST /biz/DTB_proProduct/saveModify` |
| 请求体 | `{"args":[[6 blocks]],"additions":{}}` — 必须**整包回传**（6 个 block 全带） |
| block 顺序 | `dtb_proProduct` · `dtb_proProductCates` · `DTB_proSKU_ref` · `dtb_proProductTag` · `dtb_proPriceRange` · `dtb_proProductAttr` |
| 成功响应 | `{"success":true,"result":[<PID>]}` |

**关键字段映射（本轮实测确认的反直觉映射）**：

| UI 位置 | 后台字段 |
|---|---|
| 「关键描述」（TinyMCE editor[1]，`base-prop-item`） | **`Summary`** |
| 「商品副标题」（input） | `SubTitle` |
| 「商品描述」（TinyMCE editor[0]） | `Content` |
| 「编辑SEO」抽屉 [0] TEXTAREA | `SeoTitle` |
| 「编辑SEO」抽屉 [2] INPUT（回车可加多个） | `SeoKeyword` |
| 「编辑SEO」抽屉 [3] TEXTAREA | `SeoDesc` |
| 「编辑SEO」抽屉 [4] TEXTAREA | `UrlValue` |
| 图片 ALT | `ImgList[].a` |
| 上架开关 | `IsShow` |

> 验证方法：向 editor[1] 注入标记 `KD-MARKER-7F3A2B` → 拦截保存载荷 → 标记出现在 `.args[0][0].rows[0].Summary`。
> **注意**：商品表单页不暴露 SEO 字段控件，SEO 只能经「编辑SEO」抽屉或 API 写入。

---

## 3. 12 项变更清单

| # | 字段 | 写入前 | 写入后 |
|---|---|---|---|
| 1 | `Name` | Dior CD Obi Drawstring Shorts Blue | **Dior Oblique Swim Shorts Sky Blue** |
| 2 | `SeoTitle` | `" reps \| Drip Sneakers"` | Dior Oblique Swim Shorts Sky Blue 293B103CB041_C510 Reps \| Drip Sneakers |
| 3 | `SeoKeyword` | 空 | Dior Oblique Swim Shorts Sky Blue, Dior Oblique Swim Shorts, Sky Blue Swim Shorts, 293B103CB041_C510, Dior Oblique Reps Swim Shorts |
| 4 | `SeoDesc` | 空 | Shop Dior Oblique Swim Shorts Sky Blue reps (293B103CB041_C510) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping. |
| 5 | `UrlValue` | Top-Quality-Dior-CD-Obi-Drawstring-Shorts-Blue | dior-oblique-swim-shorts-sky-blue-293b103cb041-c510 |
| 6 | `Url` | /Top-Quality-Dior-CD-Obi-Drawstring-Shorts-Blue | /dior-oblique-swim-shorts-sky-blue-293b103cb041-c510 |
| 7 | `Summary`（关键描述） | 空 | 决策句 + `<h2>Product Details</h2>` + 5 字段（Brand 带 `/Dior/` 内链） |
| 8 | `Content`（商品描述） | 1759 字符供应商 HTML（450 处死链 + 外链 + 违禁词） | 13 张详情图 `<img>` + 逐图 ALT（无任何文字） |
| 9 | `ImgList[0..12].a` | 13/13 空 | 13/13 已填 |
| 10 | `FirstImg.a` | 空 | Dior Oblique Swim Shorts Sky Blue Front View |
| 11 | `IsShow` | false | **true** |
| 12 | `OldUrlValue` / `SeoUrlChangeTo301` | — / true | 见 P2-1 |

**清除的违规内容**（原 Content 内）：`dripsneakers.net` 死链 · Instagram 外链（锚文本为旧站名 `@stocxkshoesvip_com`）· WhatsApp 外链 · "premium replica sneakers and streetwear" · 错误的 Godspeed 分类内链 · 供应商承诺话术。

---

## 4. 验收矩阵

### 后台读回（15 项，14 PASS / 1 FAIL）

| 检查 | 结果 |
|---|---|
| Name / SeoTitle / UrlValue / IsShow | ✅ 4/4 与目标值逐字一致 |
| Content 无 `dripsneakers.net` 死链 | ✅ |
| Content 无 Instagram / WhatsApp 外链 | ✅ |
| Content 无 `replica` / `1:1` / `exact copies` | ✅ |
| Content `<img>` 数 = 13 | ✅ |
| `Summary` 含 Product Details | ✅ 519 字符 |
| ImgList ALT 13/13 | ✅ |
| SeoKeyword / SeoDesc 非空 | ✅ |
| `Url` = `/` + slug | ✅ |
| `OldUrlValue` 保留旧值 | ❌ 被覆盖为新 slug |
| 分类上架数 | ✅ 43 → **44** |

### 前台验收（www.dripsneakers.org）

| 检查 | 结果 |
|---|---|
| 新 URL HTTP 状态 | ✅ 200 |
| `<title>` | ✅ Dior Oblique Swim Shorts Sky Blue 293B103CB041_C510 Reps \| Drip Sneakers |
| `meta description` | ✅ 与写入值一致，未被截断 |
| `meta keywords` | ✅ |
| `link rel=canonical` | ✅ 自指新 URL |
| `h1` | ✅ Dior Oblique Swim Shorts Sky Blue |
| Key Description 可见性（§17 Crawlability） | ✅ visible，渲染于 Price/Size/CTA 正下方（§11 布局达标） |
| Product Details 5 字段渲染 | ✅ Brand / Product Type / Model / Colorway / SKU 五行齐备 |
| Brand 内链 | ✅ `https://www.dripsneakers.org/Dior/` |
| 空 ALT 图片数 | ✅ **0**（全页 103 张图无一空 ALT） |
| 详情图实际加载 | ✅ 78 处引用，naturalWidth 848，ALT 正确 |
| Product schema 存在 | ✅ `@type: Product` + Brand + Offer + image[] |

---

## 5. 问题清单

### P1-1 平台 Product schema 的 `sku` 用的是 Drip Product ID
平台自动生成 `"sku":"536027503505948"`，而 V4.4 §5 明文禁止把 Drip Product ID 当 SKU。
**性质**：全站模板级，非本商品特有，无法从商品后台修正。需平台层改造。
**影响**：schema 与 PDP 文案的 SKU 不一致，弱化实体信号。

### P1-2 全站 FAQPage schema 含死域名
渲染后 DOM 中出现 `"url": "https://dripsneakers.net/Payment-Methods"`（旧站 FAQ schema）。
**性质**：全站模板级，与本商品 Content 无关（本商品 Content 已清干净）。
**影响**：向搜索引擎持续暴露废弃域名。

### P2-1 `OldUrlValue` 被覆盖，旧 URL 未建立 301
旧 URL `/Top-Quality-Dior-CD-Obi-Drawstring-Shorts-Blue` 现返回 **404**。
**影响评估**：本商品此前从未上架（`IsShow` 一直为 false），旧 URL 从未公开索引，**本次无实际危害**。
**批量风险**：47 款批量时若涉及已上架商品改 slug，必须先确认 301 机制，否则会丢权重。

### P2-2 页面存在两个 `h1`
`h1` = ["Dior Oblique Swim Shorts Sky Blue", "How to Order"]。
**性质**：站点模板级（"How to Order" 是固定模块）。影响 H1 语义唯一性。

---

## 6. 回滚方法

```bash
# 用原始快照重新提交即可回到写入前状态
POST /biz/DTB_proProduct/saveModify
body = canary_rollback_payload.json
```

---

## 7. 门禁结论

| V4.4 §26 门禁 | 状态 |
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
| Description Image-Only | PASS（13 张详情图，零文字） |
| Crawlability | PASS |

**Canary PASS → P2 批量门禁解锁**（`STATUS.md` 的 `No batch execution is authorized before the canary completes` 已满足）。
剩余 47 款 READY / 22 款 HOLD（无官方标识）/ 1 款 EXCLUDE（赠品）。
