---
id: core.quality-check
kind: checklist
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - dripops/src/DripOps/Rules/V44/V44Validator.cs
  - dripops/src/DripOps/Rules/V44/V44FrontendAuditor.cs
  - standards/agent/AGENT_CONTRACT_V2.0.md #13
  - reports/WORKFLOW_E2E_REPORT.md
---

# 质量检查（core/quality-check.md）

## 1. 草稿层校验码（V44Validator，ERROR 阻断 / WARN 不阻断）

```text
PRODUCT-01   Product Name 为空
NAME-S1/G1/D1 Product Name 含 supplier 词 / gender-sizing 词 / 禁用域名
H1-01        H1 必须严格等于 Product Name

SKU-01       VERIFIED_SKU 但草稿无 SKU
SKU-02       SEO Title 未含已验证 SKU
SKU-03       SKU_OMIT 但草稿泄露标识符（\b536\d{12}\b 或 \b\d{12,}\b）

EVID-01      缺 decision_note
EVID-02      evidence 为空

SEO-01       SEO Title 不符模板
SEO-02       有 SKU 但 Title 中 SKU 整词出现次数 != 1

KW-01        关键词 != 5 个
KW-02        关键词重复
KW-S1/G1/D1  关键词含禁用词

META-01      Meta 不符 §9 模板
META-02      Meta 含 §9 禁用声明
META-03      Meta 缺必需购买保障（QC photos / 30-day returns / 7–20 day shipping）
META-S1/G1/D1

URL-01       slug 违反小写 ASCII（既有未改动 slug 降级 WARN）
URL-02       需迁移但缺 redirectFrom
URL-03       Canonical != origin + slug

KD-01        Key Description 为空
KD-02        缺 <h2>Product Details</h2>
KD-03        <li> 数量 != 5
KD-04        Brand 行不是带 <strong> 的真实内链
KD-05        Brand 链接不指向 Drip 站点
KD-06        锚文本不含真实品牌名
KD-07        完整 Product Name 被重复为标题
KD-08        缺 >= 20 字符的 <p> 决策句

ALT-01(WARN)  快照无图未生成 ALT
ALT-02(WARN)  ALT 过于通用
ALT-S1/G1/D1

DESC-01      Backend Description 含 <h1|h2|h3|ul|ol>

SCH-01       Schema 非法 JSON
SCH-02       缺 name / brand / category / color
SCH-03       有 sku 但未验证
SCH-04       已验证 SKU 但 Schema 省略 sku
```

---

## 2. 前端审计码（V44FrontendAuditor.Audit(html, draft)）

```text
FE-01  NOINDEX                         HTML 含 noindex
FE-02  PRODUCT_DETAILS_MISSING         渲染 HTML 无 <h2>Product Details</h2>
FE-03  PRODUCT_DETAILS_LIST_MISSING    找不到 Product Details 列表
FE-04  PRODUCT_DETAILS_COUNT           <li> 数 != 5
FE-05  BRAND_LINK_MISSING              Brand 行无可爬取 Drip 内链（匹配 dripsneakers.org）
FE-06  DECISION_SENTENCE_NOT_FOUND(WARN) 找不到 >= 20 字符的 <p> 决策句
FE-07  NO_IMAGES(WARN)                 无 <img>
FE-08  IMAGE_ALT_MISSING               有图缺 alt
FE-09  FORBIDDEN_TERM                  渲染 HTML 含 §6 禁用词（整词匹配）
FE-10  CANONICAL_MISMATCH              页面 canonical != 草稿 CanonicalUrl
```

说明：本审计 **supplements — does not replace** 既有 `FrontendVerifier`（HTTP 状态、H1、meta、canonical、noindex、JSON-LD）。

---

## 3. 预发布检查（Agent Contract §13，8 项）

```text
[ ] Frontend URL = 200
[ ] Canonical correct
[ ] Schema correct
[ ] Product Name correct
[ ] Images loaded
[ ] ALT matches images
[ ] Description correct
[ ] SEO fields updated
```

任一失败 → `ROLLBACK`。

---

## 4. 交付前自检清单（Agent 逐项打勾，缺一不可）

### 4.1 身份与证据

```text
[ ] entity_status 最终为 PASS（且经过 CANDIDATE → VERIFY）
[ ] exact_entity 的 brand / model / product_type / colorway 四项非空
[ ] evidence 数组非空，且每条含 tier / source_name / url / exact_entity_match
[ ] 官方配色有 tier <= 4 且 exact_entity_match = true 的证据
[ ] conflicts 数组为空（VERIFIED_SKU / SKU_OMIT 路径）
[ ] decision_note 非空
```

### 4.2 SKU

```text
[ ] verdict ∈ {VERIFIED_SKU, SKU_OMIT}
[ ] VERIFIED_SKU → SKU 非空且与证据逐字一致
[ ] SKU_OMIT → sku = null，对外字段与 Schema 完全无 SKU 痕迹
[ ] 草稿中不存在 536\d{12} 或 \d{12,} 形态的标识符泄漏
```

### 4.3 SEO 产物

