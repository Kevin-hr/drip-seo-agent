# Stage 1.5 — 三重验证结果

> 候选框架与原则已去重。只有同时通过 V1 跨语境、V2 预测力和 V3 独特性的单元才进入技能构造。

## v01 — 多路径 Reddit 候选发现

```yaml
id: v01
title: 多路径 Reddit 候选发现
type: framework
merged_from: [f03, f04, f05, p05, p06, p07]
V1_cross_domain:
  passed: true
  evidence:
    - 正向对象：从 Reddit SEO Top Pages 逐页匹配业务
    - 反向对象：从业务关键词 SERP 回查 Reddit URL
    - 引用对象：从 GEO 引用和竞品足迹反查信源
    - 时间对象：从新增排名和关键词增长寻找上涨页面
V2_predictive_power:
  passed: true
  novel_question: "没有完整 Ahrefs 导出时，如何继续为球鞋业务建立可审计候选池？"
  derived_answer: "先用业务 SERP、site:reddit.com 查询、竞品足迹和公开排名变化建立候选；把缺失的 URL 级流量与关键词数标成待验证，而不是停止发现或编造数据。"
V3_exclusivity:
  passed: true
  why_not_common: "独特性不在单个搜索技巧，而在把页面结果、用户查询、AI 引用、竞品行为和增长动量作为互补入口，并明确每条路径只负责发现、不负责最终确认。"
decision: 进入阶段 2
```

## v02 — Reddit 蓝海机会门

```yaml
id: v02
title: Reddit 蓝海机会门
type: decision-framework
merged_from: [f02, f06, p02, p04, p08, ce01, ce04]
V1_cross_domain:
  passed: true
  evidence:
    - 红海案例：高搜索可见度与高评论拥挤同时存在，因此被排除
    - 蓝海案例：低互动、高估算搜索流量与业务相关性共同出现，因此被保留
    - 意图案例：选型查询与泛经验讨论被赋予不同商业优先级
V2_predictive_power:
  passed: true
  novel_question: "一个帖子 0 vote、约 20 条评论且 Google 首页有排名，但 URL 级月流量和当前评论数尚未复核，能否确认蓝海？"
  derived_answer: "只能标记为高潜候选；竞争和搜索可见性已有线索，但外部需求、当前状态与证据新鲜度没有闭环，不能升级为已确认。"
V3_exclusivity:
  passed: true
  why_not_common: "它不是一般的流量或关键词评分，而是把 Reddit 内部拥挤度、页面外部 SEO/GEO 价值、商业意图和业务匹配放在同一硬门中；任何单维漂亮数据都不能替代其余维度。"
decision: 进入阶段 2
```

## 验证结论

- 原始框架与原则候选共 14 条，去重后形成 7 个方法单元。
- 2 个通过全部验证，进入阶段 2。
- 5 个未作为独立技能通过；其中有价值的部分被并入通过单元或保留为边界、案例和术语。
- 通过率：28.6%，位于方法论文本常见的 30% 左右区间，未出现“全部都值得成 skill”的宽松筛选。
