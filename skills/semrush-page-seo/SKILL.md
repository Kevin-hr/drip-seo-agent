---
name: semrush-page-seo
description: 用真实 Semrush 数据、SERP 和官方 GSC 基线优化一个真实商品或落地页，生成可追溯选词、修改稿与分步验收报告。适用于 StockxJersey 等独立站的实际页面 SEO；也可离线回放既有证据，不把回放称为实时查询。
metadata:
  version: "1.0.0"
---

# 单页 SEO 实操与证据工作流

把真实商品、搜索需求和可验证页面修改连起来。每步报告实际动作、事实来源、结果和 HOLD；不以生成 skill、低 KD 或修改稿代替上线与获客结果。

## 使用入口

- **复用本机已有第三方入口与登录会话**：先读 [入口与会话复用](references/session-reuse.md)，不默认切换到 Semrush 官网重新登录。会话有效性必须现场读取验证。

- **执行新的实站任务**：先读 [实站操作](references/live-workflow.md)。目标 URL、真实商品用途、目标市场和本次权限决定范围。默认先准备可审核修改；用户已授权发布时，在权限与备份满足后完成保存和回读，不重复索取授权。
- **复盘已有记录**：运行 `scripts/workflow.py replay`。保留原采集时间，输出明确标记 `LOCAL_REPLAY`，不进行浏览器、网络或后台写入。
- **查询官方 GSC 基线**：读 [脚本与数据契约](references/script-contract.md)，运行 `scripts/official_gsc.mjs`。复用已授权凭据，不创建登录或扩大权限。

```powershell
python "$env:USERPROFILE/.codex/skills/semrush-page-seo/scripts/workflow.py" --help
node "$env:USERPROFILE/.codex/skills/semrush-page-seo/scripts/official_gsc.mjs" --help
```

## 必须保留的判断

1. **先验真**：真实商品与入口 → 模板/可抓取性 → 真实需求。HTTP、初始 HTML、浏览器渲染和 Google 保存的检查状态分别记录；Google 能渲染 JS，初始 HTML 缺正文不等于无法索引。
2. **浏览器验收**：能列标签不代表能操作。用受支持浏览器工具读取当前页面，输入、提交一个查询并读回结果。调用超时先观察是否已生效；站点访问被拒绝则停止该动作，不用 Cookie、后台 API 或另一控制方式绕过。
3. **选词验收**：记录国家、语言、设备、采集时间、工具指标更新时间和证据。实际 SERP 与商品相关性优先；缺 SERP 只给候选。KD 缺失不当成 0；广告竞争不当自然 KD；全球量不与国家量相加；同义词量不相加当独立流量池；尖峰趋势不能推断稳定需求。
4. **页面契约**：一个现有 URL 聚焦一个主意图，少量同义词自然覆盖；不为词序变化复制页面或更换 URL。准确保留版本、年份与定制条件，官方合作不证明本店 SKU 获官方授权。meta keywords 不作为 Google 排名优化目标。
5. **GSC 验收**：只使用官方 API。以 `firstIncompleteDate` 排除未完成日，记录实际窗口、时区、国家/设备过滤和 HTTP 结果；空查询明细不等于零流量。0 曝光时的 position=0 没有排名含义。URL Inspection 读取保存状态，不执行实时测试，也没有普通商品页“请求收录”写入接口。
6. **上线验收**：准备稿 → 核对真实后台记录 → 完整备份 → 保存并回读 → 公开页面字段/购买路径验证。脚本只记录证据，不自动操作 CMS。缺权限、备份、保存回读或线上验证时，不报完成；未收录的原因不得猜成某个单一因素。
7. **成效验收**：代码/文案检查、Google 收录、曝光点击和真实成交分别报告。没有优化后窗口就没有本轮效果结论；不承诺排名、立即流量或收入。

## 输出

脚本输出规范词表、`decision.json` 和 `REPORT.md`；实站执行另附 SERP、GSC、字段修改、备份/保存回读/线上验证及截图证据。只有完整证据支持时才升级对应阶段，其他标 HOLD。

原始证据不改写，输出到新的运行目录。Cookie、代理访问参数、OAuth token、客户私有经营记录不进入 skill、测试夹具、日志或可分享产物。新脚本首次执行须看 `--help`；本地回放通过不代表登录、实时查询、上线或业务效果通过。
