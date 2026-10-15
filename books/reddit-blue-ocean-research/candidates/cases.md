# 案例候选（Stage 1：Case Extractor）

> 仅收录作者实际用于说明方法的案例，不在本阶段筛选或改写为技能。公众号正文与飞书镜像均已独立读取并交叉核验。为避免形成原文替代品，本文件不保留直接引文。

```yaml
- id: c01
  title: 高互动 AI 视频生成器帖被判为红海
  type: case
  source_section: "一、先讲个案例：什么是蓝海 Reddit 帖子"
  source_locator: |
    公众号正文中 generativeAI 帖链接后的竞争判断段；
    飞书镜像 block_map 中包含同一 URL 与互动数据的文本块；
    Reddit URL: https://www.reddit.com/r/generativeAI/comments/1qrq2ks/hello_everyone_what_is_the_best_ai_video/
  source_quote: null
  summary: |
    作者从 Ahrefs 的 Reddit.com 美国 Top Pages 中查看标题含 AI 的页面，发现一个
    AI 视频生成器讨论帖已有 155 个 vote 和 255 条评论。作者据此认为，即使页面
    排名表现可观，新回复也容易淹没在大量既有评论中，不能把高搜索可见度直接等同
    于低竞争机会。
  bound_to:
    - "互动竞争初筛"
    - "高流量不等于蓝海"
    - "回复可见性风险"
  outcome: |
    该帖在作者的候选判断中被作为红海反例排除；文章没有报告实际发帖、点击或转化结果。
  tags: [case, counterexample, red-ocean, engagement, visibility]

- id: c02
  title: MagicSchool AI 帖被识别为低互动高流量候选
  type: case
  source_section: "一、先讲个案例：什么是蓝海 Reddit 帖子"
  source_locator: |
    公众号正文中 historyteachers 帖链接后的指标说明段；
    飞书镜像 block_map 中该 URL 及其后续 vote、comments、首评和流量文本块；
    Reddit URL: https://www.reddit.com/r/historyteachers/comments/1jo77qe/magic_school_ai_is_actually_useful_and_helps_cut/
  source_quote: null
  summary: |
    作者继续向下检查 Ahrefs 候选列表，找到一篇讨论 MagicSchool AI 的帖子。文章记录
    该帖有 7 个 vote、31 条评论，首条评论有 15 个 vote，并引用 Ahrefs 对其美国月度
    SEO 流量约 12,000 的估算。作者把它作为低互动、高外部搜索价值的正例，同时附加
    业务必须相关这一条件。
  bound_to:
    - "低互动与高外部流量联合筛选"
    - "三信号蓝海初筛"
    - "业务相关性门槛"
  outcome: |
    该帖被作者保留为蓝海示例；文章未提供后续回复存活、排名持续时间、品牌点击或转化数据。
  tags: [case, positive-example, blue-ocean, seo-traffic, business-fit]

- id: c03
  title: 用赚钱主题帖子演示业务场景匹配
  type: case
  source_section: "二、如何挖掘／1、逐个匹配 Reddit SEO Top Pages"
  source_locator: |
    公众号正文中 AI_Agents 帖 URL 所在段；
    飞书镜像 block_map 中包含同一 URL、主题释义及适配业务示例的文本块；
    Reddit URL: https://www.reddit.com/r/AI_Agents/comments/1ophwjj/how_do_you_actually_make_money_using_ai/
  source_quote: null
  summary: |
    作者用一篇讨论如何借助 AI 赚钱的帖子说明 Top Pages 候选不能只看页面指标，还要
    与自身产品场景逐一匹配。作者判断，AI 音乐视频或无真人出镜视频代理类产品能够
    与该问题建立自然关联，因此它可进入下一步验证。
  bound_to:
    - "Top Pages 正向发现"
    - "业务问题匹配"
    - "候选进入下一步验证"
  outcome: |
    该帖被作者判为业务可匹配的候选示例；文章没有披露其竞争数据、实际参与过程或转化结果。
  tags: [case, top-pages, relevance, commercial-context, candidate]
```

## 提取说明

- 文中的强弱商业意图查询只用于阐释分类，不具备具体页面、操作和结果，因此没有作为独立案例。
- SERP 长期排名、GEO 引用和上涨页面是发现方法或观察规则；文章未给出可定位的具体执行事件，因此没有伪装成案例。
- `c02` 暴露出一个值得下游验证的内部张力：作者先提出评论数应低于两位数，随后却以 31 条评论的帖子作为正例。此处如实保留，不在案例提取阶段替作者消解。
