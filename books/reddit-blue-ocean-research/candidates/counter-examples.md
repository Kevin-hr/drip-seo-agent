# Counter-example Candidates

> Stage 1 原始候选：只提取文章明确警告或直接对比出的失败模式，不在本阶段筛选。为避免复刻原文，本文件不收录直接引文。

```yaml
- id: ce01
  title: 把高流量热门帖误当成可进入机会
  type: counter-example
  source_section: 一、先讲个案例：什么是蓝海 Reddit 帖子
  source_locator: generativeAI 帖的 155 vote、255 comments 对比段
  source_quote: ""
  failure_mode: 页面已有搜索曝光，但既有回复高度拥挤，新回复很难获得可见位置。
  mechanism: 作者以评论拥挤度解释进入困难；“评论越多越难被看到”是文章经验判断，并非已验证因果。
  warning_signs: [评论数量远高于同题帖子, 高流量但缺少回复位置分析, 只看页面排名]
  bound_to: [流量—拥挤度—业务匹配三维机会判断]
  tags: [red-ocean, visibility, traffic-bias]

- id: ce02
  title: 把短暂 SERP 曝光误当成持续流量
  type: counter-example
  source_section: 二、如何挖掘／从 SERP 反向挖掘
  source_locator: 短期首页露出与长期排名页面的对比段
  source_quote: ""
  failure_mode: 依据单次搜索结果快照投入内容，页面热度消退后无法持续获得自然流量。
  mechanism: 排名具有波动性；作者主张用持续在榜时间区分短期热度与长期入口。
  warning_signs: [只有单日排名截图, 没有历史排名曲线, 帖子依赖短期新闻热度]
  bound_to: [正向 Top Pages 与反向 SERP 的双向发现, 增长动量判断]
  tags: [serp, volatility, durability]

- id: ce03
  title: 只看 Top Pages 静态结果
  type: counter-example
  source_section: 二、如何挖掘／找正在上涨的帖子
  source_locator: Top Pages 属于结果、应继续寻找新增排名和关键词增长页面的段落
  source_quote: ""
  failure_mode: 只追逐已形成流量的老页面，错过尚在增长、竞争窗口未完全关闭的新页面。
  mechanism: 作者把当前流量视为滞后指标，把新增排名和关键词增长视为更早的机会信号。
  warning_signs: [没有 30/60/90 天变化数据, 候选全部是老页面, 只按当前流量排序]
  bound_to: [从结果快照转向增长动量的机会时机判断]
  tags: [snapshot-bias, momentum, timing]

- id: ce04
  title: 把信息消费流量误当成商业流量
  type: counter-example
  source_section: 三、小结
  source_locator: 强商业意图与泛经验讨论的对比列表
  source_quote: ""
  failure_mode: 页面有访问量，但用户并未处于选型、比较、评价或解决明确问题的阶段，品牌参与难以形成转化。
  mechanism: 作者用查询措辞区分决策型需求与泛讨论；实际转化关系仍需业务数据验证。
  warning_signs: [查询只表达好奇或经历分享, 与产品购买路径无连接, 用流量代替意图判断]
  bound_to: [商业意图门控的机会优先级]
  tags: [intent, conversion, vanity-metric]

- id: ce05
  title: 从硬广告出发寻找投放位置
  type: counter-example
  source_section: 导言
  source_locator: 先找真实讨论问题、再让内容服务 SEO/GEO 的行动主张
  source_quote: ""
  failure_mode: 先准备品牌广告，再寻找可以塞入广告的讨论，导致内容与问题脱节。
  mechanism: 作者明确把真实用户问题放在品牌内容之前；关于删帖与信任损失的机制是证据约束下的合理推断。
  warning_signs: [回复以品牌为中心, 没有回答楼主问题, 候选选择只看能否放链接]
  bound_to: [真实问题驱动的内容增长闭环]
  tags: [hard-sell, relevance, native-participation]
```
