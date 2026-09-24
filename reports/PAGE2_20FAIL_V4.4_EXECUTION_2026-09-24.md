# Drip Sneakers｜All Products 第二页 — 20 FAIL V4.4 执行报告

**版本：** SEO-PDP V4.4（`standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`，SHA-256 `965314cd...e5b7`）
**日期：** 2026-09-24
**范围：** `/all-products/` 第二页（25–48）审查确认的 20 个 FAIL
**执行原则：** 剃刀原则（Razor）——忠实转录已锁定实体，不做重复调研；HOLD 保持 HOLD；不发明 product_id / SKU / 图片 URL；不发起 live 写。
**源文档：** `Drip_Sneakers_Page2_20_FAIL_P0_P1_V4.4_REPAIR_2026-09-24.md`

---

## 1. 执行结果总览

| 项 | 数量 | 说明 |
|---|---:|---|
| 总 FAIL | **20** | P0 × 13 + P1 × 7 |
| REPAIR（已生成最终 plan，V4.4 门禁 PASS） | **13** | P0-01/02/04/09/10/13 + P1-01…07 |
| HOLD（保持 HOLD，不生成字段） | **7** | P0-03/05/06/07/08/11/12 |
| URL 迁移（direct 301） | **5** | P0-02、P0-09、P0-10、P0-13、P1-03 |
| URL 保留（keep existing live URL） | **8** | 其余 REPAIR 项 |
| 本轮不列入（未发现明确 FAIL） | 4 | Gucci Ace / ASICS ×2 / NB 9060 — 未触碰 |

---

## 2. 逐项执行台账（REPAIR 13 项）

每项均通过 `tests/check-page2-v44-plans.mjs` 全部确定性门禁（见 §4）。

| ID | Product | SKU 判定 | URL 策略 | Brand 内链（已验证 200） | 门禁 |
|---|---|---|---|---|---|
| P0-01 | Vale Forever Classico Zip Up Hoodie Orange | SKU_OMIT（未验证，完全省略） | keep | /Hoodies/ ✅ | PASS |
| P0-02 | Peaches × Vans Knu Skool Black Pink | VERIFIED（VN0009QCB9P） | migrate → `/peaches-vans-knu-skool-black-pink-vn0009qcb9p` | /SNEAKERS ✅ | PASS |
| P0-04 | Vans OTW Old Skool Reissue 36 Satoshi Nakamoto Grey | SKU_OMIT | keep | /SNEAKERS ✅ | PASS |
| P0-09 | Louis Vuitton LV Skate Sneaker Black Swarovski | VERIFIED（1ADHHC） | migrate → `/louis-vuitton-lv-skate-sneaker-black-swarovski-1adhhc` | /SNEAKERS ✅ | PASS |
| P0-10 | Nike Tech Fleece Full-Zip Hoodie & Joggers Set Anthracite Cool Grey Black | 组件码（HV0949-061/HV0959-061），不得冒充 Set SKU → 不写 SKU | migrate → `/nike-tech-fleece-hoodie-joggers-set-anthracite-cool-grey-black` | /Hoodies/ ✅ | PASS |
| P0-13 | Lanvin × Gallery Dept Curb Light Sneakers Paint Drip Pale Pink | VERIFIED（FW-SKDK02-DRGD-P22-B5S0） | migrate → `/lanvin-gallery-dept-curb-light-paint-drip-pale-pink-fw-skdk02-drgd-p22-b5s0` | /SNEAKERS ✅ | PASS |
| P1-01 | Vans Knu Skool Black White | VERIFIED（VN0009QC6BT） | keep | /SNEAKERS ✅ | PASS |
| P1-02 | Vans Knu Skool Navy White | VERIFIED（VN0009QCNWD） | keep | /SNEAKERS ✅ | PASS |
| P1-03 | Vans Old Skool LX Comme des Garçons Black | VERIFIED（VN0A4P3X60E） | migrate（清除尾连字符残留）→ `/vans-old-skool-lx-comme-des-garcons-black-vn0a4p3x60e` | /SNEAKERS ✅ | PASS |
| P1-04 | Supreme Satin Appliqué Hooded Sweatshirt & Sweatpant Set FW24 Black | SKU_OMIT（Set Contents 为第 5 字段） | keep | /Hoodies/ ✅ | PASS |
| P1-05 | Lanvin Curb Sneakers White Grey | VERIFIED（FU-SKDK12-BICO-E250013） | keep | /SNEAKERS ✅ | PASS |
| P1-06 | Lanvin Curb Sneakers White Red | VERIFIED（FM-SKRK11-DRAP-P230030） | keep | /SNEAKERS ✅ | PASS |
| P1-07 | Lanvin × Gallery Dept Curb Paint Drip Optical White | VERIFIED（FM-SKRK11-DRGD-E2100S1） | keep | /SNEAKERS ✅ | PASS |