```text
[ ] H1 == Product Name
[ ] SEO Title 符合有/无 SKU 模板；有 SKU 时整词出现恰好 1 次
[ ] Keywords 恰好 5 个且互不重复
[ ] Meta 符合 §9 模板，含 QC photos / 30-day returns / 7–20 day shipping，且无禁用短语
[ ] slug 符合 ^[a-z0-9]+(?:-[a-z0-9]+)*$
[ ] Canonical == https://www.dripsneakers.org/<slug>
[ ] Key Description：1 句决策句（>= 20 字符）+ 1 个 <h2>Product Details</h2> + 恰好 5 个 <li>
[ ] Brand 行为真实可爬取的 Drip 内链，锚文本为真实品牌名
[ ] Description 仅含图片（无标题/列表标签）
[ ] 每张图有非通用 alt
[ ] Schema 合法 JSON，含 name / brand / category / color，sku 与裁决一致
[ ] HTML 版本标记为 data-standard="4.4"
[ ] 无 §6 禁用词
```

### 4.4 写入与验证

```text
[ ] plan 已创建且 immutable，validation_status = PASS
[ ] execute 前 8 道守卫全部通过
[ ] apply 后后台回读一致（标题 / 图片数 / PDP 标记 / 分类）
[ ] 前台 HTTP 200
[ ] 前台 canonical / Schema / DOM 与草稿一致
[ ] Key Description 在 rendered DOM 中可见且可爬取
[ ] 分类归属正确（含多分类商品的全部目标分类）
```

### 4.5 记录

```text
[ ] products/<ProductID>.json 的 stage 已更新为终态
[ ] events.jsonl 已追加事件
[ ] PROGRESS.md 已更新（每完成一个商品立刻更新）
[ ] BLOCKED.md 已随交付（空也要写"无"）
[ ] 每个 HOLD / BLOCKED 都有原因与证据
```

---

## 5. 端到端验证套件（已知可运行基线）

| 套件 | 基线结果 | 出处 |
|---|---|---|
| `dotnet build` | 0 warnings, 0 errors | `STATUS.md` |
| `DripOps self-test` | ok | `STATUS.md` |
| `npm run typecheck`（mcp-plugin） | pass | `STATUS.md` |
| `npm test`（mcp-plugin） | 36 / 36 | `STATUS.md` |
| `npm run check-package` | PASS | `STATUS.md` |
| `tests/bridge-acceptance.mjs` | 54 / 54 | `STATUS.md` |
| `tests/e2e-mcp.mjs` | 30 / 30 | `STATUS.md` |
| `tests/p0-remediation.mjs` | 17 / 17 | `STATUS.md` |
| `tests/workflow-e2e.mjs` | 74 / 74 | `STATUS.md` / `reports/WORKFLOW_E2E_REPORT.md` |
| `tests/v2-contract.mjs` | 18 / 18 report-only；20 / 20 enforcing | `STATUS.md` |
| `tests/pre-write-gate.mjs` | **NO-GO**（rollback score 70 / 100，阈值 90） | `STATUS.md` |
| `tests/verify-ssrf.mjs` | 自 `b503d47` 起不可运行 | `STATUS.md` |

```text
RULE-ID: QC-E2E-01
IF 声称交付完成
THEN 必须贴出实际命令输出，不接受"已完成"三个字
OUTPUT PASS
```

---

## 5.1 标准锁定的哈希校验必须做换行符归一（实测发现的运行隐患）

### 5.1.0 本节的适用边界（2026-09-19 补注，先读这条）

```text
本节记录的隐患，在 b2505b2 之后**只对未被 .gitattributes 覆盖的文件成立**。
活动标准 standards/V4.4/..._STANDARD_FINAL.md 已被强制 text eol=lf，
其原始字节哈希 == LF 哈希 == 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7，不再有偏差。
仍未被覆盖的只有 standards/agent/AGENT_CONTRACT_V2.0.md（见 §5.1.4）。
```

下面的实测数据是在 2026-09-19 修复前，对**当时的活动标准**
（`_CLEAN_CONSOLIDATED_2026-09-17.md`，现已移入 `standards/_superseded/`）采集的，
保留作为该隐患的原始证据。

### 5.1.1 现象

在本仓库（Windows，`core.autocrlf = true`）实测：

```text
standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
  工作区原始字节 SHA-256 = 1d19f59edcd3239e354eeaeca44de6fe07fe097a1fcb0c345cb453660f4cbd0c
  内容 LF 归一后 SHA-256 = 5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8  ← 与仓库锁定值一致

standards/agent/AGENT_CONTRACT_V2.0.md
  工作区原始字节 SHA-256 = 1742194bda0398f3e0ac89c39887e9ac7b724027bb686c9355ed279241d75271
  内容 LF 归一后 SHA-256 = 2bdeb72f2ca1edb1691141005bb413248eedbd8eecf078ada60d4e747551a1da  ← 与 STATUS.md 锁定值一致
```

文件统计：标准 24703 字节 / CR=1136 / LF=1136（即全部为 CRLF，无 BOM）。

