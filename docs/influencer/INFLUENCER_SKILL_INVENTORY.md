# 找网红与判断网红 Skill 清单

## 当前项目的正式入口

| Skill | 平台 | 职责 | 状态 |
|---|---|---|---|
| `find-influencers` | TikTok、Instagram Reels、YouTube Shorts | 每日发现、两路线分类、去重、增量证据 | 已创建并通过校验 |
| `evaluate-influencers` | 跨平台 | 最近 10 条审核、R1–R6 红灯、红黄绿合作建议 | 已创建并通过校验 |

两者位于仓库 `.agents/skills/`，调用同一套 `influencer-intelligence` CLI。找网红只产生待审核候选；判断网红才决定是否合作。

## 可复用的旧 TikTok 能力

| Skill / 项目 | 可复用部分 | 限制 |
|---|---|---|
| `.claude/skills/tiktok-hashtag-scraper` | XHR hashtag 广扫、帖子和作者聚合 | 不在当前 Codex 正式 Skill 清单；存在敏感会话文件和旧字段问题，不直接复制 |
| `.claude/skills/tiktok-influencer-sync` | 每日日期过滤、飞书字段经验 | 指令与采集/写表耦合，绝对路径和表 ID 硬编码 |
| `TikTok-Data-Engine` | 主页最近 10 条、Snowflake 时间、seen URL 增量 | 作为 collector 使用；先修 `authorStats` 粉丝字段，凭证不得入库 |

## 辅助能力

- `browser:control-in-app-browser` / `chrome:control-chrome`：对候选主页和最近内容做人工证据复核。
- `short-form-video` / `ffmpeg`：分析下载后的视频画面、口播和字幕；不替代来源链接。
- `data-analytics:analyze-data-quality` / `validate-data` / `design-kpis`：检查采集质量并设计转化指标。
- `cheat-trends`：用于内容趋势研究，不直接决定达人是否安全。
- `assumption-detection` / `fallacy-hunter`：区分事实、推断和证据不足。

## 不纳入核心链路的外部候选

曾检索到 `influencer-marketing`、`influencer-discovery`、`fit-scorer` 和 Apify 相关外部技能。它们没有直接安装到本项目：供应链、权限和评分口径尚未完成审计。若后续引入，应只作为 collector 或参考，不得绕过本项目的红灯标准。
