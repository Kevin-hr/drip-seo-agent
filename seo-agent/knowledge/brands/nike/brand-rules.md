---
id: knowledge.brands.nike.brand-rules
kind: knowledge-pack
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:nike, brand:jordan, category:sneakers]
evidence_status: VERIFIED_CASE_AVAILABLE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - PROGRESS.md (Run ID air-jordan-1-106-2026-09-18)
  - FINAL-REPORT.md (同名 run)
  - BLOCKED.md (同名 run)
  - air-jordan-1-baseline.json / .csv
  - deliverables/AIR-JORDAN-1-270-SEO-PDP-3.2-AI-EXECUTION-GUIDE.md
---

# Nike / Jordan 品牌规则（knowledge/brands/nike/brand-rules.md）

## 0. 为什么这个品牌包最值钱

Nike / Jordan 是目前**唯一一个把 V4.4 标准真正跑成批量的品牌**：

```text
106 冻结 → 101 PUBLISHED（V4.4 PASS + readback PASS + storefront 200）
           4 HOLD
           1 BLOCKED
           0 UNPROCESSED
随机抽查 24 款 → 24 PASS / 0 FAIL
```

这条记录证明了 V4.4 在真实后台、真实前台、真实批量规模下是可执行的。

---

## 1. 命名规则

### 1.1 观察到的规范骨架（描述性归纳，非标准条款）

```text
Air Jordan {代次} {Retro} {High|Mid|Low} {OG} {Colorway}
```

真实样例（逐字取自 `FINAL-REPORT.md` 的最终名称列）：

```text
Air Jordan 1 Retro High OG Taxi
Air Jordan 1 Retro High OG Black Toe
Air Jordan 1 Retro High OG UNC
Air Jordan 1 Retro High OG Shadow 2.0
Air Jordan 1 High OG Shattered Backboard 3.0
Air Jordan 1 Low Dark Concord
Air Jordan 1 Mid Bred Toe
Air Jordan 11 Retro Cool Grey
Air Jordan 14 Retro Flint Grey
Travis Scott x Air Jordan 1 Low Olive
Air Jordan 1 Mid PS Chicago (Kids)
```

```text
RULE-ID: NKE-NAME-01
IF 代次 >= 2 且为复古款
THEN 保留 "Retro"（不得省略）
OUTPUT PASS

RULE-ID: NKE-NAME-02
IF 属于联名款
THEN 联名方必须前置："<Collaborator> x Air Jordan ..."，且联名方必须可核实
OUTPUT PASS

RULE-ID: NKE-NAME-03
IF 属于童款（PS / GS / TD）
THEN 名称追加 " (Kids)"，slug 追加 "-kids"
OUTPUT PASS

RULE-ID: NKE-NAME-04
IF 名称中含供应商批次标记（如 "(DM Batch)"、纯数字后缀）
THEN 必须剥离（真实实例：Air Jordan 1 Shadow 2.0 Black Light Smoke Grey (DM Batch) → Air Jordan 1 Shadow 2.0 Black Light Smoke Grey）
OUTPUT PASS

RULE-ID: NKE-NAME-05
IF 名称中含引号包裹的标语（如 "NOT FOR RESALE"）
THEN 去引号保留语义（Air Jordan 1 High OG NRG NOT FOR RESALE Varsity Red）
OUTPUT PASS
```

### 1.2 真实的"补 OG"修正（V4.4 命名纠偏）

| 原名称 | 最终名称 | 修正类型 |
|---|---|---|
| Air Jordan 1 Retro High Electro Orange | Air Jordan 1 Retro High **OG** Electro Orange | 补 OG |
| Air Jordan 1 Retro UNC | Air Jordan 1 Retro **High OG** UNC | 补 High OG |
| Air Jordan 1 Retro High Shadow 2.0 | Air Jordan 1 Retro High **OG** Shadow 2.0 | 补 OG |
| Air Jordan 1 Retro High Blue Moon | Air Jordan 1 Retro High **OG** Blue Moon | 补 OG |
| Air Jordan 1 Low Light Arctic Orange **Pink** | Air Jordan 1 Low Light Arctic Orange | 去多余配色词 |
| Air Jordan 1 High OG **Court Purple White** | Air Jordan 1 High OG Court Purple White | 保留（无需改） |

