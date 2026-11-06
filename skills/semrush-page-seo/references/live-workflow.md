# 实站操作：从真实需求到可验证页面

按当前工具文档操作浏览器；脚本负责结构化与验收，agent负责页面事实、意图和授权判断。每完成一阶段，输出实际动作、事实/证据、验证结果、下一项缺口。缺口影响准确性时标HOLD，不省略后改称完成。

## 1. 确认页面与可抓取性

确认目标URL、商品/服务、市场、语言和用户要求。实际页上的年份、版本、尺寸、定制、库存和购买入口分开读取。公开HTML/渲染DOM、HTTP状态、canonical/robots和Google保存的检查状态分别记录；提取器能取正文不证明正文位于初始HTML。Google的“已抓取，未收录”也不直接说明原因。

对于StockxJersey：复用已有官方GSC集成；Mrshopplus中的stockxshoes3是该站，但每次操作仍须核对实际店铺和目标记录。不因官方合作资料存在而把本店Fan Version写成官方限量版。

## 2. 验证浏览器实际可用

优先使用足够完成任务的专用连接器。需要浏览器时，用当次工具列出的受支持接口；复用已有浏览器/标签绑定，不固定Chrome ID、tab ID或历史授权URL参数。

最小验收为：读到目标页面 → 在可见输入框填写一个真实词并提交 → 读回对应标题、数据库和结果表。标签列表、已发出点击、操作超时均不等于成功。超时后先观察值或结果是否已经改变，再决定是否重试。

若调试器附着失败，按工具的browser-troubleshooting文档及官方诊断脚本定位。只报告已核实的失败层，不把版本差、登录或会员猜成根因。站点权限拒绝后停止该站点动作；用户提供Cookie也不能替代浏览器站点授权，不通过另一浏览器表面或后台接口绕过拒绝。

## 3. 查询与采集 Semrush

选择真实目标国家库；设备和报告日期以可见报告为准，未显示时记录HOLD，不根据当前系统时间补造。进入Keyword Magic，区分“所有关键词”的语义扩展与“广泛匹配”的核心词限制。用实际相关性剔除普通艺人T恤、门票、新闻等错配需求，不把整个语义扩展总量称为商品需求。

本地helper只在CUA会话内运行，使用已有的 `tab` 绑定。导入模块的绝对文件URL按实际skill路径填写：

```javascript
let capture = await import('file:///C:/Users/YourName/.codex/skills/semrush-page-seo/scripts/capture_semrush.mjs');
await capture.captureKeywordData(tab, 'C:/absolute/new-run/ui', {
  target_url: 'https://example.com/a-real-product',
  country: 'us', language: 'en', device: 'desktop',
  report_date: null, metrics_updated: '1 month'
});
```

上述值必须来自本次真实页面/目标；示例不是可用业务证据。先读返回的当前表格上下文，下一次CUA调用再保存截图，避免慢操作集中在一个长调用：

```javascript
await capture.captureKeywordScreenshot(tab, 'C:/absolute/new-run/ui');
```

helper只读取DOM表格/标题/已选tab/国家控件，保存原始行与context；不连接浏览器、不读cookie、不抓隐藏状态。它自动记录实际采集时间，并移除source URL中非公开查询参数。输出目录须为新目录，父目录须存在。country/device等仍需操作者对照可见控件确认。

DOM采集仅覆盖当前已渲染的行，不等于所有分页或整个数据库。需要完整词簇时核对UI总数和分页，使用实际导出或逐页采集后按同scope去重；缺页时明确写采集范围，不把当前100行称成完整1000行。

将输出交给 `workflow.py import-semrush`。对于原生Semrush CSV导出，先按数据契约规范化；不要把缺KD或“不可用”填成0。K/M展示值只代表工具显示精度。

## 4. SERP与词页决策

进入候选概览，记录volume、KD、意图、CPC、全球/国家量及更新时间。相同词的数据库、设备或日期不同，不静默合并成一条事实。不要从Enterprise导航推断订阅套餐。

读取实际SERP前十的URL和页面类型；若分析区尚未加载，可通过文档支持的页面滚动/按键加载后读回。对已观察DOM中的body可用 `tab.playwright.locator('body').press('End')`；不要用evaluate修改页面、调用隐藏API或遍历猜测URL。

结果至少记录：排名、真实落地URL、商品/合集/新闻/社交等类型、国家/设备、快照日期、采集时间及证据路径。形成 `serp-review.json`，明确商品相关性与页面类型是否匹配，并写判断理由。脚本不根据词面替你判断。

每个URL选一个主词及少量同意图变体。强势官方/大型平台占据SERP时，即使KD低也记录竞争限制；普通KD不是本站PKD，更不是排名概率。工具趋势有尖峰而逐月数据缺失时，稳定需求HOLD。

## 5. 官方 GSC 基线

使用 `official_gsc.mjs`，参数与凭据约定见[脚本契约](script-contract.md)。复用已有授权，取保存的URL检查和完整日表现。保留实际请求、HTTP状态、时间窗与page/query/date结果；查不到授权或API失败时保留错误并标HOLD。

Search Analytics基线与Semrush市场需求是不同口径；全部国家/设备不能直接说成US桌面表现。查询匿名化会省略明细，不能由无查询行推断0；页面总量有明确0返回才报0。Google检查状态中的空referringUrls/sitemaps不独自证明孤页或没站点地图。

## 6. 准备、保存与回读

依据实际商品事实生成字段级修改：准确title、description、商品主标题、替换现有首段或补充独立信息。避免追加第二段重复SEO文案；不调整未知价格、库存、季节、版本或整个站点模板来显示“做过工作”。

先把改什么/为什么/当前值/拟改值做成可审查结果。准备稿不调用CMS写入。获得实际站点访问与本次范围授权后，核对真实后台记录及URL，保存完整回滚备份；再使用受支持UI或已有获授权的官方CMS接口修改、保存回读。一个控制通道被权限拒绝时，不能换接口完成同一个被拒绝动作。

验证公开title、description、主标题/正文、canonical/robots与实际购买变体；截图显示可检查结果，并按工具要求嵌入回复。后台保存成功不能独自证明前台已生效。

将时间、权限、备份、保存回读和线上验证的真实证据传给 `record-publication`。这只是核验记录，不是发布工具。用户已授权的步骤持续完成；硬阻塞则先交付完整修改稿及已完成证据，再解释实际授权关卡和需用户恢复的权限。

## 7. 后续效果与收尾

保留优化前基线，在完整观察窗后按同一URL和口径比较曝光、点击、排名，再核对真实订单。收录恢复、流量增加和成交分别验证，不承诺时间或收益。

更新项目操作手册与交接状态；原始视频、ASR、截图和API响应保持原样。把操作机制写入docs，AGENTS只留规则及指针；本次事件写到交接/变更记录。历史离线评测分数不证明实站收益，离线回放也不刷新历史采集日期。

官方口径参考：[Google SEO指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)、[JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)、[Semrush Keyword Magic](https://www.semrush.com/kb/617-keyword-magic-tool-manual)、[KD定义](https://www.semrush.com/kb/1158-what-is-kd)。查询当前规则有疑问时按这些官方来源核实。
