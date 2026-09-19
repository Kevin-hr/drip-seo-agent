# P0-1 Root Cause Report

| 项 | 值 |
|---|---|
| 报告时间 | 2026-09-20 |
| 分支 | `feature/prada-p0-remediation` |
| 依据 | 22 个 Prada PDP 原始 HTML（2026-09-20，全部 HTTP 200）+ 2 个非 Prada 对照页 |
| 状态 | **仅调查，未修复**（按指令） |

---

## Problem

```text
22/22 Prada PDP 各出现两个 <h1>：
  <h1>Product Name</h1>       ← 正确
  <h1>How to Order</h1>       ← 违规（购买教程区块占用 H1）
```

V4.4 §11 要求 H1 等于 Product Name。第二个 H1 与商品无关，会稀释页面主题信号。

---

## Affected Pages

```text
Prada：22/22（2026-09-20 实测）
非 Prada 对照同样命中：
  Hellstar-Neuron-Tour-T-Shirt-Light-Blue          → [Hellstar Neuron Tour T-Shirt Light Blue, How to Order]
  Gucci-Cotton-Jersey-Printed-T-Shirt-Light-Grey   → [Gucci-Cotton Jersey Printed T-shirt 'Light Grey', How to Order]
```

→ **全站性问题**，不是 Prada 独有。

---

## Root Cause

第二个 H1 来自 **class 为 `drip-how-to-order` 的复用内容块**：

1. **自带内联 `<style>`，明确针对 `h1` 写样式**：

```css
.drip-how-to-order h1 { font-size: 20px; }
```

→ 作者**有意使用 `<h1>`**，再用 CSS 把字号压到 20px 来伪装视觉层级。
这是"用 CSS 掩盖语义错误"的典型模式：视觉像小节标题，语义仍是页面级 H1。

2. **位于商品描述渲染区内**，容器链：

```text
<section class="ds-pdp-description">
  <div class="page-section-content tab-description rich-text">
    ... <div class="drip-how-to-order"><h1>How to Order</h1> ... </div>
```

→ 它是**商品描述字段里存储的内容**，不是主题模板、不是组件、不是 App 注入。

3. 块内含 `Last Updated: August 14, 2026`，属**手工维护的内容片段**。

**结论**：一个被写入**商品描述字段**的可复用 HTML 片段，标题用错标签层级
（`<h1>` 应为 `<h2>`），并用内联 CSS 掩盖视觉差异；随描述内容出现在每个引用它的商品页。

---

## Affected Code Location

| 层 | 位置 | 性质 |
|---|---|---|
| 渲染容器 | `section.ds-pdp-description > div.page-section-content.tab-description.rich-text` | 主题模板（正常） |
| **缺陷源** | `div.drip-how-to-order > h1` + 内联 CSS `.drip-how-to-order h1{font-size:20px}` | **后台「商品描述」字段内容（TinyMCE editor[0]）** |
| 影响面 | 全站引用该片段的商品 | 存储型内容 |

```text
判定：不是 PDP 模板 / 主题 Section / 组件 / App 注入
     → 是「可复用内容片段（Reusable Content Block）」，存于商品描述字段
```

---

## Recommended Fix

**本条只给方案，不执行。**

```text
方案 A（推荐，最小改动）
  1 片段内：<h1>How to Order</h1> → <h2>How to Order</h2>
    内联 CSS：.drip-how-to-order h1{...} → .drip-how-to-order h2{...}
  2 若片段由共享源维护 → 改源即全站生效
    若已逐商品写入描述 → 需先统计引用范围，再批量替换
  3 改后核验：每页 <h1> 计数 = 1，且等于 Product Name

方案 B（不推荐）
  仅在前端用 JS 改标签 → 不解决语义源，爬虫读到的是渲染后 DOM，风险高
```

**附带发现（重要，需单独决策）**：

```text
V4.4 §16「Description Field — Image-Only Rule」要求商品描述只放图片。
drip-how-to-order 是纯文本/HTML 块，位于描述字段内 → 它的存在本身就违反 §16。
因此"把 h1 改成 h2"只是止血；根治方案是把该块移出描述字段
（例如移入主题 Section 或独立内容位），使描述回归图片专属。
```

---

## Risk

| # | 风险 | 等级 | 说明 |
|---|---|---|---|
| 1 | **批量替换会大面积改动商品描述字段** | 高 | 该块可能存在于数百个商品；逐商品写描述属大批量写操作，必须先统计范围、小批试点、逐款回读 |
| 2 | 样式回退 | 中 | 只改标签不改 CSS 会导致字号失控；`.drip-how-to-order h1` 必须同步改为 `h2` |
| 3 | 与其他执行方冲突 | 高 | 已检测到其他进程正在使用同一后台 profile；批量写必须在其空闲时进行 |
| 4 | 描述字段语义违规未解 | 中 | 见上文附带发现；仅改标签不解决 §16 违规 |
| 5 | 改后未核验导致重复 H1 残留 | 中 | 必须逐页复检 `<h1>` 计数，不能只凭保存回执 |

---

## 建议的前置动作（修复前必做）

```text
1  统计引用范围：全站商品描述中含 "drip-how-to-order" 的商品数量
   （可用后台 queryList 拉全量索引后逐款读描述，或用前台抽样估算）
2  确认该片段是否有共享维护源（有则改源，成本骤降）
3  确认后台 profile 空闲后再执行
4  先改 1 款 → 前台核验 h1 计数 = 1 且样式正常 → 再批量
```
