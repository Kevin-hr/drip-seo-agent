---
id: knowledge.brands.prada.successful-case
kind: case-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:prada]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - audit/2026-09-02T14-30-31+08-00-prada-78/identity-audit.json
  - audit/2026-09-02T14-30-31+08-00-prada-78/manifest.json
  - audit/2026-09-02T14-30-31+08-00-prada-78/operations.jsonl
  - shipping-audit/raw_products.json (2026-09-15)
  - deliverables/PRADA-78-END-TO-END-AI-EXECUTION-GUIDE.md
---

# Prada 成功案例（knowledge/brands/prada/successful-case.md）

```text
Case Name:
  Prada America's Cup Patent Leather Sneakers Grey White —
  从"破碎旧页"到"双分类合规页"的单品改造

Input:
  Product ID      : 536027476120336
  source_key      : Prada Americas Cup Patent Grey White
  改造前标题      : Prada Off-White Gray
  改造前 URL      : https://www.dripsneakers.org/-Prada-Off-White-Gray
                  （前导连字符、无品牌前缀、无配色语义）
  源图            : 本地文件夹 "Prada Americas Cup Patent Grey White"
                    manifest 记录 expected_image_count = 12
  状态            : 未发布（2026-09-02 时）

Problem:
  1. 商品名 "Prada Off-White Gray" 不是官方商品名，配色描述与官方配色名（Grey White）不一致
  2. URL 以连字符开头，属结构性破损，无法作为 canonical 的稳定载体
  3. 无分类归属确认前，34 个 Cup 商品必须同时进入两个分类，此商品是否合规未知
  4. 该 run 全部 9 个现有公开 Prada PDP 的审计结果为
       pdp_3_0_pass_count = 0
       update_required_count = 9
       观测版本 {3.3: 8, missing: 1}
     即：线上存量页没有一个是合规的

Verification:
  1. 视觉同一性：公开图 "536027476120336-prada-off-white-gray.jpg"
     ↔ 本地图 "Prada Americas Cup Patent Grey White\01_main_cover.jpg"
     结果 color_mae = 0，dhash_distance = 0  →  确认是同一张图
  2. 源目录去重：文件夹级 SHA-256 内容签名
     →  exact_duplicate_folder_count = 0
  3. 视觉近邻：78 文件夹 → 120 组 64-bit dHash 候选近邻对
     →  deletion_decision = "none"（只记录，不删除）
  4. 命名：America's Cup 系列走公式
     Prada America's Cup {descriptor} {colorway}
     descriptor = Patent Leather Sneakers
     colorway   = Grey White
  5. 分类：America's Cup → 必须同时归属 Prada + Prada America's Cup Sneakers

Solution:
  1. 用公式重写商品名为
       Prada America's Cup Patent Leather Sneakers Grey White
  2. 复用已证实的同源现图（dHash=0 / MAE=0），不重复上传
  3. 分类同时挂 Prada 与 Prada America's Cup Sneakers
     （线上还保留了平台全局分类 NEW CLOTHING）
  4. 发布 + 后台回读 + 公开页可访问性确认
  5. 记录幂等键 source_key，禁止重做

Final Result:
  商品 ID     : 536027476120336
  最终商品名  : Prada America's Cup Patent Leather Sneakers Grey White
  最终 URL    : https://www.dripsneakers.org/Prada-Americas-Cup-Patent-Leather-Sneakers-Grey-White
  分类        : Prada  +  Prada America's Cup Sneakers  (+ NEW CLOTHING)
  图片        : manifest expected_image_count = 12
  状态        : 已发布，公开页可访问，breadcrumb 归属 Prada
  存量审计    : 该商品原为 update_required_count = 9 之一；
                改造后成为 3 个达标 Cup 分类商品之一
                （536027438481428 / 536027476120336 / 536027558902041）

  必须同时披露的限制：
  - SKU 记录为 DS-PRA-010（internal_catalog）。按现行 V4.4，
    内部码属 Internal ID，不得作为对外 SKU。因此本案例
    **不可作为"SKU 已核验"的样板**，只能作为"身份 + 命名 + 分类 + 图源"的样板。
  - 本地没有任何证据表明该页面通过了 3.0 或 V4.4 的线上 PDP 校验。
    manifest 的 valid=true 只证明 manifest 自身合法，不证明线上页面合规。
  - 本地未保存该页的图片张数回读产物，故线上实际图片数**无证据**。

Reusable Rule:
  R1  破损的既有 URL（前导连字符 / 无品牌前缀 / 配色语义缺失）是 V4.4 §10 的
      合法迁移触发条件；应重写而非保留。
  R2  "公开图 dHash=0 且 颜色 MAE=0" 可作为复用现图的充分条件，
      免去重复上传，同时保留视觉同一性证据。
  R3  America's Cup 这类"系列 + 构造 + 配色"三段式命名必须由公式驱动，
      不得人工即兴命名。
  R4  多分类商品必须验证"必须同时包含"的集合关系，
      不能用平台全局分类（NEW CLOTHING）替代目标分类。
  R5  manifest 里的 published=true 是目标值，不是事实值；
      引用线上状态必须来自抓取产物或后台回读。
  R6  内部目录码（DS-PRA-xxx）在 V4.4 下必须改走 SKU_OMIT。
```

---

## 关联文件

```text
完整叙事版          : cases/prada-success-case.md
命名规则            : knowledge/brands/prada/brand-rules.md
SKU 模式            : knowledge/brands/prada/sku-pattern.md
通用 SKU 裁决规则   : core/sku-validation.md
```
