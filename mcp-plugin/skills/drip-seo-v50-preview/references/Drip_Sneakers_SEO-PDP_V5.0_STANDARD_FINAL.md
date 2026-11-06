# Drip Sneakers — SEO-PDP V5.0 STANDARD FINAL

**标准编号：** DS-SEO-PDP-V5.0  
**版本：** 5.0  
**日期：** 2026-10-21  
**适用：** https://www.dripsneakers.org/ 全站已发布或待发布的商品详情页（PDP）  
**状态：** FINAL · V4.6 完整兼容修订版（R1） — 用于审查、单品试运行、批量执行及发布验收

> **V5.0 核心：先证明“卖的究竟是什么”，再写 SEO；最后证明顾客看见、选中和买到的是同一商品。**
>
> **图片是鉴别起点，不是孤立的定论；旧标题、旧 URL、旧 SKU 是待验证线索，绝不是实体依据。**

---


## V4.6 → V5.0 继承约束及冲突优先级

**版本语义：** V4.6 的全部强制要求属于 V5.0 的最低兼容基线；V5.0 新增项可以加严验收，但不能删除或弱化 V4.6 已确定的规则。本文尾部完整收录 V4.6 原文，以便 Agent 无需隐藏记忆即可逐条执行。若 V4.6 原文中的示例被 V5.0 更新的更严格技术验收补充（例如 Schema 由最低属性信息升级为真实 Offer 验证），执行更严格且不矛盾的 V5.0 规则。

| V4.6 继承项 | V5.0 对应 | 保留形式 |
|---|---|---|
| Visual Fingerprint / Candidate Set / Exact Entity Hard Gate | §1–2 | 完整继承并增加反证 |
| 独立 SKU、未知时彻底省略、单件与套装不混用 | §3–4 | 完整继承并细分 SKU 类型 |
| Product Name = H1 / Title 中已验证 SKU + Reps | §5.1–5.2 | 完整继承 |
| SEO Keywords 逗号分隔 | §5.3 | 完整继承，澄清 Google 不用于排名 |
| **Meta 固定构成/优先级** | **§5.4** | **逐条强制继承；不得改成卖点优先** |
| **Slug 只输出本体，无任何斜杠或域名** | **§6.1** | **完整继承** |
| Canonical = 完整绝对地址，变更时处理重定向 | §6.2–6.4 | 完整继承并添加发布验证 |
| Key Description = 1 句 + 恰好 5 条 Product Details | §7.1–7.3 | 完整继承 |
| Brand 行 `strong` 锚文本与 **live verification** | **§7.4** | **强制继承及失败 HOLD** |
| **Chanel 只能用 `/Chanel/`** | **§7.4** | **固定条目强制继承** |
| Description 只放详情图及抓取性前提 | §7.5 | 完整继承；渲染失败则 HOLD/改可抓取位置 |
| H1 已有，不在关键描述重复完整 H2 Product Name | §7.1–7.3 | 完整继承 |
| Image ALT 与实际视图匹配 | §8 | 完整继承并添加逐图检查 |
| Product Schema 与实体和 SKU 一致 | §9 | 完整继承并提升 Offer 验收 |
| User Decision / Three-Pass Audit / Agent Contract | §1、10–16 | 完整继承并增加交易及发布门槛 |
| 最终仅交付可执行字段、HOLD 不假装完成 | §11–13 | 完整继承 |

**执行顺序：** 优先按 V5.0 §1 的 14 步 SOP 执行；其中 V4.6 的三轮审核保留作为每个商品最终内容质量 Gate。因识别到 `HOLD` 不得生成可直接上架的确定性 SEO；可提供清楚标注的待核实草案。

---

## 0. 升级范围与不变项

### 完整继承 V4.6（包含 V4.4、V4.5）

- Visual Fingerprint（图片视觉指纹）、Candidate Set（候选集）、分级证据与 Exact Entity Hard Gate。
- 市场命名优先，未经证实不得虚构款名、SKU、材质、产地、版型、年份、联名、尺码、售价或购买经历。
- Product Name = H1；H1 默认不附带 SKU；SEO Title 以准确商品实体为中心。
- **完全保留 V4.6 的 SERP Meta Description 固定结构及优先级；不以普通产品细节替代 QC、30-day returns、7–20 day shipping。**
- **URL Slug 必须只包含 slug 字符串，不得有开头或结尾斜杠，不得有域名；Canonical 则必须使用完整绝对 URL。**
- **内部品牌/分类链接必须在本次执行中验证其真实目标；Chanel 的固定链接只能为 `/Chanel/`。验证失败必须输出 `VERIFY/HOLD INTERNAL LINK`。**
- **关键描述 = 一句经核实的自然语言 + 5 条 Product Details；Product Details 中 Brand 行使用真实存在的站内相对路径。**
- 后台 Description 在上述文字可正常展示与抓取的前提下优先只保留商品详情图片。
- Product Details 的“语义角色”和它所在的后台“关键描述”字段是两回事。
- 移动端优先；库存只能根据真实动态变体交互验证，不用静态初始 `Sold Out` 判缺货。
- 只输出用户需要修改的项目；已正确的字段不重复交付。

### V5.0 新增/纠偏

1. **Evidence-before-identity**：旧 URL / SKU 无权推翻实物照片；照片也不能独自确定 SKU。
2. **四向实体一致性**：店铺实物图 ↔ 市场参考图 ↔ 具体购买实体 ↔ SKU/编码。
3. **变体购买一致性**：Hoodie、Pants、Suit 是不同商品类型，不能把单品作为“整套”默认成交。
4. **可售一致性**：逐尺码、逐样式操作并记录实际展示、按钮和购买路径。
5. **技术真实性**：明确区分草稿 URL 与已发布 URL、建议 Canonical 与已上线 Canonical。
6. **Merchant Listing Schema**：价格、Offer、availability 与前台一致；无来源不得编造 Review/AggregateRating。
7. **可追溯验收**：证据表、异常等级、单品金丝雀、发布回查、批量全量覆盖率。

### 目标与边界

- 目标：商品识别准确、购买信息可信、SEO 字段无冲突、页面可读可买、便于 Google 理解。
- **非目标/不得承诺：** 100% 被 Google 收录、指定排名、改字段就必然提升转化率、固定天数索引、商品来自官方授权渠道。
- “Reps”用于适用于该店销售商品的现有 SEO Title 规范，不得把商品冒充为品牌官方正品或授权商品。

---

## 1. 一件商品的 14 步端到端 SOP

| 序号 | 动作 | 证据/交付物 | 放行条件 |
|---|---|---|---|
| 01 | 打开目标 Drip PDP | 当前 URL、页面快照、采集时间 | 能访问或明确报错 |
| 02 | 收集实物视图 | 主图、前、后、局部、详情图 | 真正看到了内容，不是只看 ALT/文件名 |
| 03 | 建立视觉指纹 | 类目、颜色、正反图案、细节、单品/套装 | 每个关键特征有视觉依据 |
| 04 | 构建候选集 | 官方、StockX、GOAT、零售商、反向识图 URL | 同款与相似款分开 |
| 05 | 对比候选身份 | 对照图案、剪裁、标签、季节、性别 | Exact Entity PASS 或 HOLD |
| 06 | 独立核查 SKU | 来源链接与 exact variant 对应截图/文本 | SKU PASS 或省略 SKU |
| 07 | 判断购买实体和变体 | 页面默认款式、选项、图片、价格、尺码 | 三者一致，无混淆 |
| 08 | 定稿商品名称 | Product Name / H1 / 受众 / 型号 | 用户不必猜测卖什么 |
| 09 | 生成 SEO 字段 | SEO Title、Meta、Keywords、Slug、Canonical 方案 | 与身份一致，不假设已上线 |
| 10 | 填写关键描述 | 1 句 + 5 条 Details + Brand 相对内链 | 可见、可抓取，无无证据文案 |
| 11 | 检查详情媒体 | 图序、真正存在的 ALT、规格/尺码表 | 无错图、无重复、无假 ALT |
| 12 | 校验 Schema | Product/Offer/价格/库存/图片与前台一致 | 可用 Schema/无伪造评价 |
| 13 | 前台金丝雀测试 | PC/360/768 视图、尺码与下单交互 | 用户选择的就是可购买的商品 |
| 14 | 发布后复核与记账 | 200、301、Canonical、渲染、GSC 提交状态 | 证据留存，状态 PASS |

