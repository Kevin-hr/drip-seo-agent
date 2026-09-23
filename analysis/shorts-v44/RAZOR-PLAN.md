# /Shorts/ 70 款未上架商品 SEO PDP — 剃刀方案

**日期**：2026-09-23
**分类**：`/Shorts/` · CategoryId `536025126720018` · `IsAutomatic=true` · 匹配规则 `Name lk "Shorts"`
**证据**：`members_full.json` · `unpublished_detail.json` · `damage_audit.json` · `audit_names.py` 输出
**标准**：`standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`（SHA-256 `965314cd…3e5b7`）

---

## 0. 事实底座（实测，非推测）

| 指标 | 实测值 |
|---|---|
| 分类成员总数 | **113** |
| 已上架（IsShow=1） | **43** |
| 未上架（IsShow=0） | **70** |

用户口径与后台 100% 一致。以下为 70 款未上架商品的**全量破损审计**：

| 破损项 | 命中 | 占比 |
|---|---|---|
| `SeoTitle` = `" reps \| Drip Sneakers"`（产品名整段丢失，21 字符） | 70/70 | 100% |
| `SeoDesc` 为空 | 70/70 | 100% |
| `SeoKeyword` 为空 | 70/70 | 100% |
| `BrandId` 为空 | 70/70 | 100% |
| `Summary` 为空 | 70/70 | 100% |
| 图片 ALT 为空 | **629/629** | 100% |
| `Content` = 供应商搬运 HTML（0 款 V4.3/V4.4 结构） | 70/70 | 100% |
| `Content` 含废弃域名死链 `dripsneakers.net` | 70/70 | 450 处 |
| `Content` 含 Instagram 外链，锚文本写 `@stocxkshoesvip_com`（旧站名） | 70/70 | 18 处 |
| `Content` 含 WhatsApp 外链 | 70/70 | 18 处 |
| `Content` 含 `replica` / `1:1` / `exact copies` | 23/70 | 33% |
| `UrlValue` 含 `Top-Quality` | 41/70 | 59% |
| `UrlValue` 以 `-` 开头（脏 slug） | 28/70 | 40% |
| `Content` 内 `<img>` | **2/70** | 3% |

### 三个必须先说的事实

**F1 —— 没有 SKU 可用。**
`DTB_proSKU_ref` 只含 `SIZE × Color` 组合，无任何货号。70 款名称中仅 1 款含官方式货号（`Dior-Shorts White 203475`）。按 V4.4 §5，这批大概率**全部走 `SKU_OMIT`**，没有 `VERIFIED_SKU` 可言。

**F2 —— Description 无图可放。**
V4.4 §16 规定 `Description = 产品详情图`。实测 68/70 款的 `Content` 里 `<img>` 数为 0，只有供应商文字。ImgList 有 629 张图，但那是商品图槽位，不是详情图。

**F3 —— 22 款名称只有裸内部编号，过不了 Exact Entity 门禁。**
如 `Hellstar Shorts 792`、`Hellstar-Shorts 709`、`adidas Originals ADICOLOR Classic Stripe Shorts 01`。这些编号是供应商内部款号，不是品牌官方标识。V4.4 §4 Exact Entity 硬门禁要求 Tier 1–4 源交叉验证。**在无补充材料（供应商原链接／货号／高清原图）的情况下，这 22 款无法合法通过门禁。**

还有一款是促销赠品，不是商品：`Get FREE Shorts (Need to Order Amount ≥ $399 )`。

---

## 1. 剃刀：砍掉什么

### 第一刀 —— 砍掉「70 款一次性全量上架」

项目 `STATUS.md` 明文：

> The first real MrShopPlus write has not been performed. Production remains **NO-GO**.
> **No batch execution is authorized before the canary completes.**

70 款批量写 = 直接违反项目自己的硬门禁，且无任何回滚证据基础。第一刀砍在这里。

### 第二刀 —— 砍掉「上架」这个终点，替换为 canary 门禁

正确终点不是「70 款上架」，而是：**1 款 canary 打通全链路并人眼验收 → 才解锁批量**。上架只是 canary 通过后的机械动作。

### 第三刀 —— 砍掉「逐款手工修 Content」

