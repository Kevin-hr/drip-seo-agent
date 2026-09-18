# DripOps

DripOps 是绑定 Windows、Google Chrome 和 Mrshopplus 店铺的可恢复商品生产程序。它把状态、规则、验证和发布权保存在程序侧；ChatGPT、Claude、Gemini、本地模型或人工 JSON 只提供候选事实，不能绕过发布闸门。

## 当前版本

`0.1.0` 提供以下端到端骨架：

- 独立 Chrome Profile 与 Chrome DevTools Protocol 控制，不依赖 ChatGPT Chrome Extension。
- 分类商品扫描与上架状态快照。
- 商品名称、描述、图片、Slug 和发布状态读取。
- 每个商品独立、原子化的 JSON 检查点与 append-only 事件日志。
- `PASS/FIX/VERIFY/HOLD` 输入审计状态和独立的发布状态。
- SEO/PDP 3.2 确定性生成器与验证器；这是唯一活动执行标准。
- 业务保留的 SEO Title 结构为 `{Name} {SKU} Reps | Drip Sneakers`，其中 `{Name}` 是不含 SKU 的基础商品名，因此最终 SKU 只出现一次。
- 文件交换式 AI 适配器，以及 OpenAI-compatible Provider 基础实现。
- 保存后重新打开后台，核对名称、PDP、SEO、Slug 和 Keywords。
- 仅 READY 商品允许保存；仅保存回读一致的商品允许上架。
- 上架后检查前台 HTTP、H1、Meta、Canonical、noindex 和 JSON-LD。

## 构建

在 PowerShell 中运行：

```powershell
cd C:\Users\Administrator\Documents\01_Projects\dripsneakers\dripops
.\build.ps1
```

输出：

```text
dist\DripOps.exe
```

这是 self-contained 的 Windows x64 单文件程序，目标电脑不需要单独安装 .NET Runtime。

## 首次设置

```powershell
cd dist
.\DripOps.exe init
.\DripOps.exe login
```

`login` 会启动专用 Chrome Profile。只在这个窗口中登录一次 Mrshopplus。程序不会读取或保存密码。

## 标准工作流

### 1. 扫描分类

```powershell
.\DripOps.exe scan `
  --category-admin-url "https://www.mrshopplus.com/#/product/form_DTB_proCategory/0?action=3&pkValues=%5B536024167108124%5D" `
  --category-url "https://www.dripsneakers.org/Chrome-Hearts-Hoodies/" `
  --run-id "chrome-hearts-hoodies-2026-08-28" `
  --expected-total 13 `
  --expected-published 7 `
  --expected-unpublished 6
```

### 2. 读取未上架商品

```powershell
.\DripOps.exe snapshot `
  --run "chrome-hearts-hoodies-2026-08-28" `
  --products "536027361754137,536027374355992,536027374259477,536027373937950,536027373857554,536027373809436"
```

默认只处理分类快照中的未上架商品。加入 `--include-published` 才会读取已上架商品。

### 3. 导出给任意 AI

```powershell
.\DripOps.exe ai-export --run "chrome-hearts-hoodies-2026-08-28" --product "536027374355992"
```

程序会在 `data\ai-exchange\outbox` 生成完整任务包。任何 AI 都必须按 `schemas\ai-job-response.schema.json` 返回 JSON。

### 4. 导入 AI 结果

```powershell
.\DripOps.exe ai-import `
  --run "chrome-hearts-hoodies-2026-08-28" `
  --product "536027374355992" `
  --input ".\data\ai-exchange\inbox\536027374355992.response.json"