**原则：P0 不通过时停止下一个环节。不得先写完整 SEO 文案掩盖身份错误。**

---

## 2. 图像 → 商品实体验证：V5.0 第一 Hard Gate

### 2.1 图像视觉指纹记录表（必须实际观看）

| 维度 | 记录内容 | 与实体的关系 |
|---|---|---|
| 原始类型 | T-Shirt / Hoodie / Sweatpants / Jeans / Set / Shoes 等 | 关键 |
| 主色 | 视觉主色与商业 colorway 名 | 关键 |
| 正面 | Logo 位置、图案、文字、开口、拼片 | 关键 |
| 背面 | 背部图形、布局、口袋、印字 | 可见时关键 |
| 细节 | 破洞、扎染底衬、刺绣、五金、鞋型、袖/裤版型 | 关键 |
| 数量 | 单件上衣、单件裤子、两件套、更多件 | 关键 |
| 受众 | 男/女/童、成人/Youth、是否可证实 | 有证据才标 |
| 品牌/联名 | Logo、合作品牌、图示 | 关键 |
| 版型与系列 | Skinny / Carpenter / Wide / OG Web 等 | 不可凭旧名猜 |
| 商品图来源 | Drip 实图 / 供应商图 / 零售参考图 | 区别待售与参考 |

**图像读取不完整时：** 标记 `VISUAL NOT REVIEWED`，不得声称图案匹配。图片文件名、ALT 和商品标题不能代替看图。

### 2.2 允许使用的证据层级

1. 品牌官网与确认为该 SKU 的官方产品页。
2. 授权零售商的同一件/同一 colorway 商品图和 Style Code。
3. StockX、GOAT 等具备准确款式条目的市场页。
4. FWRD、SSENSE、Farfetch、END. 等成熟零售商的具体商品数据。
5. 产品图明确的独立零售商、市场卖家页面。
6. Yupoo/供应商相册（用来证明当前在售款式的实际图片，不自动证明市场 SKU）。
7. Google Lens、文件名、AI 图像描述（**只能帮助找候选，不单独构成 Exact Entity PASS**）。

> 来源级别不等于绝对正确；**每条证据都必须指向同一个实体、同一个配色、同一个数量单位。**

### 2.3 候选集与反证检查

- 有混淆风险时至少列出 2 个候选，不因第一个搜索结果名字相似就选中。
- 记录每个候选的支持特征与排除特征，尤其关注背面、裤型、Logo 形状和配色。
- 优先寻找可反驳现有识别的证据；与高质量反证冲突时停止定稿。
- 一张零售参考图可能与实售图不同拍摄角度，但关键设计必须一致。
- 店铺主图与详情图若属于不同款式，即使外部 SKU 正确，也为 `HOLD`。

### 2.4 Exact Entity 放行条件

必须确认：

```text
商品类型一致
AND 主配色一致
AND 正面关键设计一致
AND 可见的背面关键设计一致
AND 版型/系列不冲突
AND 件数/组成一致
AND 关键联名/季节/受众不冲突
AND 与购买选项一致
```

证据不足：`HOLD`。发现确定错款：`P0 ENTITY MISMATCH`。不能确定某个细节时要删掉那条推测，而不是凑“看起来很像”。

---

## 3. SKU / Style Code 与商品身份解耦：第二 Hard Gate

### 3.1 必须区分的编码

- **Manufacturer Style Code**：品牌/市场参考的款号，与具体版型、配色匹配。
- **Marketplace Listing ID**：市场平台列表编号，不可假装为厂商款号。
- **Supplier Product Number**：如 `6790` 等，仅用于内部追踪，不是官方 SKU。
- **Drip Product ID**：后台主键，不是外部厂商 SKU。
- **Sellable Variant SKU**：如后台为真实销售变体分配并管理的自有库存 SKU，应与所售选项一一对应。
- **Set SKU**：整套独有的真实编码；不能由 Hoodie SKU 或 Pants SKU 代替。

### 3.2 放行流程

```text
先从图像找到 Exact Entity
  ↓
再核对品牌/零售商的对应款号
  ↓
逐项比对：款名、颜色、图片、单件/套装、性别、季节
  ↓
同一实体 → 可输出已验证的 Style Code
非同一实体 / 有冲突 → 不输出该 SKU
```

- **重要**：品牌官网能搜到某个 SKU，并不证明当前 Drip 图片就是那一款。
- 官方款号与店铺自身 SKU 应分开记录，不能混写。
- Product Details 第五条有已核实款号时写 `SKU`（或明确 `Style Code`，由后台字段语义决定）；没有则改成 `Graphic / Set Includes / Fit` 等经过核实的属性。
- 无从核实：**整个 SKU 字段省略**，禁止 `N/A`、`Pending`、`Not Verified`、自动生成或猜测。
- Product Schema 的 `sku` 仅在它确实对应当前出售的商品或可售变体时使用；不要复用不同商品的零售码。

### 3.3 AMIRI 纠错案例（版本升级依据）

| 证据项 | 错误过程 | V5.0 正确过程 |
|---|---|---|
| Drip 旧 URL | `...Carpenter-Jean-Pink-Sand-AWDNGH1023-812` | 仅当作原始标识，不反推款名 |
| 用户确认视觉特征 | 粉色扎染破洞内衬、石洗靛蓝、前部粉色 AMIRI 大 Logo | 写入视觉指纹 |
| 错误身份 | Women's Carpenter Jean Pink Sand | 排除：与实图结构不符 |
| 正确市场实体 | — | AMIRI Tie Dye Core Logo Skinny Jean Stone Indigo |
| 经零售来源对应的参考款号 | 错填 `AWDNGH1023-812` | `SS23MDS002-765`，继续核对实图与参考图 |
| 结果 | 错 SKU + 错属性 | 只有视觉与零售证据一致才可 PASS |

> **发现“实图正确、原 URL 错”时先保护正确实图，不要因为旧 URL/图片文件名而判实图错误。**

---

## 4. 购买实体 / 变体 / 尺码：第三 Hard Gate

### 4.1 先分类，后选择 URL 模式

| 场景 | 标准处理 |
|---|---|
| 同一款不同尺码 | 通常为同一商品的可售变体；对应尺码、库存及价格 |
| 同一产品不同颜色 | 根据实际 URL / 变体结构实现，确保可直接选中对应颜色 |
| Hoodie 单件 / Pants 单件 / Suit 两件套 | **不同购买实体优先独立 URL**；不准用单品默认选项冒充整套 |
| Adult / Youth / Kids | 尺码表与实物受众明确区分；不同套装身份必要时分 URL |
| 某件商品主图展示整套但只卖单品 | 必须明确实际所含件数，不得让顾客误解 |

### 4.2 Sp5der 反例

当前出现过的风险：`Sp5der OG Web Suit Black` 页面支持 `Hoodie / Pants / Suit`，但默认显示 Hoodie。

**V5.0 修复策略（顺序）：**

1. 首选：Hoodie、Pants、Suit 分成 3 个独立 PDP，分别维护标题、默认图、价格、尺码、SKU/Schema；可以相互内链。
2. 受后台限制只能一个 URL 时：页面名称必须准确描述可选购买形式；默认选项、文案、价格、图像、数量单位完全一致；用户点 `Suit` 后完整切换各项，**不能让标题写 Suit 却默认卖 Hoodie**。
3. 任何情况下都不能拿 Hoodie SKU 当作 Suit SKU；单品码仅限其对应实体。
4. `ProductGroup` 只用于符合 Google 定义的同款变体，不机械把不同商品类型塞进同一个商品组。

### 4.3 动态库存验证（严禁静态推断）

对页面提供的 **每个** Size × Color × Style 组合：

- 实际操作尺寸/款式按钮，检查显示的图片、价格、选项、数量、加购及购买按钮。
- 观察能否进入正确的购物车/结算流程；不得真实付款，除非用户明确授权。
- 记录实际交互结果：`BUYABLE` / `UNAVAILABLE` / `UNKNOWN`。
- 静态 HTML 中的初始 `Out Of Stock / Sold Out` **不能单独证明**某个组合缺货。
- 缺少交互能力或未登录/被限制时，标记 `STOCK NOT VERIFIED`，不编造结论。
- 供应商尺码与零售原版尺码不应自动视为同一套；需要实际尺码数据或标签证据。

### 4.4 尺码标准

