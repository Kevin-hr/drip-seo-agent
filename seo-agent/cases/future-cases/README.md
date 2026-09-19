---
id: cases.future-cases.readme
kind: index
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: all-products
evidence_basis: []
---

# future-cases/ — 新案例的落盘约定

## 0. 这个目录存在的原因

v1.0 收录的三个案例（Prada / T-Shirts / Nike-Jordan）都是**事后考古**得来的：
它们原本散落在 `audit/`、`dripops/handoff/`、`.sandbox/state/runs/`、根目录的
`PROGRESS.md` 里，靠人肉翻找才拼出来。

`future-cases/` 的目的是：**让下一个案例在发生的当下就被写成可复用知识，而不是事后再考古。**

---

## 1. 文件命名约定

```text
future-cases/<YYYY-MM-DD>-<brand-or-category>-<short-id>.md

真实可用的例子：
  2026-10-01-balenciaga-track-v44.md
  2026-10-05-moncler-maya-v44.md
  2026-10-12-tshirts-30-final-v44.md
```

```text
RULE-ID: FC-NAME-01
IF 新建案例文件
THEN 文件名必须同时含日期、品牌或类目、以及能区分 run 的短标识
OUTPUT PASS
```

---

## 2. 必备内容（缺一不可）

```text
[ ] front-matter（见 _CASE_TEMPLATE.md）
[ ] Input          —— 真实 ProductID / run ID / 冻结名单来源
[ ] Problem        —— 当时发现的真实问题，不是想象中的问题
[ ] Verification   —— 用了什么证据、什么工具、什么阈值
[ ] Solution       —— 实际执行的动作序列
[ ] Final Result   —— 真实计数（完成 / HOLD / BLOCKED / UNPROCESSED），恒等式必须成立
[ ] Reusable Rule  —— 抽象出的规则，每条都要能写成 IF/THEN/OUTPUT
[ ] 未解决项        —— 未修复、未验证、待确认的一切
[ ] 三层验收证据    —— V4.4 PASS + 后台回读 + 前台 200 的原始输出
```

---

## 3. 三条硬纪律

```text
RULE-ID: FC-01
IF 案例中出现的任何数字
THEN 必须能定位到具体文件与行，或具体命令输出
OUTPUT PASS

RULE-ID: FC-02
IF 案例未做反向验证（红→绿）
THEN 必须在"未解决项"里明确写出这一点
OUTPUT HOLD

RULE-ID: FC-03
IF 案例只做了文档 / 只跑到 Ready
THEN 必须显式声明"未进入执行层"，不得用"已完成"措辞
OUTPUT HOLD
```

---

## 4. 案例与知识包的分工

```text
cases/           是"发生了什么"的全记录（叙事 + 证据 + 计数）
knowledge/       是"以后怎么做"的规则（IF/THEN/OUTPUT）

写完 cases/ 后，必须把其中可复用的部分上提：
  品牌相关   → knowledge/brands/<brand>/
  类目相关   → knowledge/categories/<category>/
  跨品牌通用 → core/
  新技能     → registry.md
```

```text
RULE-ID: FC-04
IF 案例里出现了新的、可复用的判定规则
THEN 必须同时上提到 core/ 或 knowledge/，并更新 registry.md
     案例文件本身不是规则的权威位置
OUTPUT PASS
```

---

## 5. 现存案例（作为写作范本）

| 案例 | 文件 | 类型 | 诚实度说明 |
|---|---|---|---|
| Prada 78 | `cases/prada-success-case.md` | 部分成功 | 明确写"实际上传 0/78" |
| T-Shirts 30 | `cases/tshirts-v4.4-case.md` | 未完成 | 明确写"目标未完成，V4.4 验证 0" |
| Hellstar | `knowledge/categories/hoodies/successful-case.md` | 跑到 Ready 即停 | 明确写"0 款发布" |
| Nike/Jordan | `knowledge/brands/nike/successful-case.md` | 成功 | 101/106 发布，附 3 条强制披露 |

```text
写作范本首选：knowledge/brands/nike/successful-case.md
理由：它有真正的成功（101 款上线）+ 真正的披露（标准文件不一致、
      Description 未改、未经 MCP Bridge 通道），是"既给信心又给边界"的写法。
```