### 2.1 执行中的模板归一化（机械性，未改实体）

文档中 3 处 SEO Title 与 1 处 Meta 使用了 Product Name 的缩写变体，违反 V4.4 TPL-TITLE-01 / TPL-META-01（Title/Meta 必须由 Product Name 确定性生成）。按模板归一化为与 Product Name 逐字一致：

- **P0-10** title：`Nike Tech Fleece Hoodie Joggers Set …` → `Nike Tech Fleece Full-Zip Hoodie & Joggers Set Anthracite Cool Grey Black Reps | Drip Sneakers`；meta 中 `Anthracite/Cool Grey/Black` → 完整 Product Name。
- **P0-13** title：`Curb Light Pale Pink` → `Curb Light Sneakers Paint Drip Pale Pink`。
- **P1-04** title：`Hoodie Sweatpant Set` → `Hooded Sweatshirt & Sweatpant Set`。

### 2.2 WARN 说明（6 项，均按规则降级而非阻断）

| WARN | 原因 | 依据 |
|---|---|---|
| P0-01 / P0-04 / P1-01 / P1-02 / P1-04 | 既有 live slug 非小写 ASCII，URL 正确 → 保留 | TPL-URL-03（降级 WARN）+ 硬门禁 7（既有 URL 默认稳定） |
| P1-03 | redirect_from 尾连字符残留 `/Vans-Old-Skool-LX-Comme-Des-Garcons-Black-` → 301 到新 URL | 正是"broken residue"迁移场景，迁移后无残留 |

---

## 3. HOLD 台账（7 项）

| ID | Product | HOLD 原因（V4.4 Hard Gate 1） |
|---|---|---|
| P0-03 | Vans Old Skool Comme des Garçons White | VN0A4P3XQLZ 可锁 CDG 联名，但 StockX 与 GOAT 对 exact colorway 记录冲突，White/Black 不能直接 PASS |
| P0-05 | Louis Vuitton LV Skate Sneaker White Brown | 无高权威 official/authorized exact entity + SKU 锁定 White Brown |
| P0-06 | Louis Vuitton LV Skate Sneaker White Brown With Rhinestones | 官方 Product Name + SKU 未锁定；供应商式命名不得升级为官方实体 |
| P0-07 | Louis Vuitton LV Skate Sneaker White Coffee Diamond | 仅 supplier/competitor candidate naming，官方实体 + SKU 未锁定 |
| P0-08 | Louis Vuitton LV Skate Trainer Blue Swarovski Monogram 1ABMHB | 1ABMHB 仅有 lower-tier supplier 证据，Independent SKU Verification 未完成 |
| P0-11 | Lanvin Curb Bico Sneakers White Brown FU-SKDK12-ECDR-E260060 | 无高权威 external exact match 独立锁定代码 + White/Brown |
| P0-12 | Lanvin Curb Sneakers White Blue FM-SKRK11-DRAG-H22 | 同一基础代码在高权重来源颜色记录冲突，可能需 variant suffix，White/Blue 未锁定 |

**约束执行：** 7 项 HOLD 均未生成 slug / title / schema，`schema.sku` 全部省略；在 Exact Entity PASS 前不得标记 V4.4 PASS（硬门禁 1 + §5 清单末条）。

---

## 4. 验证

### 4.1 确定性门禁（已运行，EXIT 0）

`node tests/check-page2-v44-plans.mjs`（可复用校验器，位于 `tests/`）对 13 项 REPAIR 逐项校验：