- 品牌数据优先，但必须明确是 **原版参考** 还是 **Drip 实售商品尺码**。
- 套装必须分别给 Hoodie 与 Pants 的尺寸表，必要时明确是否允许上下装不同码。
- Adult / Youth / Kids 不能互借码表。
- 360px / 768px 必须能操作并阅读；图片、表格和购买选项不能互相遮挡。
- 无法核实单位、胸宽/胸围、裤长、腰围时 `SIZE HOLD`；不进行英寸/厘米臆测。

---

## 5. Product Name、H1、SEO Title、Keywords、Meta

### 5.1 Product Name 与 H1

```text
Product Name = H1 = 已验证的市场可识别商品名称
```

包含必要的 `Brand + Model/Collection + Product Type + Primary Colorway`，只有身份需要时才包括 `Men's/Women's/Kids`。**H1 不写 SKU**；不要加入 `Top Quality`、`1:1`、`Authentic` 等未经验证或误导性承诺。

### 5.2 SEO Title

**标准模板：**

```text
{Product Name} {Verified Exact Style Code if any} Reps | Drip Sneakers
```

- 无款号：整段款号删除，不保留占位。
- 保证 Title 与 H1、商品图、默认购买实体一致。
- 避免机械重复品牌、配色或堆砌同义词；过长时人工审核精简，但不得删掉决定实体识别的关键信息。
- `<title>` 生成和 Google 最终显示的标题链接不是一回事；Google 可根据页面内容自动调整，不保证按填写内容原样显示。

### 5.3 SEO Keywords

- 后台字段可保留逗号分隔的 **3–6 个真实、精准的关键词**，方便运营管理或站内搜索。
- **Google 不使用 `<meta name="keywords">` 作为索引或排名信号**；不允许把批量填写 Keywords 当 SEO 的核心 KPI。
- 不堆砌宽泛词；不要为了关键词覆盖制造新款名。

### 5.4 Meta Description — 保留 V4.6 SERP Decision Hard Rule

**这是不可被 V5.0 弱化的强制规则。** Meta Description 优先帮助用户在搜索结果中完成：Exact Product Recognition → Search-Intent Match → Purchase-Assurance Information → Click Decision；而非简单缩写 Product Description。

已验证 SKU 的默认模板：

```text
Shop [Exact Product Name] reps ([Verified SKU]) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

无已验证 SKU 的默认模板：

```text
Shop [Exact Product Name] reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

**强制信息优先级（依次）：**

1. Exact Product Name
2. Reps intent
3. Verified SKU（如有）
4. Drip Sneakers
5. QC photos
6. 30-day returns
7. 7–20 day shipping
8. 只有身份识别必需时才添加的 identity-critical product feature

**严禁退化为“1–2 个普通卖点优先”的 Meta**：面料、鞋带、图案、颜色等通常应留给 Key Description、Product Details、图像和 ALT；只有不写便无法区分具体商品时可例外加入 Meta。

**真实承诺限定：** `QC photos`、`30-day returns`、`7–20 day shipping` 必须对应当时有效的商品与全站真实服务。不能升级措辞为 `guaranteed QC photos`、`7–20 day delivery`、`guaranteed delivery`、`authentic quality`、`1:1 guaranteed`。若特定商品政策不适用，必须查证并调整，不得照搬错误服务承诺；调整须留痕说明。

不强制某一字符数；不能为了长度牺牲具体商品识别。Google 可自动生成或改写摘要。不要机械重复 Key Description 的产品细节句。

### 5.5 商品副标题（沿用店铺已确认规范）

```text
QC Photos · 30-Day Returns
```

使用该文案的前提：QC 发送和退货政策确实适用该商品；否则按实际政策调整，不做虚假承诺。

---

## 6. URL、Canonical、301 与 Sitemap

### 6.1 URL Slug — V4.5/V4.6 强制格式完整保留

**后台 `URL Slug` 字段必须只输出 slug 本体，无前导 `/`、无末尾 `/`、无完整域名。**

已核实 Style Code 的首选规范：

```text
brand-model-primary-colorway-verified-style-code
```

没有已核实 Style Code：

```text
brand-model-primary-colorway
```

例如：

```text
amiri-tie-dye-core-logo-skinny-jean-stone-indigo-ss23mds002-765
```

错误：

```text
/amiri-tie-dye-core-logo-skinny-jean-stone-indigo-ss23mds002-765
https://www.dripsneakers.org/amiri-tie-dye-core-logo-skinny-jean-stone-indigo-ss23mds002-765
amiri-tie-dye-core-logo-skinny-jean-stone-indigo-ss23mds002-765/
```

**Canonical URL 不是 URL Slug 字段**，必须是完整的首选绝对 URL：`https://www.dripsneakers.org/[slug]`（此处 `[slug]` 是占位符，不得照搬发布）。

禁止将 `Top-Quality`、供应商编号、旧错款名当成目标永久 Slug；但不要为微小格式美化贸然迁移已稳定的 URL。应先论证身份确实有误，并完成 301/Canonical/内链/Sitemap 迁移证据后再上线。

### 6.2 新旧地址分离

- `CURRENT LIVE URL`：目前可实际访问、返回 HTTP 200 的地址。
- `PROPOSED SLUG`：建议未来使用的名称；未部署前绝不是生效地址。
- `TARGET CANONICAL`：完整绝对 URL，仅在最终目标地址已可用，并做好 301 / 内链 / Sitemap 后适用。
- 未执行上线：**保持旧页面实际生效的 Canonical；不准伪称目标新网址已经存在。**

### 6.3 迁移执行顺序

```text
新页面内容确认
→ 新 URL 可访问（200）
→ 旧 URL 做 301（或平台正确永久重定向）
→ 页面 canonical 指向新最终 URL
→ 导航、集合页、相关文章、Schema URL 同步
→ Sitemap 只列首选可索引 URL
→ 抽查旧 URL 重定向链与新 URL 自规范化
→ GSC URL Inspection 验证
```

Google 的重定向、`rel=canonical` 和 Sitemap 都是规范化信号，但**不能强制 Google 采纳或保证索引**。

### 6.4 站点收录的独立验收

- 访问返回 200；可索引内容可被 Googlebot 获取；没有意外的 noindex/robots 阻断。
- Canonical、内部链接、Sitemap 与目标一致；无软 404 和明显重复实体冲突。
- 提交后在 Google Search Console 查看 Google 选择的 Canonical、页面索引状态和问题原因。
- **SEO-PDP 内容 PASS ≠ Google 已收录 PASS**；两者必须独立记录。

---

## 7. 关键描述：V5.0 后台固定位置

### 7.1 目标布局

```text
H1 / Price / Size / Style / Color / CTA
                ↓
          【关键描述】
           1 句视觉特征
           Product Details (5 条)
           Brand → 相对路径内链
                ↓
          【Description】
           正确商品的详情图片
                ↓
       Size Guide / Shipping / FAQ
```

**重点：结构化 Product Details 和自然语言句子在语义上仍各有职责；在当前 Drip 后台物理上放在同一个“关键描述”字段。**

### 7.2 强制 5 条 Product Details

1. `Brand`：真实品牌名 + 验证存在的相对路径内链。
2. `Product Type`：实售类型（例如 `Men's Skinny Jeans` / `Hoodie/Sweatpant Set`）。
3. `Model`：确切市场命名的型号/系列。
4. `Colorway`：已核实的商用配色。
5. `SKU`（已核实且对应这个购买实体时）；否则 `Graphic / Set Includes / Distinctive Detail` 等具有证据的字段。

不允许为了凑 5 项放入不实内容。特殊类目字段可替换，但必须有独立购买决策价值。

### 7.3 HTML 模板（最终按真实商品填值）

```html
<p>[One concise, factual sentence about the exact product's distinctive visual details.]</p>

<h2>Product Details</h2>
<ul>
  <li><strong>Brand:</strong> <a href="/[Verified-Brand-Category]/"><strong>[Brand]</strong></a></li>
  <li><strong>Product Type:</strong> [Verified Type]</li>
  <li><strong>Model:</strong> [Verified Model]</li>
  <li><strong>Colorway:</strong> [Verified Colorway]</li>
  <li><strong>[Verified SKU or High-Value Fact]:</strong> [Verified Value]</li>
</ul>
```

**此段是示意模板，方括号不能发布到线上。**

### 7.4 V4.6 已验证内链规则和 Chanel 固定注册表

**所有品牌分类内链的执行顺序（每次都要验证）：**