```text
RULE-ID: NKE-NAME-06
IF "Retro High" 后缺 "OG" 而该配色确实是 OG 款
THEN 补 "OG" 后再生成
OUTPUT PASS
```

---

## 2. 范围纪律（这个品牌最容易出事的地方）

```text
事实：搜索词 "Air Jordan 1" 的后台结果里包含 AJ11 / AJ14 等非 AJ1 商品。
处理：严格以"搜索结果的 106 条"为冻结范围，不自行删减、不自行扩容。
```

```text
RULE-ID: NKE-SCP-01
IF 搜索结果的商品与搜索词不完全匹配
THEN 以搜索结果全集为冻结范围，逐条按自身身份核验，不得因为"不是 AJ1"而擅自剔除
OUTPUT PASS

RULE-ID: NKE-SCP-02
IF 冻结名单确定后
THEN 名单不得中途变更；剩余项写入 run.json 的 resume.next_ids
OUTPUT PASS
```

---

## 3. 分页与读取

```text
DOM 列表 15 条/页  →  8 页（不可靠）
改用后台 API：POST /biz/DTB_proProduct/queryList
分页 50 + 50 + 6 = 106，无遗漏
过滤条件示例：{ IsShow: false, Name: "Air Jordan 1" }
```

```text
RULE-ID: NKE-READ-01
IF 需要读取商品列表
THEN 走 API 分页，不依赖 DOM 逐页翻找
OUTPUT PASS

RULE-ID: NKE-READ-02
IF 列表读取失败但商品仍需处理
THEN 记录 BLOCKED，不得用截图或估算代替列表
OUTPUT HOLD
```

---

## 4. HOLD 判定实例（本品牌包最有教育意义的部分）

| 症状 | 判定 | 依据 |
|---|---|---|
| 后台名 `Air Jordan 1 Retro High OG Bleached Coral`，主图无 Bleached Coral 特征 | HOLD | 配色冲突 |
| `liv X Air Jordan 1 High Grey`（"liv X" 不可核实） | HOLD | 联名方无法确认 |
| `Air Jordan 1 Low tenis`（供应商口语） | HOLD | 无配色/联名信息 |
| 与另一商品同名同配色且 slug 相同 | HOLD | 疑似重复 |
| 后台保存 2 次无 DTO 响应 | BLOCKED | 技术故障（非身份问题） |

```text
RULE-ID: NKE-HOLD-01
IF 供应商口语出现在名称中（如 "tenis"、"reps"、"1:1"）
THEN 不改写为非官方语义，按身份不足处理
OUTPUT HOLD
```

---

## 5. 未修复项（必须随知识包传递）

```text
[ ] Description（Content）字段未修改：任务"只允许修改"清单未包含该字段，
    其内仍含旧 dripsneakers.net 链接与供应商文案，属 V4.4 §16 的遗留偏差。
[ ] 未修改分类、价格、原价、库存、尺码/规格、优惠、图片主体。
[ ] 后台"保存无响应"故障共出现 2 款（1 款 BLOCKED，1 款经查为 slug 冲突转 HOLD）。
[ ] 本次 run 使用的标准文件与活动标准**是同一份**（2026-09-19 复核后已消解疑点）
      used : inputs/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
             sha256 965314CDB899BFDDAAFD25D6E083BFF6861663C38A7860F553BE7E4B34D3E5B7
      active: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
             sha256 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
      依据 : docs/architecture/DECISION_LOG.md #008（2026-09-19）
      说明 : 第一版把它报成"与仓库锁定文件不一致"，是因为当时对照的是已被 #008 取代的
             _CLEAN_CONSOLIDATED（5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8）。该结论已更正。
```

---

## 6. 可用性自检

```text
Q1 这个品牌的命名骨架能复用到 Air Jordan 其他代次吗？
A  能。骨架是 <代次> + Retro + <High|Mid|Low> + [OG] + Colorway，
   代次与高低帮替换即可；但"是否该补 OG"必须逐款核验。

Q2 这个品牌的经验能直接搬到 Dior 吗？
A  只有"范围纪律 + API 分页 + 双层验证 + HOLD 判定方式"能搬；
   命名骨架与 SKU 格式必须替换（见 knowledge/brands/dior/）。
```