- H1 = Product Name（TPL-H1-01）
- SEO Title 模板 + 已验证 SKU 恰出现 1 次（TPL-TITLE-01/02）
- Keywords 恰 5 个、无重复（TPL-KW-01/02）
- Meta 固定组合：`Shop {name} reps [(sku)] at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.`（TPL-META-01/02/03）
- URL：canonical = origin + slug；keep 无 redirect；migrate 有 redirect_from（TPL-URL-01/02/05）
- Key Description：`data-standard="4.4"` 包裹 + 1 个 ≥20 字决策句 + 恰 1 个 `<h2>Product Details</h2>` + **恰好 5 个 `<li>`** + Brand 行为 Drip 域内真实内链（TPL-KD-01…08）
- Description：images only（TPL-DESC-01）
- Schema：合法、含 name/brand/category/color，`sku` 与 SKU 判定严格一致（TPL-SCH-01…04）
- 全局禁用词：Women's / Women / GS / PS / TD / Kids / Unisex / Top Quality / Best Quality / 1:1 / luckdog / mrshopplus.com / Bitcoin creator|founder / Anonymous Bitcoin identity —— 全部未命中
- 逐项文档禁用词（如 P0-01 `Pullover Hoodie`、P0-04 `Bitcoin…`、P0-09 `Skate Low Top Skateboard Shoes Black`、P0-10 `Dark Heather Green and Black`）—— 全部未命中

**结果：** REPAIR=13 PASS，HOLD=7 结构合规，0 FAIL；6 WARN（见 §2.2）。

### 4.2 Brand 内链可抓性（TPL-KD-02 前置）

- `https://www.dripsneakers.org/Hoodies/` → HTTP 200；`https://www.dripsneakers.org/SNEAKERS` → HTTP 200（HEAD 实测）
- `sitemap-product-category.xml`（lastmod 2026-09-24）均含两分类 URL，证据文件存档于 run 目录
- 说明：抓取工具初次对 `/Hoodies/` 报 "link dead" 为工具误报，HTTP 实测与 sitemap 双重确认 200

### 4.3 外部实体证据

实体/SKU 锁定与信源继承自源文档 §4（Vans / Louis Vuitton / Nike / Lanvin 官方与 StockX、GOAT），本轮未重复调研；每个 REPAIR plan 的 `evidence_urls` 已随计划落盘。

---

## 5. 产物

| 产物 | 路径 |
|---|---|
| 20 项执行计划（13 REPAIR + 7 HOLD + 路由字段 + schema + 证据） | `data/runs/page2-20fail-2026-09-24/plans.json` |
| 确定性 V4.4 门禁校验器（可复用） | `tests/check-page2-v44-plans.mjs` |
| 分类 sitemap 证据 | `data/runs/page2-20fail-2026-09-24/sitemap-product-category-2026-09-24.xml` |

---

## 6. 下一阶段前置条件（live 写入前必办）

1. **product_id 映射**：`plans.json` 中 `product_id=null`，需在 fresh live reconciliation 中按 `/all-products/` 第二页把每条 final URL 映射到 MrShopPlus product_id（不发明 ID）。
2. **图片 URL 填充**：`description.image_urls=[]`，写入时从 live PDP 取 product detail images（仅详情图，不得复用主图轮播 URL，遵循 V4.5 Description policy 精神）。
3. **Brand 内链候选升级（可选，下一轮）**：按 V4.4 §15 内链优先级，站点存在更高优先级 hub：`/Vale-Forever/`、`/Nike-Tech-Fleece/`、`/Louis-Vuitton-Skate/`、`/Lanvin/`、`/Vans/`、`/Supreme/`、`/Gallery-Dept/`、`/Joggers/`（全部已实测 200）。本轮遵守文档锁定值（/Hoodies/、/SNEAKERS），是否升级留待用户决策。
4. **执行通道**：bridge 默认 simulate → pre-write gate `GO` → 一次 supervised canary → live。任何 live 写前必须完成 STATUS.md 所列 fresh live reconciliation；PASS 才可写，HOLD fail-closed。
5. **301 落地**：5 条迁移（P0-02/09/10/13、P1-03）执行 direct 301，canonical / sitemap / 内链同步最终 URL。

---

## 7. 与源文档的一致性声明

- 13 项 REPAIR 的实体事实（Brand / Model / Product Type / Colorway / SKU 判定 / 联名 / 组件）与源文档逐字一致。
- 4 处模板归一化（§2.1）为机械性合规修正，未改实体；如需保留源文档缩写标题，将触发 TPL-TITLE-01 阻断，不满足 V4.4 PASS。
- 7 项 HOLD 保持 HOLD，无任何字段生成。
- 4 项"本轮不列入"未触碰。