```text
1. 确定目标站内品牌/分类页
2. 实时访问，验证页面能够访问
3. 核实页面确实代表指定品牌/分类
4. 使用页面的准确大小写、路径和尾斜杠；必须为相对路径
5. 若无法验证：输出 VERIFY/HOLD INTERNAL LINK，停止发布这条尚未证实的内链，不得猜测替代路径
```

**Chanel 专属硬编码（V4.6 强制保留）：**

```text
/Chanel/
```

唯一允许的 Brand 行：

```html
<li><strong>Brand:</strong> <a href="/Chanel/"><strong>Chanel</strong></a></li>
```

不得用 `/Chanel-Sneakers/`、`/chanel/`、`/Chanel-Sneaker/`、`/Designer-Sneakers/` 或任何猜测路径替换 `/Chanel/`。

**其他例子仅为历史曾验证的路径，每次执行仍需重新核实：**

- `AMIRI` 牛仔裤分类：`<a href="/AMIRI-Jeans/"><strong>AMIRI</strong></a>`。
- `Sp5der`：`<a href="/Sp5der/"><strong>Sp5der</strong></a>`。
- `Hellstar` T-shirt 分类：`<a href="/Hellstar-T-Shirts/"><strong>Hellstar</strong></a>`。

**使用前在实际前台重新验证链接存在，大小写与末尾斜杠保持现有真实路径。若失败：`VERIFY/HOLD INTERNAL LINK`，不得输出猜测路径。** 禁止使用 sandbox/proxy 网址作为商品内链。

### 7.5 Description 图片优先规则（条件性，不是 Google 强制规则）

- **前提**：关键描述已在用户可见的网页 DOM 中正常渲染，并可供搜索引擎读取。
- 满足前提：`Description = 产品详情图`，不重复 H1、关键描述和 Details。
- 不满足前提：**优先修复文本可见性/抓取性，可将文字放入可抓取的 Description，而不是机械追求“图片-only”。**
- 不得认为“文字越靠前，Google 就必然给更高排名”。布局主要为购买体验服务。
- 图片中嵌字不等于可访问的商品正文。

---

## 8. 图片、视频、ALT 与图集一致性

- 首图优先清楚展示顾客实际选择/买到的商品；套装主图不能暗示单品价买两件。
- 必须检查前后、近景、细节图是否同一款、同一色号、同一季节。
- 参考图、实售图、用户反馈图如混用，要明确其来源和用途，不能隐含官方拍摄或授权。
- `ALT` 描述**该张图片实际显示的视角**；没有背面图，就不输出 `Back View` ALT。
- 文字不堆关键词、不写供应商编号或猜测材质；可用 `[Product Name] — [Front/Back/Detail]`。
- 避免“ALT 都复制同一个长标题”导致无意义重复。
- 文件名旧词只能触发人工复核，**不能单凭文件名判断图片有误**。
- 检查加载、放大、顺序、Mobile 图片裁切、详情图尺寸和可点击性。

---

## 9. Product Schema / Merchant Listing / 评价真实度

### 9.1 最低身份一致性

`name / brand / category / color / image / sku(if any)` 与当前所售商品一致。

### 9.2 不能止步于“只有 4 个身份字段”

可购买的 PDP 要对照 Google Merchant Listing 的 `Product` + `Offer` 指南完善所需信息（例如 `image`、`offers.price`、`priceCurrency`、`availability`、`url`，按当前官方要求执行）；**只有 name/brand/color 的 JSON-LD，不算完整 Merchant Listing 验收通过**。

数据流应为：

```text
后台商品/变体数据（事实源）
→ PDP 可见名称/图片/价格/库存
→ JSON-LD Product/Offer
→ Google Rich Results Test
```

- `Offer.price` 与前台选中变体价格一致；不得把原版品牌官网价格套给 Drip 商品。
- `availability` 必须来自已验证的变体状态，不能静态硬编码全部 `InStock` 或 `OutOfStock`。
- 有多个真正的商品变体时依 Google `ProductGroup` 指南实现唯一 ID、可访问的直达预选变体 URL、恰当 Canonical；不可直接将套装和单件混成同款变体。
- 需要一个 URL 上多变体时，确保当前选择的真实数据更新，或用符合官方要求的变体方案；不要生成与 UI 脱节的 Offer。
- `shippingDetails` / `hasMerchantReturnPolicy` 应来自真实规则，并与用户所在地、订单政策一致。
- 不使用虚构 `review`、`aggregateRating`、`bestRating`、`reviewCount`；未经证实的 UGC-style drafts 不能作为真实用户评价 Schema。
- 使用官方 Rich Results Test + Search Console，正确区分“有效但有非严重问题”“无效”“可增强”；不保证 Google 一定展示富媒体结果。

### 9.3 不可直接发布的示意结构

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "REPLACE_WITH_EXACT_PRODUCT_NAME",
  "image": ["REPLACE_WITH_REAL_PRODUCT_IMAGE_URL"],
  "brand": { "@type": "Brand", "name": "REPLACE_WITH_REAL_BRAND" },
  "offers": {
    "@type": "Offer",
    "url": "REPLACE_WITH_LIVE_CANONICAL_URL",
    "priceCurrency": "USD",
    "price": "REPLACE_WITH_LIVE_VARIANT_PRICE",
    "availability": "REPLACE_WITH_VERIFIED_VARIANT_AVAILABILITY"
  }
}
```

**严禁带着 `REPLACE_*` 占位符上线。** 该模板说明字段类型，不代替平台实时的商品结构化数据。

---

## 10. 移动端、转化与交易准确性

### 10.1 必测断点

- 360px：小屏主战场；逐个检查主图、H1、价格、尺码、色彩、选项、Buy Now、关键描述。
- 768px：过渡断点；尤其关注可点击区域、表格与购物 CTA。
- Desktop：复查与手机字段一致性，但优先级 Mobile > PC。

### 10.2 页面必须让用户 10 秒内回答

```text
我买到的是上衣、裤子，还是整套？
图上的款式与选中的款式一致吗？
选择哪个尺码？
这一选择的实际售价是什么？
如何下单、退换、获取 QC？
```

若任何问题难以回答，标 `UX HOLD`。

### 10.3 促销、价格、评价一致性

- 不得出现 `$0.00 Save $-79.00` 之类错误省钱提示。
- 划线价须有合适、真实的比较依据；不能凭空构造“原价”制造折扣。
- 价格、币种、物流政策、赠品门槛不能前后矛盾。
- 已确认的 30-Day Returns 与 QC Photos 需要以当时适用的规则验证。
- 客户评价不能把未真实购买/收到的 UGC 文案展示成亲历评价。

---

## 11. 质量验收：P0 / P1 / P2

### P0 — 阻止发布

- 主图与产品实体、配色、类型、正反图案有关键冲突。
- 根据旧 URL/SKU 误把另一款当同款；跨商品/跨 set 复用 SKU。
- 标题是套装但默认选择单品，或付款购买对象与图片/描述不符。
- 尺码、价格、货币、变体库存关键错误；支付选项无效或误导。
- 不可访问目标页面、意外 noindex 或 canonical 指向完全不同商品。
- 虚构的真实评价、授权身份、重要交易承诺。

### P1 — 必修但可先形成草稿

- 关键描述未按 V5.0 布局，或者对搜索引擎不可读。
- Brand 内链无效、未能实时验证或大小写错误；必要属性缺失。Chanel 错用非 `/Chanel/` 路径必须修复。
- SEO Title/Meta/Schema 与经过验证的身份不一致。
- 新 URL 迁移计划缺 301/Canonical/内链/Sitemap 任一环节。
- 真实图片 ALT 与视角不对应；移动端文字或尺码表显示异常。

### P2 — 优化建议

- Meta 表述可更精炼；主图顺序与局部细节可改善。
- 非关键的重复措辞；合理的内部关联商品建议。
- 词语自然度、编辑一致性与可读性。

**执行逻辑：所有 P0 解决 → 处理 P1 → 再考虑 P2。禁止以 SEO 文案覆盖 P0。**

---

## 12. 执行状态、证据记录与“金丝雀”

### 12.1 四种状态

- `PASS`：准确身份、SKU（如果使用）、购买对象、SEO、技术与前台验收全部证实。
- `HOLD`：缺证据、有冲突、或必测环节尚未完成。
- `FAIL`：已证实的 P0 错误，需回滚或先修复。
- `PARTIAL PASS`：某些字段可交付，但不得声称整个 PDP 已发布验收通过。

### 12.2 审查记录最小字段

```text
Review ID / Date
Current URL
Displayed Product Name / H1
Visual Fingerprint (actual image evidence)
Candidate Names and Excluded Alternatives
Verified Exact Entity
Source URLs and What Each Source Proves
Verified Manufacturer Style Code (or omitted)
Drip Sellable Variant IDs / Type / Set Contents
Variant Interaction / Size / Price / Stock Evidence
Current URL / Proposed URL / Live Canonical
Changed Fields / Unchanged Fields
Mobile 360 / 768 Check
Schema / Rich Results Test
GSC URL Inspection status if available
P0/P1/P2 Issues
Final State / Reviewer / Evidence Timestamp
```

### 12.3 先一款，后批量

1. 用一款存在旧名或 SKU 高风险的商品做 **金丝雀**。
2. 经过完整 SOP、记录所有截图/证据、用户或负责人批准，才开放相同类目批量处理。
3. 批量处理必须先建立范围 URL 清单并冻结清单版本，逐条记录完成情况。
4. `覆盖率 = 已检查 URL 数 / 本批次范围 URL 数`。**批次 100% 覆盖并不等于全站 100%，更不等于 Google 100% 收录。**
5. 修复后重新抓取已发布页面，复查不存在回滚、301 回链或动态变体误配。
6. 重大改动记录前后对比，失败立即回滚。

---

## 13. 最终交付格式（面向运营执行）

### 13.1 只需修改字段（默认）

当用户提供一条 URL 让审核时：

> **只输出需要改的字段。已正确的 Product Name、H1、SKU、Slug、Canonical、Schema 等不重复。**

每个需修改字段均提供完整可复制的美式英语文案/HTML。对暂无法验证的字段标 `VERIFY/HOLD`，不得虚构答案。

### 13.2 全套 V5.0 输出（用户明确要求时）

```text
0. Status (PASS / HOLD / FAIL / PARTIAL PASS)
1. Exact Entity / Critical Evidence (short, sourced)
2. Product Name
3. H1
4. SEO Title
5. SEO Keywords (comma-separated; not a Google ranking signal)
6. Meta Description
7. Product Subtitle (only when change needed)
8. URL Slug（只输出 slug 本体；CURRENT LIVE URL 与 PROPOSED 分列）
9. Canonical (LIVE vs TARGET)
10. Key Description (one concise sentence + five Product Details)
11. Description (verified detail images only when crawlability precondition holds)
12. Image ALT (actual image-specific)
13. Product Schema (complete merchant listing implementation or explicitly marked template)
14. P0 blockers / publication checklist (only remaining actionable issues)
```

- 审计证据是内部 QA；用户要“直接上架内容”时，不输出冗长推理、否决掉的候选或研究过程。
- 来源证据必须有真实链接和它具体支持的事实；不能用不对应的引用包装确定性。
- 如果仅做草稿，则明确 `NOT PUBLISHED`；没有后台操作权限或真实执行记录，不得声称“已修改”。

---

## 14. 两个完整的纠错测试

### Test A: AMIRI 图片与旧 SKU 冲突

```text
CURRENT URL:
/AMIRI-Carpenter-Jean-Pink-Sand-AWDNGH1023-812