### 5.1.2 为什么这是隐患

```text
V44Standard.Load()     在哈希不匹配时抛异常、拒绝启动
mcp-plugin/src/standard.ts
  STANDARD_EXPECTED_SHA256 不匹配时 throw
execute_product_v44 守卫 6  plan.standard_hash 与当前标准不一致 → 409 standard_hash_changed
```

即：如果任何一侧按**原始字节**计算哈希，在一台 `autocrlf=true` 的 Windows 机器上就会得到
`1d19f59edcd3239e354eeaeca44de6fe07fe097a1fcb0c345cb453660f4cbd0c`，
与锁定值 `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8` 不符
→ **标准被判定为"已变更"，整条流水线拒绝启动或拒绝执行。**

> 本文件中的哈希一律写全，不使用省略号截断。截断后的哈希不可复制、不可校验，属于机器可读性缺陷。

```text
RULE-ID: QC-HASH-01
IF 校验标准 / 契约的 SHA-256
THEN 必须先对内容做换行符归一（CRLF → LF），再计算哈希
     不得直接对工作区原始字节计算
OUTPUT PASS

RULE-ID: QC-HASH-02
IF 哈希不匹配但文件在 git 中处于 clean 状态
THEN 先怀疑换行符差异（.gitattributes / core.autocrlf），再怀疑标准被改
     归一后仍不匹配才判定为"标准已变更"
OUTPUT VERIFY
```

### 5.1.3 复现命令

```powershell
$p = 'standards\V4.4\Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md'
$b = [System.IO.File]::ReadAllBytes($p)
$l = [System.Collections.Generic.List[byte]]::new()
for ($i=0; $i -lt $b.Length; $i++) {
  if ($b[$i] -eq 13 -and ($i+1) -lt $b.Length -and $b[$i+1] -eq 10) { continue }
  $l.Add($b[$i])
}
$sha = [System.Security.Cryptography.SHA256]::Create()
(($sha.ComputeHash($l.ToArray())) | ForEach-Object { $_.ToString('x2') }) -join ''
# 期望输出 5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8
```

```text
RULE-ID: QC-HASH-03
IF 需要向他人证明"标准未被篡改"
THEN 必须同时给出原始字节哈希与归一后哈希，并说明二者差异来自换行符
OUTPUT PASS
```

### 5.1.4 上游已落地的缓解措施（2026-09-19，b2505b2）

提交 `d61189ce build: preserve V4.4 standard byte identity` 新增 `.gitattributes`，
对全部 SHA-256 锁定文件强制 `text eol=lf`：

```text
standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md                text eol=lf
dripops/standards/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md             text eol=lf
mcp-plugin/rules/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md              text eol=lf
mcp-plugin/skills/drip-seo-executor/references/...STANDARD_FINAL.md        text eol=lf
standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md text eol=lf
```

实测结果（在 b2505b2 的检出中）：

```text
standards/V4.4/...STANDARD_FINAL.md            CR=0   raw == lf == 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
standards/_superseded/...CLEAN_CONSOLIDATED.md CR=0   raw == lf == 5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8
standards/agent/AGENT_CONTRACT_V2.0.md         CR=844 raw=6b97a78b361f6e372d5997814765fb0ce4cb6db95369bb3075281c36b36ec9bb  lf=bfec9800151c96f039dd8cced7a038b2ae5e46a509dd425f4b9321e42a7bc7ac  ← 未被覆盖
```

```text
RULE-ID: QC-HASH-04
IF 校验的文件在 .gitattributes 的 eol=lf 清单内
THEN 原始字节哈希即为权威哈希，无需归一
OUTPUT PASS

RULE-ID: QC-HASH-05
IF 校验的文件**不在** eol=lf 清单内（当前为 standards/agent/AGENT_CONTRACT_V2.0.md）
THEN 必须先做 LF 归一，并同时报告两种哈希
OUTPUT VERIFY
```

> 待人工确认的遗留问题：`STATUS.md` 仍把 Agent Contract 记为 `2bdeb72f2ca1edb1691141005bb413248eedbd8eecf078ada60d4e747551a1da`，
> 但该文件已被 b2505b2 修改，LF 哈希为 `bfec9800151c96f039dd8cced7a038b2ae5e46a509dd425f4b9321e42a7bc7ac`。三处不一致，未归一。

---

## 6. 当前未通过项（不得声称已验证）

```text
[ ] 写路径（live write）尚未验证 — 从未在生产做过一次真实写入
[ ] 首次实盘执行 NO-GO — 阻断于 reports/PRE_WRITE_REVIEW_GATE.md
[ ] 后台会话一度过期 — 现场读取失败直到 DripOps Chrome profile 重新登录
[ ] §7 逐维度实体匹配裁决尚未落地（目前只有 colorway 与 SKU 有显式证据门禁；
    brand / model / product_type / collection / graphic 仍隐式包含在 entity 中）
```

```text
RULE-ID: QC-CLAIM-01
IF 你没有实际运行过某验证
THEN 不得声称它通过
OUTPUT HOLD
```