```

AI 输出不会直接写入后台。程序会重新生成 SEO/PDP 并执行全部确定性验证。无法确认的事实保持 HOLD。

也可以直接使用人工核验的 Facts 文件：

```powershell
.\DripOps.exe compose --run RUN_ID --product PRODUCT_ID --facts PRODUCT_ID.facts.json
```

若旧 URL 不符合当前小写 ASCII Slug 规则，必须显式迁移并保留旧路径供 301 配置：

```powershell
.\DripOps.exe compose --run RUN_ID --product PRODUCT_ID --facts PRODUCT_ID.facts.json --migrate-url
```

程序默认把当前旧路径写入 `redirectFrom`；也可用 `--redirect-from /OLD-PATH` 明确指定。

### 5. 保存草稿

```powershell
.\DripOps.exe apply --run "chrome-hearts-hoodies-2026-08-28"
```

只有 `ReleaseStatus = Ready` 的商品会被处理。保存后字段不一致的商品会进入 `Failed/Blocked`。

### 6. 保存并上架

```powershell
.\DripOps.exe apply --run "chrome-hearts-hoodies-2026-08-28" --publish
```

上架后前台验证不通过时，不会标记为 Verified，错误会保留在该商品检查点和事件日志中。

### 7. 查看状态

```powershell
.\DripOps.exe status --run "chrome-hearts-hoodies-2026-08-28"
```

### 8. 启动 Local Bridge（ChatGPT MCP 对接）

Local Bridge 是 ChatGPT MCP 插件与本地 MrShopPlus 执行能力之间的窄 HTTP 适配层。它**不重新实现**任何已经跑通的流程：写入仍走 `MrshopplusClient`，验收仍走 `FrontendVerifier`（由 `V44FrontendAuditor` 补充 V4.4 放置层检查）。

```powershell
$env:LOCAL_AGENT_TOKEN = "<长随机串>"
.\DripOps.exe serve --config .\config\dripops.json --mode live
```

仅跑安全演练（不接触 MrShopPlus，结果标记为 SIMULATED）：

```powershell
.\DripOps.exe serve --mode simulate
```

路由（PDP 阶段，6 条）：

```text
POST /api/chatgpt-mcp/products/search
POST /api/chatgpt-mcp/products/read
POST /api/chatgpt-mcp/products/prepare-v44
POST /api/chatgpt-mcp/products/execute-v44
POST /api/chatgpt-mcp/products/verify-v44
GET  /api/chatgpt-mcp/runs/status
GET  /health
```

分类页 route 暂缓，先证明 PDP 端到端。

**决策层是 V4.4，不是 3.2。** Bridge 在加载 3.2 机器标准之前就被路由，因此它根本无法读取 3.2 规则。原因：3.2 强制要求已验证 SKU，而 V4.4 §5/§5A 允许 `SKU_OMIT` 后照常发布，二者直接冲突。

写入闸门：

```text
execute-v44 只接受 product_id + plan_id
  → 不接受任何任意 SEO 字段
  → 执行前校验：plan 存在 / product 匹配 / 未执行过 /
                validation PASS / standard_hash 未变 / snapshot_hash 未变
```

计划不可变：`data\bridge\plans\PLAN_ID.json` 写入后只允许追加"已执行"与"已验证"两个状态，草稿与两个哈希不可改写。审计事件写在 `data\bridge\events.jsonl`，因此 `prepare` 不会改动 `data\runs` 的任何字节。

## AI 切换与续跑

流程状态位于：

```text
data\runs\RUN_ID\run.json
data\runs\RUN_ID\products\PRODUCT_ID.json
data\runs\RUN_ID\events.jsonl
```

更换 AI 时，不创建新运行。把同一个 outbox 任务包交给另一 AI，再导入新的结构化响应即可。程序以 Product ID、规则版本和已保存检查点为准，不依赖聊天记录。

运行以下命令可根据已保存检查点生成下一步和缺失的 AI 任务包：

```powershell
.\DripOps.exe resume --run "chrome-hearts-hoodies-2026-08-28"
```

## 安全边界

- 不把供应商代码自动当作官方 SKU。
- 不确定的核心事实必须 HOLD。
- AI 无权直接保存或上架。
- URL 变更必须提供 `redirectFrom`，但实际 301 仍属于站点级责任。
- Schema 由平台生成，DripOps 在发布后只读检查。
- 默认 Trust Claims 全部关闭；只有在 `config\dripops.json` 中经过业务验证后才能启用。
- Chrome/Mrshopplus DOM 更新时，程序应报 Selector 错误并停止，不盲目点击。
- `standards/SEO-PDP-3.1.1.*` 仅为历史参考，配置、构建和发布不得加载。
- 两套标准的适用范围必须分清：`standards/SEO-PDP-3.2.json` 只服务历史 CLI 命令（`compose` / `apply` 等）；`standards/SEO-PDP-V4.4.json` + `Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md` 才是 Local Bridge 的决策层。Bridge 在 3.2 加载之前路由，无法读取 3.2 规则。

## 自检

```powershell
.\DripOps.exe self-test
```