VISUAL FINGERPRINT:
Stone Indigo wash
Distressed knee cutouts
Pink tie-dye underlays
Pink AMIRI appliqué on front

MARKET ENTITY:
AMIRI Tie Dye Core Logo Skinny Jean Stone Indigo

REFERENCE STYLE CODE:
SS23MDS002-765

DECISION:
旧 SKU 不匹配实物 → 替换错误身份文字；保留经确认正确的实物图。
若当前销售库存与参考款尺寸或图片仍有冲突 → HOLD。
```

### Test B: Sp5der 购买实体冲突

```text
CURRENT PAGE TITLE:
Sp5der OG Web Suit Black

STYLE OPTIONS:
Hoodie / Pants / Suit

DEFAULT:
Hoodie

PROBLEM:
Title promises suit but default purchase may be a single hoodie.

DECISION:
P0. Separate product URLs preferred.
Otherwise correct the default selected identity + images + price + content.
Never copy hoodie or pants style code as a suit SKU.
```

---

## 15. 对抗性检查（Murphy's Law）

在发布前必须逐条问：

1. 有没有旧标题或旧 SKU 让我误以为它是这款？
2. 假如先只看图片，我会得到不同的商品名称吗？
3. 只有正面图的情况下，背面图案是否被我虚构？
4. 官方 SKU 是不是属于同颜色、同类型、同套装单位？
5. 顾客买到的是不是我在标题里承诺的件数？
6. 页面默认变体、价格、库存、Schema 是否一致？
7. 供应商尺码是否被错误换算成品牌官网尺码？
8. 是否有错图夹在详情图里，被文件名或 ALT 掩盖？
9. 是否把尚未发布的新 URL 当成正在运行的 Canonical？
10. 是否错误地从初始静态 `Sold Out` 推断真实缺货？
11. 是否把 AI 拟写的顾客评价当成真实购买评价？
12. 是否承诺 Google 一定收录，或者猜测修改会提升排名与销量？

有一个无法回答，标记该项 `VERIFY/HOLD`。

---

## 16. 可执行的通过条件（Final Gate）

```text
SEO-PDP V5.0 PASS
=
Visual Evidence PASS
AND Exact Entity PASS
AND Reference Style Code PASS (if used)
AND Sellable Product Type / Set Contents PASS
AND Size & Variant Purchase Consistency PASS
AND Image / ALT PASS
AND Product Name / H1 / SEO Title / Meta PASS
AND Key Description / 5 Product Details / Live-Verified Brand Link PASS
AND Chanel /Chanel/ Registry PASS (when applicable)
AND V4.6 SERP Meta Priority PASS
AND URL Slug-Only Format PASS
AND URL / Canonical / Redirect PASS (if migrated)
AND Rendered Text / Technical Indexability PASS
AND Product / Offer Structured Data PASS (where applicable)
AND Mobile 360 / 768 UX PASS
AND No P0 / Unresolved P1
```

**如果只完成文案，不完成前台及技术复核，最多为 `PARTIAL PASS`；不得将草稿说成发布成功。**

---

## 17. Google 官方资料（2026-10-21 核对）

- Title Link: https://developers.google.com/search/docs/appearance/title-link
- Meta description/snippets: https://developers.google.com/search/docs/appearance/snippet
- Google ignored meta keywords: https://developers.google.com/search/docs/crawling-indexing/special-tags
- Canonical/301/Sitemap: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Merchant Listing Product/Offer: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Product variants / ProductGroup: https://developers.google.com/search/docs/appearance/structured-data/product-variants
- Image SEO/ALT: https://developers.google.com/search/docs/appearance/google-images
- JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Review markup integrity: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- People-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content

> Google 官方文档用于技术规范；产品命名、Exact Entity、证据等级及内部批准流程属于 Drip Sneakers 自定的运营标准。两者不可混为一谈。

---

## 18. 终版原则（一页总结）

1. **先图后名**：真实图片是识别起点；同时需要外部对照，图片或图像搜索本身不是最终证据。
2. **先名后码**：旧 URL/旧 SKU 不代表实体；Manufacturer Style Code 只能属于同一件、同一配色、同一销售单位。
3. **先货后文案**：单品、套装、尺码、价格、库存、可购买状态必须真实一致。
4. **关键描述统一**：1 句自然语言 + 5 条高价值 Product Details + 真实 Brand 相对内链。
5. **媒体与正文各司其职**：详情图片优先，但关键文字必须可见、可被搜索引擎读取。
6. **SEO 不得伪装技术成功**：草稿 URL ≠ 已发布；Schema 片段 ≠ 完整 Merchant Listing；提交 Sitemap ≠ Google 已收录。
7. **先金丝雀后批量**：P0 解决、证据留痕、逐页复核、移动端优先。

**FINAL FORMULA：**

```text
准确实物
× 可证商品身份
× 实际购买一致性
× 正确内容位置
× 技术可检索性
× 发布验收证据
=
SEO-PDP V5.0 PASS
```

*文档结束。*


---

# 附录 A｜SEO-PDP V4.6 完整规范原文（兼容性基线）

> 来源：用户提供的 `Drip_Sneakers_SEO-PDP_V4.6_STANDARD_FINAL.md`。以下原文完整附入，不删改 V4.6 规则；SHA-256：`af2269fa5a3d93561bb671ec05a9eb40e3958ddc4f055d69a809c1769c30a016`。
> 若原文中“原 Product Schema 最低字段”与本 V5.0 的真实 Merchant Offer 验收并存，按新增的更严格门槛执行；不得借原文最低示例跳过 V5.0 验收。

# Drip Sneakers｜SEO-PDP V4.6 STANDARD — FINAL

## Version

Version: `4.6`  
Status: `FINAL`  
Scope: Drip Sneakers PDP SEO, Exact Entity Verification, SERP Decision, User Decision, Backend Field Placement, Verified Internal Linking, URL Slug Formatting

---

# 0. V4.6 Core Principle

SEO-PDP V4.6 is the consolidated execution standard for Drip Sneakers.

It inherits the V4.4 exact-entity, SKU, SERP-decision, backend-placement and three-pass audit system, and adds two execution hard rules introduced after V4.4:

```text
V4.5
→ URL Slug must be output as slug-only

