---
id: cases.future-cases.template
kind: template
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
evidence_basis: []
usage: 复制本文件为 future-cases/<YYYY-MM-DD>-<brand-or-category>-<short-id>.md 后填写
---

# {案例名称}（案例模板）

> 使用说明：把本文件复制出去，重命名，逐段填写。
> 带 `[]` 的段落必须填；不适用时写"不适用 + 原因"，**不得留空**。

---

```yaml
---
id: cases.<YYYY-MM-DD>-<brand-or-category>-<short-id>
kind: case-record
version: 1.0.0
status: ACTIVE                 # ACTIVE | DRAFT
schema: agent-readable-v1
applies_to: [brand:<x>, category:<y>]
evidence_status: VERIFIED_CASE_AVAILABLE   # 或 PARTIAL | NO_EVIDENCE
source_standard: standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
source_standard_sha256: 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
evidence_basis:
  - <文件路径 1>
  - <文件路径 2>
---
```

---

## 0. 一句话结论

```text
[] 这个案例是成功 / 部分成功 / 未完成 / 失败？
[] 真实完成计数是多少？
[] 有没有进入执行层（写后台 + 回读 + 前台验证）？
```

---

## 1. Case

```text
Case Name:
  []

Input:
  Run ID           : []
  ProductID 范围    : []
  冻结名单来源      : []
  标准文件 + sha256 : []
  店铺 / 分类       : []
  目标             : []
  让步顺序          : []

Problem:
  []   ← 只写当时真实发现的问题，不写想象中的问题

Verification:
  []   ← 用了什么证据 / 什么工具 / 什么阈值；
         必须包含"反向验证（红→绿）"的实际输出位置；
         未做则在此明说"未做反向验证"

Solution:
  []   ← 实际执行的动作序列，按时间顺序

Final Result:
  完成（PUBLISHED / VERIFIED） : []
  HOLD                        : []
  BLOCKED                     : []
  UNPROCESSED                 : []
  恒等式校验                   : [] + [] + [] = [] ✓
  随机抽查                     : [] 款 / 通过 [] 款
  证据位置                     : []

Reusable Rule:
  R1  []
  R2  []
  R3  []
  ← 每条都必须能改写成 IF / THEN / OUTPUT 三行
```

---

## 2. 三层验收证据（原始输出）

```text
Layer 1  V4.4 PASS
  命令 / 工具 : []
  原始输出    : []

Layer 2  后台 readback
  核验项      : 标题 / 图片数 / PDP 标记 / 分类
  原始输出    : []

Layer 3  前台 storefront
  HTTP        : []
  Title       : []
  Canonical   : []
  H1          : []
  H2 唯一性    : []
  恰好 5 个 li : []
  Brand 内链   : []
  版本标记     : data-standard="4.4"
```

> 凡未实际运行的层，写"未执行"并说明原因。**不得写"应该没问题"。**

---

## 3. 未解决项（必填）

```text
[ ] 未修复的缺陷        : []
[ ] 未验证的假设        : []
[ ] 未归一的差异        : []   ← 例如标准文件 hash 不一致
[ ] 未完成的反向验证    : []
[ ] 已知的遗留偏差      : []   ← 例如 Description 字段未改
[ ] 会话 / 环境类问题    : []
```

---

## 4. 强制披露（必填）

```text
[] 本次执行使用的标准文件是否与本仓库锁定文件一致？
   一致 / 不一致（写出两侧 sha256）

[] 是否经过 MCP Bridge 通道（prepare → execute → verify）？
   是 / 否（若否，说明它不能作为 Bridge 写路径已验证的证据）

[] 是否有任何一处"声称完成但实际未回读"？
   无 / 有（列出）

[] 是否有 0 字节文件被误当成有效产物？
   无 / 有（列出）

[] 是否有任何 HOLD / BLOCKED 缺少原因？
   无 / 有（列出）
```

```text
RULE-ID: FC-TPL-01
IF 本段任一项为"有"且未列出明细
THEN 该案例文件不得合入
OUTPUT HOLD
```

---

## 5. 上提清单（把规则搬到权威位置）

```text
[ ] 品牌相关规则    → knowledge/brands/<brand>/     已完成 / 未完成
[ ] 类目相关规则    → knowledge/categories/<cat>/   已完成 / 未完成
[ ] 跨品牌通用规则  → core/                        已完成 / 未完成
[ ] 新技能          → registry.md                  已完成 / 未完成
```

```text
RULE-ID: FC-TPL-02
IF 本段有"未完成"项
THEN 案例文件自身不构成完整交付
OUTPUT VERIFY
```
