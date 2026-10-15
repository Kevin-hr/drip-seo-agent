# Drip Sneakers Reddit 蓝海验证渠道与实测记录

执行日期：2026-10-14  
目标市场：United States  
动态数据新鲜期：30 天

## 已真实执行

### 1. Reddit 当前状态

数据源：Reddit canonical JSON post endpoint，格式：

`https://www.reddit.com/r/{subreddit}/comments/{post_id}.json?raw_json=1`

| Post ID | Votes | Comments | Locked | Removed | Archived |
|---|---:|---:|---|---|---|
| 1wmshhr | 0 | 12 | false | false | false |
| 1uyisco | 3 | 13 | false | false | false |
| 1vfmbh4 | 1 | 8 | false | false | false |
| 1v54768 | 3 | 2 | false | false | false |
| 1w90mi4 | 2 | 2 | false | false | false |
| 1vcokp1 | 1 | 4 | false | false | false |
| 1o7emyy | 79 | 178 | false | false | false |

结论：Reddit 活动硬门已经解决。`1o7emyy` 的 178 条评论验证了竞争过度，维持 rejected；其余帖子保持 provisional，不再因为 Reddit 指标缺失而待定。

### 2. 公开商业 SERP

执行了以下不带 `site:` 的公开查询：

- `best seller Louis Vuitton Tyler the Creator LV Trainer Blue rep`
- `rep sneakers size 48 Balenciaga Rick Owens LV`
- `best Maison Margiela GAT batch under $100 reddit`
- `sites for direct purchase replica sneakers reddit`

观测结果：

- `1vcokp1`（Sites for direct purchase?）在本次返回结果中出现。
- GAT 查询出现多个其他 Reddit 讨论，但 `1w90mi4` 未在本次返回结果中出现，说明主题有需求但竞争页较多。
- `1wmshhr` 和 `1vfmbh4` 未在对应宽泛商业查询的本次返回结果中出现。
- 该快照只证明当次可见性，不是美国 URL 月流量，也不是稳定排名证明。

### 3. 已授权数据源可用性

只检查了环境变量名称和配置文件位置，没有读取或输出密钥值。

结果：当前工作区未发现 Ahrefs、Semrush、DataForSEO、SerpAPI、Similarweb 或 GEO 监控凭据；仅发现方法文档，没有可调用的授权账户。

## 解决美国 URL 级流量与关键词数的渠道

### 方案 A：Ahrefs Site Explorer API（单一 SEO 首选）

- Endpoint：`GET /v3/site-explorer/organic-keywords`
- 参数：`target=<完整 Reddit URL>`、`mode=exact`、`country=us`、`date=<执行日>`。
- 输出保留：keyword、best_position、volume、traffic、last_update。
- 同时调用 URL metrics/overview 获得美国 URL 级自然流量与关键词总数。
- 官方文档：https://docs.ahrefs.com/en/api/reference/site-explorer/get-organic-keywords

### 方案 B：Semrush URL Reports API

- `type=url_rank&database=us`：美国 URL 级 Organic Keywords 与 Organic Traffic。
- `type=url_organic&database=us`：具体关键词、排名、搜索量和估算流量。
- 必须传完整 canonical URL，不能只查 `reddit.com` 域名。
- 官方文档：https://developer.semrush.com/api/v3/seo/url-reports/

### 方案 C：DataForSEO Labs（按调用付费，适合批量自动化）

- Endpoint：`POST /v3/dataforseo_labs/google/ranked_keywords/live`
- 参数：完整页面 URL、`location_name=United States`、`language_name=English`、`load_rank_absolute=true`。
- 输出：排名关键词、搜索量、SERP 位置及预估流量相关字段；按 URL 汇总关键词数量和估算流量。
- 官方文档：https://docs.dataforseo.com/v3/dataforseo_labs-google-ranked_keywords-live/

## 解决 GEO 引用的渠道

### Ahrefs Brand Radar

- 建立美国地区 custom prompts，覆盖 Google AI Overviews、AI Mode、ChatGPT、Perplexity、Gemini、Copilot。
- 每个候选至少配置 3 组 prompt：产品选择、卖家选择、问题解决。
- 记录候选 Reddit URL 是否为 Citation 或 Found in、出现平台、prompt、观察日期。
- 新 prompt 最长约 24 小时后显示数据；建议每周刷新，热点帖每日刷新。
- 官方说明：https://help.ahrefs.com/en/articles/11064852-what-is-brand-radar-and-how-to-use-it
- 指标定义：https://help.ahrefs.com/en/articles/15501968-ai-visibility-metrics

## 最小可行执行组合

1. Reddit `.json`：免费获取票数、评论、锁定、移除、归档状态。
2. DataForSEO Labs：批量获取 7 个 URL 的美国排名关键词与页面级估算流量；适合自动化和成本控制。
3. Ahrefs Brand Radar custom prompts：获取 AI 引用与 Found in 证据。
4. 每 7 天重跑 Reddit 与 SEO；GEO 新 prompt 首次等待 24 小时后复核。

如果已有 Ahrefs 全套账户，可用 Site Explorer + Brand Radar 替代第 2、3 项，减少供应商数量。

## 确认蓝海的验收条件

候选只能在以下证据全部满足时升级为 `confirmed`：

- Reddit 当前状态完整且帖子可回复；
- 美国 URL 级月自然流量和关键词数有提供商、市场、日期；
- 至少一个与购买相关的排名关键词有可复核位置；
- 相同主题帖子对比后竞争相对有利；
- 业务匹配强、商业意图中高；
- 版规允许存在透明、可执行的参与路径；
- GEO 如果纳入结论，必须保存真实引用页面或 API 记录，不能用手工问一次 AI 代替稳定监控。

当前状态：Reddit 指标已验证；美国 URL 级 SEO 与 GEO 仍需授权数据源，因此 6 个候选仍为 provisional，1 个为 rejected。