V4.6
→ Brand/category internal links must be live-verified before use
→ Chanel brand/category internal link is fixed to /Chanel/
```

A qualified PDP must satisfy:

```text
Exact Product Entity
+
Verified Product Facts
+
Verified SKU when available
+
SERP Decision Clarity
+
Correct Backend Placement
+
Verified Internal Linking
+
Correct Slug-Only Output
+
Clear User Decision
+
Clean SEO Execution
```

Final rule:

> Search finds candidates.  
> Cross-verification decides the entity.  
> SEO starts only after the entity is locked.  
> SKU is never inferred from the Drip URL, supplier code, filename or listing ID.  
> Meta Description helps the search user decide whether to click.  
> Internal links are used only after the target page is verified.  
> URL Slug output is the slug only — never a path or full URL.  
> Verified information must appear where users can use it fastest.

---

# 1. V4.6 Upgrade Path

## V4.4 foundation

V4.4 remains fully valid for:

```text
Visual Fingerprint
Candidate Set
Source Priority
Exact Entity Comparison
Independent SKU Verification
Exact Match Hard Gate
Set / Bundle Identity
SEO Fields
SERP Decision Layer
Meta Description Fixed Composition
Purchase-Assurance Priority
Unsupported-Claim Guard
Backend Placement Layer
Key Description Composition Rule
Description Image-Only Rule
No Redundant Product-Name Repetition Rule
Above-the-Fold Decision Priority
Brand Internal Link
Three-Pass Audit
```

## V4.5 addition

V4.5 adds one backend-output formatting rule:

```text
URL Slug = slug only
```

Example:

```text
chanel-sneaker-ivory-silver-g45077-b13308-np518
```

Forbidden:

```text
/chanel-sneaker-ivory-silver-g45077-b13308-np518
https://www.dripsneakers.org/chanel-sneaker-ivory-silver-g45077-b13308-np518
chanel-sneaker-ivory-silver-g45077-b13308-np518/
```

## V4.6 addition

V4.6 adds a verified internal-link registry rule.

For Chanel:

```text
Brand: Chanel
Verified Category URL: https://www.dripsneakers.org/Chanel/
Required PDP Internal Link: /Chanel/
```

Required HTML:

```html
<li><strong>Brand:</strong> <a href="/Chanel/"><strong>Chanel</strong></a></li>
```

Hard rule:

```text
Do not guess a brand/category URL.
Do not invent /Chanel-Sneakers/, /chanel/, /Designer-Sneakers/ or another substitute.
For Chanel PDPs, use /Chanel/ only.
If an internal category path has not been live-verified, it must not be silently invented.
```

V4.6 does not replace the V4.4 content architecture. It consolidates the system and removes ambiguity for Agent execution.

---

# 2. Mandatory Execution Order

Every PDP must follow:

```text
1. Drip PDP Visual Fingerprint
2. High-Authority Source Search
3. Candidate Set
4. Exact Entity Comparison
5. SKU Verification
6. Exact Match Hard Gate
7. SEO-PDP Generation
8. Backend Placement
9. Three-Pass Final Audit
```

SEO fields must NOT be generated before Exact Entity PASS.

---

# 3. Source Priority

Use this hierarchy:

```text
Tier 1 — Brand Official / Authorized Retailer
Tier 2 — StockX
Tier 3 — GOAT
Tier 4 — Established Retailer with structured product data
Tier 5 — Vertical Independent Retailer / Competitor
Tier 6 — Marketplace Seller Listing
Tier 7 — Supplier Page / Supplier Catalog
Tier 8 — Image Recognition Only
```

Rules:

- Lower-tier sources may generate candidates.
- Lower-tier sources may not overrule a conflicting higher-tier exact match without stronger evidence.
- A retailer can be a strong product-information source without being an official brand website.
- Official/authorized status and product-data reliability are separate judgments.

---

# 4. Exact Entity Hard Gate

Exact Entity PASS requires:

```text
Current Product Visual Match
+
Market-Recognized Product Name Match
+
Product Type Match
+
Colorway Match
+
Graphic Match
+
Collaboration / Collection Match when applicable
+
SKU Match when available
+
Single Item / Set Match
```

If only visual similarity exists:

```text
CANDIDATE
```

If identity-critical evidence conflicts:

```text
HOLD
```

Do not write final SEO for a HOLD product.

---

# 5. Independent SKU Rule

SKU must belong to the same exact entity.

Acceptable SKU evidence:

```text
Brand official product page
Authorized retailer
StockX exact product page
GOAT exact product page
Established retailer with explicit SKU / Style Code
```

Do not use:

```text
Drip product ID
Supplier number
URL suffix
Image filename
Listing ID
Size
Generated code
```

Hard rule:

```text
Verified SKU exists
→ output SKU

Verified SKU does not exist
→ omit SKU completely
```

Forbidden:

```text
SKU: Not verified
SKU: Unknown
SKU: Pending
SKU: N/A
```

---

# 6. Product Naming Standard

Product Name must be the consumer-facing exact entity.

Structure:

```text
Brand
+
Collaboration / Collection when identity-critical
+
Model / Product Name
+
Product Type when needed
+
Variant / Colorway
```

Do not include:

```text
Supplier wording
Marketing filler
Internal codes
Unverified identifiers
```

H1:

```text
H1 = Product Name
```

Do not repeat SKU in H1 by default.

---

# 7. SEO Title

With verified SKU:

```text
Product Name + Verified SKU + Reps | Drip Sneakers
```

Without verified SKU:

```text
Product Name + Reps | Drip Sneakers
```

---

# 8. SEO Keywords

Keywords must be:

```text
Relevant
Specific
Product-focused
```

Formatting:

```text
Keyword 1, Keyword 2, Keyword 3, Keyword 4, Keyword 5
```

Use commas.

Recommended composition:

```text
1. Exact Product Name
2. Product-name variation
3. Colorway + Product Type
4. Verified SKU when available
5. High-intent category/product synonym
```

---

# 9. Meta Description — V4.6 SERP Decision Standard

## Purpose

Meta Description is a SERP decision block, not a shortened Product Description.

Its job is:

```text
Exact Product Recognition
+
Search-Intent Match
+
Purchase-Assurance Information
+
Click Decision
```

The user should be able to answer from the search result:

```text
Is this the exact product I searched for?
+
Is this the type of product I want?
+
What purchase assurances do I get if I click?
```

## Mandatory composition

When SKU is verified, default to:

```text
Shop [Exact Product Name] reps ([Verified SKU]) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

When no verified SKU exists:

```text
Shop [Exact Product Name] reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

The Exact Product Name must match the locked product entity used by H1, SEO Title and Schema.

## Information priority

Use Meta Description space in this order:

```text
1. Exact Product Name
2. Reps intent
3. Verified SKU when available
4. Drip Sneakers
5. QC photos
6. 30-day returns
7. 7–20 day shipping
8. Identity-critical product feature only when needed
```

Product features such as materials, laces, graphics, color details or decorative elements are normally lower priority because Key Description, Product Details, images and ALT already carry product-detail information.

## Identity-critical exception

A product feature may enter Meta Description only when removing it would materially weaken exact-product recognition.

Examples:

```text
Collaboration name
Collection name
Identity-critical graphic
Identity-critical variant
Official colorway term needed to distinguish close entities
```

Do not use ordinary feature stacking merely to fill Meta Description space.

## Unsupported-claim guard

Use only site-wide purchase information that is actually supported by the current Drip Sneakers policy and PDP experience.

Default approved wording for V4.6:

```text
QC photos
30-day returns
7–20 day shipping
```

Avoid stronger wording unless separately verified:

```text
real QC photos
guaranteed QC photos
guaranteed delivery
7–20 day delivery
authentic quality
1:1 guaranteed
best quality
```

Reason:

```text
"QC photos" states the available decision asset.
"30-day returns" states the return window.
"7–20 day shipping" states the shipping range without converting it into a delivery guarantee.
```

## Hard rules

```text
Exact entity first.
Do not use an old supplier or legacy product name after entity lock.
Use verified SKU only.
Do not replace purchase-assurance information with low-value feature stuffing.
Do not add unsupported trust claims.
Do not mechanically duplicate the Key Description sentence.
Do not sacrifice entity accuracy merely to force a character count.
```

## Reference implementation

Locked entity:

```text
Louis Vuitton LV Skate Sneaker Black Swarovski Monogram
```

Verified SKU:

```text
1ABMHV
```

V4.6 Meta Description:

```text
Shop Louis Vuitton LV Skate Sneaker Black Swarovski Monogram reps (1ABMHV) at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.
```

Rejected pattern:

```text
Shop Louis Vuitton LV Skate Sneaker Black Swarovski Monogram 1ABMHV reps in Black/Silver with Swarovski crystal detailing, rope laces and Monogram accents.
```

Why rejected:

```text
The product is identifiable, but scarce SERP space is consumed by secondary product details already handled elsewhere on the PDP.
Purchase-decision information is missing.
```

---

# 10. URL Slug / Canonical — V4.6 Hard Rule

## URL Slug

The backend `URL Slug` field must contain the slug only.

Preferred with verified SKU:

```text
product-name-colorway-sku
```

Preferred without verified SKU:

```text
product-name-colorway
```

Correct example:

```text
chanel-sneaker-ivory-silver-g45077-b13308-np518
```

Forbidden URL Slug output:

```text
/chanel-sneaker-ivory-silver-g45077-b13308-np518
https://www.dripsneakers.org/chanel-sneaker-ivory-silver-g45077-b13308-np518
chanel-sneaker-ivory-silver-g45077-b13308-np518/
```

Therefore:

```text
URL Slug
= slug only
= no leading /
= no domain
= no trailing /
```

Avoid:

```text
Top-Quality
Best-Quality
Internal IDs
Supplier numbers
Meaningless trailing hyphens
Unverified identifiers
```

## Canonical URL

Canonical is different from URL Slug.

Canonical must use the complete preferred final URL:

```text
https://www.dripsneakers.org/[slug]
```

Example:

```text
https://www.dripsneakers.org/chanel-sneaker-ivory-silver-g45077-b13308-np518
```

Hard rule:

```text
URL Slug = slug only
Canonical URL = full absolute URL
```

If the preferred slug changes from an existing indexed URL, preserve SEO equity with the appropriate redirect workflow in the site/backend rather than keeping an incorrect legacy slug as the canonical.

---

# 11. V4.6 Backend Placement Layer

This placement model is inherited unchanged from V4.3.

Drip Sneakers backend fields must be used as follows:

```text
Product Name / H1
        ↓
Price / Size / CTA
        ↓
KEY DESCRIPTION
        ├── One concise natural-language decision sentence
        └── Product Details — exactly 5 verified fields
                └── Brand field carries internal link
        ↓
DESCRIPTION
        └── Product detail images only
        ↓
