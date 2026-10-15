# Framework Candidates

> Stage 1 原始候选：仅提取，不筛选。定位以飞书公开镜像的结构化 block ID 为准，并以公众号同名原文作来源交叉核验。为避免复刻原文，本文件不收录直接引文。

```yaml
- id: f01
  title: 真实问题驱动的内容增长闭环
  type: framework
  source_section: 导言
  source_locator: >-
    公众号同名原文导言；飞书镜像 blocks
    doxcnjgtKZvi0QxzKjD37ooukPg、doxcn0JVm62be5a5Zexbp264qpb、
    doxcnVUPF4ZRqqaUQKKPUF41sNg
  source_quote: ""
  summary: |
    先定位目标用户正在公开讨论的真实问题，再围绕该问题参与内容建设，
    最后让讨论页承接搜索引擎与生成式搜索的持续分发。推理顺序是
    “问题存在 → 内容匹配 → SEO/GEO 外部分发”，而不是从品牌广告出发寻找投放位置。
  tags: [demand-first, content-strategy, seo, geo, reddit]

- id: f02
  title: 流量—拥挤度—业务匹配三维机会判断
  type: framework
  source_section: 一、先讲个案例：什么是蓝海 Reddit 帖子
  source_locator: >-
    公众号同名原文第一节；飞书镜像 blocks
    doxcnlL8zHtpDp8hNWdcVelZHqh 至 doxcnGftZStHKhjNLrnsln0G6nb，
    尤其 doxcnAeSdfcleM8lmkXH07XvOxc、doxcnFSMqbhGxkE7mCdgZohZeIf、
    doxcnGftZStHKhjNLrnsln0G6nb
  source_quote: ""
  summary: |
    评价机会不能只看页面流量，也不能只看社区互动。先用 vote 与 comments
    估计参与拥挤度，再用自然搜索流量估计外部价值，并以是否匹配自身业务作最终门槛。
    高流量但评论拥挤的页面会稀释单条回复的可见性；低互动若没有流量或业务相关性，
    同样不是有效机会。
  tags: [opportunity-assessment, competition, traffic, business-fit, decision-matrix]

- id: f03
  title: 正向 Top Pages 与反向 SERP 的双向发现
  type: framework
  source_section: 二、如何挖掘
  source_locator: >-
    公众号同名原文第二节第 1、2 点；飞书镜像 blocks
    doxcniYh8WXzuFbah2pIH8q9yLh、doxcnYQoHlxnEC4yXkWU5dLxXdg、
    doxcnO40WxHUiBtZz2yfUOVswHf、doxcnDYNaOYPJJzAYAjzymFNmre
  source_quote: ""
  summary: |
    用两个相反入口减少发现盲区：正向路径从 Reddit 已获得自然流量的页面集合出发，
    逐页匹配业务；反向路径从业务关键词的搜索结果出发，记录借助 Reddit 域名进入前列的页面。
    前者从已有页面找相关需求，后者从已有需求找承载页面，二者交叉形成候选池。
  tags: [discovery, bidirectional-search, top-pages, serp, candidate-generation]

- id: f04
  title: GEO 引用与竞品足迹的信源反查
  type: framework
  source_section: 二、如何挖掘
  source_locator: >-
    公众号同名原文第二节第 3 点；飞书镜像 blocks
    doxcnAejUGdYFvZuY3oXpjrFyRf、doxcnSFZKoVDm6P3bsezN2vShTc
  source_quote: ""
  summary: |
    先从生成式搜索监控中找到竞品被引用的 Reddit 信源，用引用频率作为内容价值线索；
    再通过站点限定检索观察竞品近期在哪些讨论中建设内容；最后回到帖子层检查竞争度。
    这是“引用结果 → 竞品行为 → 进入难度”的反向推理链。
  tags: [geo, citation-analysis, competitor-research, source-tracing, triangulation]

- id: f05
  title: 从结果快照转向增长动量的机会时机判断
  type: framework
  source_section: 二、如何挖掘
  source_locator: >-
    公众号同名原文第二节第 4 点；飞书镜像 blocks
    doxcng1uuaVMa0XL1kQfBTNFImh 至 doxcnirxBDZiGyc4XaJLG9uTVTb，
    尤其 doxcnpJW23RI35dOxNVmG53alLd、doxcneyRdio6PBzHdtY8AAe7Myg
  source_quote: ""
  summary: |
    把 Top Pages 视为滞后结果，不把当前绝对流量当作唯一依据；进一步检查页面是否在近
    30/60/90 天新获排名，以及排名关键词数量是否连续增长。通过增长动量识别尚未被旧页面
    锁定的早期机会，完成“看存量结果 → 找增量变化 → 判断进入时机”的转换。
  tags: [trend, momentum, leading-indicator, timing, growth-detection]

- id: f06
  title: 商业意图门控的机会优先级
  type: framework
  source_section: 三、小结
  source_locator: >-
    公众号同名原文第三节；飞书镜像 blocks
    doxcnx7JAwFXY4Ia0NTCTMDxkWg、doxcnk9haJ0ozSF3Ow4wpEIdxef 至
    doxcnUyAxWQgfeRxVxKVoVGjkmh
  source_quote: ""
  summary: |
    候选页面即使有流量，也要经过搜索意图与商业场景的门控。先区分纯信息消费和接近决策的
    查询，再优先处理选型、替代、比较、评价及明确问题解决类讨论。决策顺序是
    “发现页面 → 判定意图 → 对齐商业场景 → 排定建设优先级”，避免把流量误当成转化价值。
  tags: [commercial-intent, prioritization, conversion, query-classification, decision-gate]
```