70 款的破损模式**完全一致**（同一批供应商搬运）。450 处死链、36 处外链、23 款违禁词，这是**批量替换 + 批量重写**问题，不是 70 次手工劳动。按款逐修是伪工作量。

### 第四刀 —— 砍掉 22 款「裸编号款」的 SEO 生成

Exact Entity 未 PASS 前生成 SEO 字段，违反 V4.4 §2「SEO fields must NOT be generated before Exact Entity PASS」。这 22 款先 HOLD，等材料。

### 第五刀 —— 砍掉 1 款赠品

`Get FREE Shorts (Need to Order Amount ≥ $399 )` 不进入商品 PDP 流程。

**剃刀后实际待办：70 − 22（待材料）− 1（赠品）= 47 款。**

---

## 2. 留什么：最小可执行集

按 V4.4 §25 输出顺序，每款需产出 10 项；写入后台需落 6 个字段位：

| # | 字段 | 后台位置 | 当前状态 | V4.4 依据 |
|---|---|---|---|---|
| 1 | Product Name | `Name` | 41 款带 `Top Quality`／20 款带裸编号 | §6 |
| 2 | SEO Title | `SeoTitle` | 70/70 破损 | §7 |
| 3 | SEO Keywords | `SeoKeyword` | 70/70 空 | §8 |
| 4 | Meta Description | `SeoDesc` | 70/70 空 | §9 |
| 5 | URL Slug + Canonical | `UrlValue` | 41 脏／28 带 `-` 前缀 | §10 |
| 6 | Key Description（1 句 + 5 字段 Product Details + 品牌内链） | 表单 `editor[1]`（`base-prop-item`） | 未设置 | §12 §14 §15 |
| 7 | Description（仅详情图） | 表单 `editor[0]`（绑定 `Content`） | 供应商文字，无图 | §16 |
| 8 | Image ALT ×629 | `ImgList[].alt` | 全空 | §21 |

**品牌内链目标（14/15 已存在，1 个缺失）：**

| 品牌 | 款数 | 内链目标 | 状态 |
|---|---|---|---|
| Hellstar | 24 | `/Hellstar-Shorts/` | OK |
| Chrome Hearts | 9 | `/Chrome-Hearts-Shorts/` | OK |
| Louis Vuitton | 8 | `/Louis-Vuitton-Shorts/` | OK |
| Dior | 5 | `/Dior/` | OK |
| Thom Browne | 5 | `/Thom-Browne/` | OK |
| adidas | 5 | `/Adidas/` | OK |
| Trapstar | 3 | `/Trapstar/` | OK |
| Godspeed | 2 | `/Godspeed/` | OK |
| Fendi / Gallery Dept / Stone Island / Fear of God / Sp5der | 各 1 | 同名分类 | OK |
| **Rhude** | 1 | `/Rhude/` | **缺失** |

---

## 3. 执行阶梯

| 阶段 | 动作 | 产出 | 门禁 |
|---|---|---|---|
| P0 | 批量清洗 Content：删 450 死链 + 36 外链 + 违禁词 + 供应商话术 | 70 款清洁 HTML | 无违禁词残留 |
| P1 | 1 款 canary 全字段写入 + 前台验收 | 1 款 PASS 证据 | 人眼验收 |
| P2 | 47 款批量写 6 字段 + 629 ALT | 批量写入 | canary PASS |
| P3 | 22 款补材料后重进门禁 | 材料清单 | 用户提供 |
| P4 | 47（+补足）款上架 | IsShow=1 | P2 前台验收 PASS |

---

## 4. 待你决策（阻塞开工）

1. **「剃刀原则」的所指** —— 本方案按奥卡姆剃刀理解：砍掉一切不改变客户可见结果的步骤，只保留最小可执行动作集。若你指的是别的（如某个既有模板），纠正我。
2. **canary 门禁** —— 是否接受「先 1 款、你验收后才批量」？还是授权跳过 canary 直接批量写？
3. **22 款裸编号款** —— 走 HOLD，还是你提供供应商原始链接／货号／高清图以便补验证？
4. **Description 无图** —— 留空、从 629 张 ImgList 抽图、还是你另给详情图？