Size Guide
Shipping / Returns
FAQ / Related Products
```

The semantic roles remain different, but they are physically placed together inside the Key Description field.

---

# 12. Key Description — Mandatory Composition

## Purpose

The Key Description is the primary text decision block closest to the purchase area.

It must answer:

```text
What is visually distinctive about this exact product?
What are the five attributes I need to verify before buying?
```

## Required composition

```text
1 concise natural-language sentence
+
Product Details with exactly 5 verified fields
```

HTML template:

```html
<p>
[One concise verified sentence describing the product's colorway and most distinctive front/back graphic or product-specific feature.]
</p>

<h2>Product Details</h2>

<ul>
<li><strong>Brand:</strong> <a href="[BRAND INTERNAL URL]"><strong>[Brand]</strong></a></li>
<li><strong>Product Type:</strong> [Product Type]</li>
<li><strong>Model:</strong> [Exact Model / Collection]</li>
<li><strong>Colorway:</strong> [Colorway]</li>
<li><strong>SKU or Product-Specific Fact:</strong> [Verified Value]</li>
</ul>
```

---

# 13. No Redundant Product-Name Repetition

If the full Exact Product Name already appears in:

```text
H1
SEO Title
URL
Product Details → Model
ALT
Schema
```

the Key Description must NOT mechanically repeat the full Product Name as another H2.

Do not default to:

```html
<h2>Hellstar Orange Sports Camo Core Logo T-Shirt Black</h2>
```

inside Key Description.

Instead use a natural sentence:

```html
<p>
This Hellstar T-shirt features a black colorway with an orange camo sports logo on the front and a circular flame graphic on the back.
</p>
```

Reason:

```text
H1 identifies the entity.
Key Description explains the visual distinction.
Product Details verifies the attributes.
```

Each element has a separate decision function.

---

# 14. Product Details — Semantic Role

Product Details remains the structured attribute layer; V4.6 retains the V4.3 rule that physically places it inside Key Description.

Purpose:

> Let the customer verify the exact product attributes quickly.

Default:

```text
Exactly 5 high-value verified fields
```

Priority:

```text
1. Brand
2. Product Type
3. Model / Collection / Collaboration
4. Colorway
5. SKU when verified
   OR one verified product-specific fact when SKU is unavailable
```

Never add weak information just to reach five fields.

If SKU is unavailable, omit SKU and use a verified product-specific fact.

---

# 15. Mandatory Verified Brand / Category Internal Link

The Brand row in Product Details must carry a **live-verified Drip Sneakers internal brand/category link**.

The Agent must not infer a category path from the brand name.

## Verification rule

Before writing the Brand internal link:

```text
1. Identify the intended Drip Sneakers category page.
2. Verify that the page is genuinely accessible.
3. Confirm that it represents the intended brand/category.
4. Use the verified internal path in the PDP.
5. If verification fails, do not invent a replacement path.
```

## Chanel — V4.6 fixed registry entry

Verified live page:

```text
https://www.dripsneakers.org/Chanel/
```

Required internal path:

```text
/Chanel/
```

Required HTML for every Chanel PDP:

```html
<li><strong>Brand:</strong> <a href="/Chanel/"><strong>Chanel</strong></a></li>
```

For Chanel, do not use:

```text
/Chanel-Sneakers/
/chanel/
/Chanel-Sneaker/
/Designer-Sneakers/
any guessed or semantically similar category path
```

Do not replace `/Chanel/` merely because another URL looks more descriptive.

## Other verified examples inherited from the standard

Hellstar example:

```html
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hellstar-T-Shirts/"><strong>Hellstar</strong></a></li>
```

Sp5der example:

```html
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Sp5der/"><strong>Sp5der</strong></a></li>
```

These are examples of the placement rule; an Agent must still use the currently verified live target when executing a new task.

## Formatting rules

```text
Use the actual brand name as anchor text.
Anchor text must be <strong>.
Do not use "click here".
Do not add a duplicate "Explore more [Brand]" sentence to Key Description.
Do not invent internal category URLs.
For Chanel, /Chanel/ is the fixed V4.6 path.
```

---

# 16. Description Field — Image-Only Rule

For the current Drip Sneakers backend architecture:

```text
DESCRIPTION = Product detail images
```

Do not duplicate:

```text
Product Name
Key Description sentence
Product Details
Brand navigation sentence
```

inside Description.

The Description field should carry the visual proof/detail gallery.

Every meaningful image should have accurate ALT text.

Example:

```text
Hellstar Orange Sports Camo Core Logo T-Shirt Black Front View
Hellstar Orange Sports Camo Core Logo T-Shirt Black Back View
Hellstar Orange Sports Camo Core Logo T-Shirt Black Graphic Detail
```

---

# 17. Crawlability Hard Gate

The V4.6 placement model is valid only if the Key Description field is rendered as normal visible HTML text on the PDP.

Required:

```text
Visible to users
Present in rendered HTML / DOM
Not baked into an image
Not hidden only inside an inaccessible script
Not loaded in a way that prevents normal crawling
```

If Key Description is not crawlable:

```text
V4.6 Backend Placement = NOT PASS
```

The text must then be moved to a crawlable product-information block.

---

# 18. Why Product Details Belongs Inside Key Description Physically

This is a placement decision, not a semantic merger.

Semantically:

```text
Key Description Sentence
= fast human understanding

Product Details
= structured attribute verification
```

Physically:

```text
Both belong near the purchase decision area
```

Therefore:

```text
KEY DESCRIPTION FIELD
=
Decision Sentence
+
Product Details
```

This reduces scrolling, avoids duplicate modules, and keeps the strongest entity information close to Price / Size / CTA.

---

# 19. PDP Description vs Backend "Description"

V4.6 retains the V4.3 terminology separation.

## Semantic PDP Description

This means:

```text
The concise natural-language decision sentence.
```

In the Drip Sneakers backend, it is stored inside:

```text
Key Description
```

## Backend Description field

This means:

```text
Product detail images only.
```

Do not confuse the semantic content role with the backend field name.

---

# 20. Product Schema

Schema must reflect the same locked entity.

Minimum:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Product Name]",
  "brand": {
    "@type": "Brand",
    "name": "[Brand]"
  },
  "category": "[Product Type]",
  "color": "[Colorway]"
}
```

If SKU is verified:

```json
"sku": "[Verified SKU]"
```

Otherwise omit `sku`.

---

# 21. Image ALT

Format:

```text
Product Name + View / Detail
```

ALT must match the actual image.

Do not use:

```text
Supplier wording
Fake
Replica
Marketing filler
```

---

# 22. User Decision Layer

Every final PDP must answer:

| Question | Required |
|---|---|
| Does the user need to guess what the product is? | NO |
| Does the user need to compare pages to identify it? | NO |
| Does the user need to leave the PDP to understand it? | NO |
| Does the user need to understand supplier terminology? | NO |

If any answer is YES:

```text
NOT PASS
```

---

# 23. V4.6 Three-Pass Audit

## Pass 1 — Exact Entity

Check:

```text
Brand
Exact Product Name
Product Type
Colorway
Front Graphic
Back Graphic
Collection / Collaboration
Single Item vs Set
```

Question:

> Is this the exact product, not a similar product?

## Pass 2 — Evidence / SKU

Check:

```text
Source hierarchy
Cross-source consistency
SKU belongs to same entity
No supplier ID used as SKU
No component SKU misused as set SKU
```

## Pass 3 — SEO + Placement + User Decision

Check:

```text
Product Name
H1
SEO Title
Keywords comma-separated
Meta Description exact entity
Meta Description verified SKU when available
Meta Description reps intent
Meta Description QC photos / 30-day returns / 7–20 day shipping
Meta Description unsupported-claim guard
URL Slug is slug-only
URL Slug has no leading slash
URL Slug has no domain
URL Slug has no trailing slash
Canonical is full absolute preferred URL
Key Description sentence
Exactly 5 Product Details fields
Brand internal link target is live-verified
Chanel PDP uses /Chanel/ only
Description image-only
Image ALT
Schema
Key Description crawlability
```

Only then:

```text
SEO-PDP V4.6 PASS
```

---

# 24. Current Hellstar Reference Implementation

Product Entity:

```text
Hellstar Orange Sports Camo Core Logo T-Shirt Black
```

## Key Description

```html
<p>
This Hellstar T-shirt features a black colorway with an orange camo sports logo on the front and a circular flame graphic on the back.
</p>

<h2>Product Details</h2>

<ul>
<li><strong>Brand:</strong> <a href="https://www.dripsneakers.org/Hellstar-T-Shirts/"><strong>Hellstar</strong></a></li>
<li><strong>Product Type:</strong> T-Shirt</li>
<li><strong>Model:</strong> Orange Sports Camo Core Logo T-Shirt</li>
<li><strong>Colorway:</strong> Black</li>
<li><strong>Graphic:</strong> Orange Camo Sports Logo / Circular Flame Back Graphic</li>
</ul>
```

## Description

```text
Product detail images only.
```

No duplicated H2 Product Name is required in the Key Description.

---


# 24A. V4.6 Agent Execution Contract

This document is intended to be executable by another AI Agent without relying on hidden memory.

The Agent must follow these non-negotiable rules:

```text
DO:
- Inspect the current Drip product and images.
- Search high-authority sources before deciding the entity.
- Cross-verify exact product identity.
- Verify SKU independently.
- Omit SKU completely when no independent exact-entity SKU evidence exists.
- Verify internal category links before using them.
- Use /Chanel/ for Chanel.
- Output URL Slug without a leading slash.
- Output Canonical as the complete absolute URL.
- Keep Product Details to exactly 5 fields.
- Put Product Details inside Key Description.
- Keep backend Description image-only.
- Output only the operational result after the audit passes.

DO NOT:
- Treat the current Drip URL suffix as SKU evidence.
- Treat supplier wording as the market-recognized product name.
- Guess a SKU.
- Guess a brand/category link.
- Replace /Chanel/ with a guessed Chanel URL.
- Put a leading slash in URL Slug.
- Put a full domain in URL Slug.
- Put text modules into backend Description.
- Generate final SEO for HOLD entities.
- Expose chain-of-thought or internal reasoning in the operational result.
```

If identity-critical evidence conflicts:

```text
HOLD
```

If the internal link cannot be verified:

```text
VERIFY / HOLD INTERNAL LINK
```

Do not fabricate a replacement.

---


# 24B. Chanel V4.6 Reference Implementation

Locked entity example:

```text
Chanel Sneaker Ivory Silver
```

Verified SKU example:

```text
G45077 B13308 NP518
```

URL Slug:

```text
chanel-sneaker-ivory-silver-g45077-b13308-np518
```

Canonical URL:

```text
https://www.dripsneakers.org/chanel-sneaker-ivory-silver-g45077-b13308-np518
```

Brand internal link:

```html
<li><strong>Brand:</strong> <a href="/Chanel/"><strong>Chanel</strong></a></li>
```

The following is invalid as `URL Slug`:

```text
/chanel-sneaker-ivory-silver-g45077-b13308-np518
```

The following Chanel category substitutions are invalid under V4.6 unless the standard is explicitly updated:

```text
/Chanel-Sneakers/
/chanel/
/Chanel-Sneaker/
/Designer-Sneakers/
```

---

# 25. Standard Final SEO-PDP Output Order

When generating a final PDP for backend execution, output only:

```text
1. Product Name
2. H1
3. SEO Title
4. SEO Keywords
5. Meta Description
6. URL Slug — slug only, no leading slash
7. Canonical URL — full absolute URL
8. Key Description
9. Description Rule / Image ALT when relevant
10. Product Schema
```

Product Details must already be embedded inside `Key Description`.

Do not output internal reasoning in the operational result.

---

# 26. V4.6 Final Gate

```text
SEO-PDP V4.6 PASS
=
Exact Entity PASS
+
Evidence PASS
+
SKU PASS when SKU exists
+
User Decision PASS
+
SEO Clean PASS
+
URL Slug Format PASS
+
Canonical PASS
+
SERP Decision PASS
+
Meta Description Assurance PASS
+
Key Description Placement PASS
+
5-Field Product Details PASS
+
Verified Brand Internal Link PASS
+
Chanel /Chanel/ Rule PASS when applicable
+
Description Image-Only PASS
+
Crawlability PASS
```

---

# 27. V4.6 Final Rules

> Do not optimize the wrong product.

> Candidate identification is not entity verification.

> Search finds candidates; cross-verification decides the entity.

> A single item and a set are different purchasing entities.

> Verified SKU is output; unverified SKU is omitted.

> The full Product Name does not need to be mechanically repeated inside Key Description.

> Key Description = one concise decision sentence + exactly five Product Details fields.

> Product Details is semantically an attribute layer but physically belongs inside the Key Description field.

> The Brand row carries the internal brand link.

> Backend Description = product detail images only.

> Images provide visual proof; Key Description provides fast understanding; Product Details provides structured verification.

> Meta Description is a SERP decision block, not a shortened Product Description.

> Default Meta Description priority = Exact Product + Reps + Verified SKU + QC Photos + 30-Day Returns + 7–20 Day Shipping.

> Secondary product features do not displace higher-value purchase-assurance information unless they are identity-critical.

> Use "shipping" for the 7–20 day range; do not turn it into a delivery guarantee without separate verification.

> Correct information in the wrong place is still a UX problem.

> URL Slug means slug only: no leading slash, no domain, no trailing slash.

> Canonical URL remains a complete absolute URL.

> Internal category links must be live-verified; never guess a category path.

> For Chanel PDPs, the brand/category internal link is `/Chanel/` only.

> SEO starts only after Exact Entity PASS.
